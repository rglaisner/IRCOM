"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  advanceAfterNarration,
  createBriefingOrchestratorSnapshot,
  markDeliverableSubmitted,
  resolveBriefingSteps,
  startBriefingOrchestration,
  type BriefingOrchestratorSnapshot,
} from "@/lib/atelier/briefing-orchestrator";
import { useSpeechSynthesis } from "@/lib/atelier/speech";
import { getVoiceEngine } from "@/lib/gemini/models";
import { useAtelierSession } from "@/lib/hooks/use-atelier-session";
import { useGeminiLiveSession } from "@/lib/hooks/use-gemini-live-session";
import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import type { SprintScenario } from "@/lib/teacher/curriculum-types";
import type { SupportedLanguage, TeacherRequestMessage } from "@/lib/teacher/types";

type SessionScenario = AtelierScenario | SprintScenario;

function getOrchestratorForScenario(scenario: SessionScenario): BriefingOrchestratorSnapshot {
  if ("briefingSteps" in scenario) {
    return createBriefingOrchestratorSnapshot(scenario);
  }

  return createBriefingOrchestratorSnapshot(
    {
      ...scenario,
      summary: scenario.title,
      linkedCourseSectionIds: [],
      briefingSteps: resolveBriefingSteps({
        ...scenario,
        summary: scenario.title,
        linkedCourseSectionIds: [],
      } as AtelierScenario),
    } as AtelierScenario,
  );
}

function startOrchestratorForScenario(scenario: SessionScenario): BriefingOrchestratorSnapshot {
  if ("briefingSteps" in scenario) {
    return startBriefingOrchestration(scenario);
  }

  return createBriefingOrchestratorSnapshot(
    {
      ...scenario,
      summary: scenario.title,
      linkedCourseSectionIds: [],
      briefingSteps: [{ type: "narrate", id: "full-briefing", hint: scenario.narrationScript }],
    } as AtelierScenario,
    0,
    "narrating",
  );
}

interface UseVoiceBriefingOptions {
  language: SupportedLanguage;
  scenario: SessionScenario;
  context?: "atelier" | "sprint";
  chatHistory: TeacherRequestMessage[];
  onChatReply: (question: string, answer: string) => void;
}

