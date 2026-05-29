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

export interface AskQuestionResult {
  answer: string | null;
  error: string | null;
}

interface UseVoiceBriefingOptions {
  language: SupportedLanguage;
  scenario: SessionScenario;
  context?: "atelier" | "sprint";
  chatHistory: TeacherRequestMessage[];
  onChatReply: (question: string, answer: string) => void;
  onBriefingStart?: () => void;
}

export function useVoiceBriefing(options: UseVoiceBriefingOptions) {
  const {
    language,
    scenario,
    context = "atelier",
    chatHistory,
    onChatReply,
    onBriefingStart,
  } = options;
  const voiceEngine = getVoiceEngine();
  const useLive = voiceEngine === "live";

  const [orchestrator, setOrchestrator] = useState<BriefingOrchestratorSnapshot>(() =>
    getOrchestratorForScenario(scenario),
  );
  const [textFallbackMode, setTextFallbackMode] = useState(false);
  const [liveFallbackReason, setLiveFallbackReason] = useState<string | null>(null);
  const [qaTranscript, setQaTranscript] = useState("");
  const orchestratorRef = useRef(orchestrator);
  orchestratorRef.current = orchestrator;
  const stepIndexRef = useRef(0);

  const fallbackSession = useAtelierSession(language);

  const advanceOrchestratorAfterNarration = useCallback(() => {
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

  const handleLiveTurnComplete = useCallback(() => {
    advanceOrchestratorAfterNarration();
  }, [advanceOrchestratorAfterNarration]);

  const handleFallbackRequired = useCallback((reason: string | null) => {
    setTextFallbackMode(true);
    setLiveFallbackReason(reason);
  }, []);

  const liveSession = useGeminiLiveSession({
    language,
    scenarioId: scenario.id,
    context,
    briefingStepIndex: orchestrator.stepIndex,
    enabled: useLive,
    onTurnComplete: handleLiveTurnComplete,
    onFallbackRequired: handleFallbackRequired,
  });

  const runTextFallbackNarration = useCallback(async () => {
    liveSession.clearError();
    const text = await fallbackSession.streamNarration(scenario.id, { context });
    if (text.trim().length > 0) {
      setTextFallbackMode(true);
      liveSession.clearError();
      advanceOrchestratorAfterNarration();
    }
  }, [
    advanceOrchestratorAfterNarration,
    context,
    fallbackSession,
    liveSession,
    scenario.id,
  ]);

  const startBriefing = useCallback(async () => {
    onBriefingStart?.();
    setTextFallbackMode(false);
    setLiveFallbackReason(null);
    liveSession.clearError();

    const started = startOrchestratorForScenario(scenario);
    setOrchestrator(started);
    stepIndexRef.current = started.stepIndex;

    if (useLive) {
      const connected = await liveSession.startBriefing(stepIndexRef.current);
      if (connected) {
        return;
      }
    }

    await runTextFallbackNarration();
  }, [
    liveSession,
    onBriefingStart,
    runTextFallbackNarration,
    scenario,
    useLive,
  ]);

  const pauseBriefing = useCallback(() => {
    if (useLive && !textFallbackMode && liveSession.sessionState !== "idle") {
      liveSession.pauseBriefing();
    }
  }, [liveSession, textFallbackMode, useLive]);

  const resumeBriefing = useCallback(() => {
    if (useLive && !textFallbackMode && liveSession.sessionState === "paused") {
      liveSession.resumeBriefing();
    }
  }, [liveSession, textFallbackMode, useLive]);

  const raiseHand = useCallback(async () => {
    if (useLive && !textFallbackMode && liveSession.sessionState !== "idle") {
      await liveSession.raiseHand();
    }
  }, [liveSession, textFallbackMode, useLive]);

  const doneSpeaking = useCallback(() => {
    if (useLive && !textFallbackMode) {
      liveSession.doneSpeaking();
    }
  }, [liveSession, textFallbackMode, useLive]);

  const submitCheckpointToVoice = useCallback(
    (summary: string) => {
      if (useLive && !textFallbackMode) {
        liveSession.submitCheckpointToLive(summary, orchestratorRef.current.stepIndex);
      } else {
        setQaTranscript((prev) =>
          prev.length > 0 ? `${prev}\n\n${summary}` : summary,
        );
      }
      setOrchestrator((current) => markDeliverableSubmitted(current));
    },
    [liveSession, textFallbackMode, useLive],
  );

  const appendQaLine = useCallback((question: string, answer: string) => {
    const studentLabel = language === "fr" ? "Vous" : "You";
    const coachLabel = "Coach";
    const block = `${studentLabel}: ${question}\n${coachLabel}: ${answer}`;
    setQaTranscript((prev) => (prev.length > 0 ? `${prev}\n\n${block}` : block));
  }, [language]);

  const askQuestion = useCallback(
    async (question: string): Promise<AskQuestionResult> => {
      const answer = await fallbackSession.askQuestion(scenario.id, question, chatHistory, {
        context,
      });
      if (answer) {
        onChatReply(question, answer);
        appendQaLine(question, answer);
        return { answer, error: null };
      }
      return {
        answer: null,
        error: fallbackSession.errorMessage ?? null,
      };
    },
    [appendQaLine, chatHistory, context, fallbackSession, onChatReply, scenario.id],
  );

  useEffect(() => {
    setOrchestrator(getOrchestratorForScenario(scenario));
    setTextFallbackMode(false);
    setLiveFallbackReason(null);
    setQaTranscript("");
    liveSession.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when scenario changes
  }, [scenario.id]);

  useEffect(() => {
    if (
      orchestrator.isCheckpointActive &&
      useLive &&
      !textFallbackMode &&
      liveSession.sessionState === "narrating"
    ) {
      liveSession.enterAwaitingDeliverable();
    }
  }, [liveSession, orchestrator.isCheckpointActive, textFallbackMode, useLive]);

  const liveTranscript = liveSession.transcript;
  const narrateTranscript = fallbackSession.transcript;
  const baseTranscript =
    narrateTranscript.length > 0 ? narrateTranscript : liveTranscript;
  const transcript =
    qaTranscript.length > 0
      ? baseTranscript.length > 0
        ? `${baseTranscript}\n\n${qaTranscript}`
        : qaTranscript
      : baseTranscript;

  const narrateFailed = textFallbackMode && narrateTranscript.trim().length === 0;
  const errorMessage =
    narrateFailed && fallbackSession.errorMessage
      ? fallbackSession.errorMessage
      : !textFallbackMode
        ? liveSession.errorMessage
        : null;

  const isNarrating =
    fallbackSession.isNarrating ||
    liveSession.sessionState === "connecting" ||
    liveSession.sessionState === "narrating";

  return {
    orchestrator,
    sessionState: liveSession.sessionState,
    transcript,
    errorMessage,
    liveFallbackReason,
    isNarrating,
    isChatLoading: fallbackSession.isChatLoading,
    isLiveActive: useLive && !textFallbackMode && liveSession.sessionState !== "idle",
    isTextFallback: textFallbackMode,
    startBriefing,
    pauseBriefing,
    resumeBriefing,
    raiseHand,
    doneSpeaking,
    submitCheckpointToVoice,
    askQuestion,
    disconnectLive: liveSession.disconnect,
  };
}