async function playGeminiTts(language: SupportedLanguage, text: string): Promise<boolean> {
  try {
    const response = await fetch("/api/atelier/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, text }),
    });
    const body = (await response.json()) as {
      data?: { audioBase64: string; mimeType: string };
    };
    if (!response.ok || !body.data?.audioBase64) {
      return false;
    }

    const audio = new Audio(`data:${body.data.mimeType};base64,${body.data.audioBase64}`);
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function useVoiceBriefing(options: UseVoiceBriefingOptions) {
  const { language, scenario, context = "atelier", chatHistory, onChatReply } = options;
  const voiceEngine = getVoiceEngine();
  const useLive = voiceEngine === "live";

  const [orchestrator, setOrchestrator] = useState<BriefingOrchestratorSnapshot>(() =>
    getOrchestratorForScenario(scenario),
  );
  const [fallbackMode, setFallbackMode] = useState(false);
  const orchestratorRef = useRef(orchestrator);
  orchestratorRef.current = orchestrator;

  const fallbackSession = useAtelierSession(language);
  const { speak, stop: stopSpeech, isSpeaking } = useSpeechSynthesis(language);

  const handleLiveTurnComplete = useCallback(() => {
    if (context !== "atelier" || !("briefingSteps" in scenario)) {
      return;
    }

    setOrchestrator((current) => {
      if (current.state !== "narrating") {
        return current;
      }
      return advanceAfterNarration(current);
    });
  }, [context, scenario]);

  const handleFallbackRequired = useCallback(() => {
    setFallbackMode(true);
  }, []);

  const liveSession = useGeminiLiveSession({
    language,
    scenarioId: scenario.id,
    context,
    briefingStepIndex: orchestrator.stepIndex,
    enabled: useLive && !fallbackMode,
    onTurnComplete: handleLiveTurnComplete,
    onFallbackRequired: handleFallbackRequired,
  });

  const speakFallbackText = useCallback(
    async (text: string) => {
      if (text.trim().length === 0) {
        return;
      }
      const ttsOk = await playGeminiTts(language, text);
      if (!ttsOk) {
        speak(text);
      }
    },
    [language, speak],
  );

  const startBriefing = useCallback(async () => {
    setOrchestrator(startOrchestratorForScenario(scenario));

    if (useLive && !fallbackMode) {
      const connected = await liveSession.startBriefing();
      if (connected) {
        return;
      }
      setFallbackMode(true);
    }

    const text = await fallbackSession.streamNarration(scenario.id, { context });
    if (text.trim().length > 0) {
      await speakFallbackText(text);
    }
  }, [
    context,
    fallbackMode,
    fallbackSession,
    liveSession,
    scenario,
    speakFallbackText,
    useLive,
  ]);

  const pauseBriefing = useCallback(() => {
    if (useLive && !fallbackMode && liveSession.sessionState !== "idle") {
      liveSession.pauseBriefing();
      return;
    }
    stopSpeech();
  }, [fallbackMode, liveSession, stopSpeech, useLive]);

  const resumeBriefing = useCallback(() => {
    if (useLive && !fallbackMode && liveSession.sessionState === "paused") {
      liveSession.resumeBriefing();
      return;
    }
    if (fallbackSession.transcript.trim().length > 0) {
      void speakFallbackText(fallbackSession.transcript);
    }
  }, [fallbackMode, fallbackSession.transcript, liveSession, speakFallbackText, useLive]);

  const raiseHand = useCallback(async () => {
    if (useLive && !fallbackMode && liveSession.sessionState !== "idle") {
      await liveSession.raiseHand();
      return;
    }
    stopSpeech();
  }, [fallbackMode, liveSession, stopSpeech, useLive]);

  const doneSpeaking = useCallback(() => {
    if (useLive && !fallbackMode) {
      liveSession.doneSpeaking();
    }
  }, [fallbackMode, liveSession, useLive]);

  const submitCheckpointToVoice = useCallback(
    (summary: string) => {
      if (useLive && !fallbackMode) {
        liveSession.submitCheckpointToLive(summary, orchestratorRef.current.stepIndex);
      } else {
        void speakFallbackText(summary);
      }
      setOrchestrator((current) => markDeliverableSubmitted(current));
    },
    [fallbackMode, liveSession, speakFallbackText, useLive],
  );

  const askQuestion = useCallback(
    async (question: string) => {
      if (useLive && !fallbackMode && liveSession.sessionState === "idle") {
        return null;
      }
      stopSpeech();
      const answer = await fallbackSession.askQuestion(scenario.id, question, chatHistory);
      if (answer) {
        onChatReply(question, answer);
        if (fallbackMode || !useLive) {
          await speakFallbackText(answer);
        }
      }
      return answer;
    },
    [
      chatHistory,
      fallbackMode,
      fallbackSession,
      liveSession.sessionState,
      onChatReply,
      scenario.id,
      speakFallbackText,
      stopSpeech,
      useLive,
    ],
  );

  useEffect(() => {
    setOrchestrator(getOrchestratorForScenario(scenario));
    setFallbackMode(false);
    stopSpeech();
  }, [scenario.id, scenario, stopSpeech]);

  useEffect(() => {
    if (
      orchestrator.isCheckpointActive &&
      useLive &&
      !fallbackMode &&
      liveSession.sessionState === "narrating"
    ) {
      liveSession.enterAwaitingDeliverable();
    }
  }, [
    fallbackMode,
    liveSession,
    orchestrator.isCheckpointActive,
    useLive,
  ]);

  const transcript =
    fallbackSession.transcript.length > 0
      ? fallbackSession.transcript
      : liveSession.transcript;
  const errorMessage = liveSession.errorMessage ?? fallbackSession.errorMessage;
  const isNarrating =
    fallbackSession.isNarrating ||
    liveSession.sessionState === "connecting" ||
    liveSession.sessionState === "narrating";

  return {
    orchestrator,
    sessionState: liveSession.sessionState,
    transcript,
    errorMessage,
    isNarrating,
    isSpeaking,
    isChatLoading: fallbackSession.isChatLoading,
    isLiveActive: useLive && !fallbackMode && liveSession.sessionState !== "idle",
    startBriefing,
    pauseBriefing,
    resumeBriefing,
    raiseHand,
    doneSpeaking,
    submitCheckpointToVoice,
    askQuestion,
  };
}
