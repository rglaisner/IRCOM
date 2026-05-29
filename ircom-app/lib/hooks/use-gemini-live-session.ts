"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildCheckpointSubmittedTurn,
  buildDoneSpeakingControlTurn,
  buildPauseControlTurn,
  buildRaiseHandControlTurn,
  buildResumeControlTurn,
} from "@/lib/atelier/live-instructions";
import { encodePcmChunk, LiveAudioPlayer, LiveMicCapture } from "@/lib/atelier/live-audio";
import { GEMINI_LIVE_MODEL_DEFAULT } from "@/lib/gemini/models";
import { toUserFacingError } from "@/lib/errors/user-facing";
import type { SupportedLanguage } from "@/lib/teacher/types";

export type LiveSessionState =
  | "idle"
  | "connecting"
  | "narrating"
  | "paused"
  | "handRaised"
  | "awaitingDeliverable";

interface UseGeminiLiveSessionOptions {
  language: SupportedLanguage;
  scenarioId: string;
  context?: "atelier" | "sprint";
  briefingStepIndex?: number;
  enabled?: boolean;
  onTurnComplete?: () => void;
  onFallbackRequired?: () => void;
}

interface LiveSessionHandle {
  sendClientContent: (params: {
    turns: Array<{ role: string; parts: Array<{ text: string }> }>;
    turnComplete: boolean;
  }) => void;
  sendRealtimeInput: (params: {
    audio?: { data: string; mimeType: string };
    audioStreamEnd?: boolean;
  }) => void;
  close: () => void;
}

export function useGeminiLiveSession(options: UseGeminiLiveSessionOptions) {
  const {
    language,
    scenarioId,
    context = "atelier",
    briefingStepIndex = 0,
    enabled = true,
    onTurnComplete,
    onFallbackRequired,
  } = options;

  const [sessionState, setSessionState] = useState<LiveSessionState>("idle");
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [engineLabel, setEngineLabel] = useState<"live" | "fallback">("live");

  const sessionRef = useRef<LiveSessionHandle | null>(null);
  const playerRef = useRef(new LiveAudioPlayer());
  const micRef = useRef(new LiveMicCapture());
  const transcriptRef = useRef("");
  const sessionStateRef = useRef<LiveSessionState>("idle");

  const appendTranscript = useCallback((line: string) => {
    transcriptRef.current = transcriptRef.current.length > 0
      ? `${transcriptRef.current}\n${line}`
      : line;
    setTranscript(transcriptRef.current);
  }, []);

  const appendMarker = useCallback(
    (markerFr: string, markerEn: string) => {
      appendTranscript(language === "fr" ? `— ${markerFr} —` : `— ${markerEn} —`);
    },
    [appendTranscript, language],
  );

  const sendControlTurn = useCallback((text: string) => {
    sessionRef.current?.sendClientContent({
      turns: [{ role: "user", parts: [{ text }] }],
      turnComplete: true,
    });
  }, []);

  const disconnect = useCallback(() => {
    micRef.current.stop();
    playerRef.current.stop();
    sessionRef.current?.close();
    sessionRef.current = null;
    setSessionState("idle");
    sessionStateRef.current = "idle";
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const connectLive = useCallback(async (stepIndexOverride?: number): Promise<boolean> => {
    if (!enabled) {
      return false;
    }

    const effectiveStepIndex = stepIndexOverride ?? briefingStepIndex;

    setErrorMessage(null);
    setSessionState("connecting");
    sessionStateRef.current = "connecting";
    transcriptRef.current = "";
    setTranscript("");

    try {
      const response = await fetch("/api/atelier/live-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          scenarioId,
          context,
          briefingStepIndex: effectiveStepIndex,
        }),
      });

      const body = (await response.json()) as {
        data?: { token: string; model: string; startTurn: string };
        error?: string;
      };

      if (!response.ok || !body.data?.token) {
        throw new Error(body.error ?? "Live token request failed.");
      }

      const { GoogleGenAI, Modality } = await import("@google/genai");

      const ai = new GoogleGenAI({
        apiKey: body.data.token,
        httpOptions: { apiVersion: "v1alpha" },
      });

      const session = await ai.live.connect({
        model: body.data.model ?? GEMINI_LIVE_MODEL_DEFAULT,
        callbacks: {
          onopen: () => {
            setSessionState("narrating");
            sessionStateRef.current = "narrating";
          },
          onmessage: (message) => {
            if (message.serverContent?.interrupted) {
              playerRef.current.stop();
            }

            const outputText = message.serverContent?.outputTranscription?.text;
            if (outputText) {
              appendTranscript(outputText);
            }

            const inputText = message.serverContent?.inputTranscription?.text;
            if (inputText) {
              appendTranscript(
                language === "fr" ? `Vous : ${inputText}` : `You: ${inputText}`,
              );
            }

            const audioData = message.data;
            if (audioData && sessionStateRef.current !== "paused") {
              void playerRef.current.playBase64Pcm(audioData);
            }

            if (message.serverContent?.turnComplete) {
              onTurnComplete?.();
            }
          },
          onerror: () => {
            setErrorMessage(
              language === "fr"
                ? "Connexion Live interrompue."
                : "Live connection interrupted.",
            );
          },
          onclose: () => {
            if (sessionStateRef.current !== "idle") {
              setSessionState("idle");
              sessionStateRef.current = "idle";
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });

      sessionRef.current = session;
      setEngineLabel("live");
      session.sendClientContent({
        turns: [{ role: "user", parts: [{ text: body.data.startTurn }] }],
        turnComplete: true,
      });
      return true;
    } catch (error: unknown) {
      setSessionState("idle");
      sessionStateRef.current = "idle";
      onFallbackRequired?.();
      return false;
    }
  }, [
    appendTranscript,
    briefingStepIndex,
    context,
    enabled,
    language,
    onFallbackRequired,
    onTurnComplete,
    scenarioId,
    sendControlTurn,
  ]);

  const startBriefing = useCallback(
    async (stepIndexOverride?: number): Promise<boolean> => {
      const connected = await connectLive(stepIndexOverride);
      if (!connected) {
        onFallbackRequired?.();
      }
      return connected;
    },
    [connectLive, onFallbackRequired],
  );

  const pauseBriefing = useCallback(() => {
    if (sessionStateRef.current !== "narrating" && sessionStateRef.current !== "handRaised") {
      return;
    }
    micRef.current.stop();
    playerRef.current.setMuted(true);
    playerRef.current.stop();
    appendMarker("Pause", "Pause");
    sendControlTurn(buildPauseControlTurn(language));
    setSessionState("paused");
    sessionStateRef.current = "paused";
  }, [appendMarker, language, sendControlTurn]);

  const resumeBriefing = useCallback(() => {
    if (sessionStateRef.current !== "paused") {
      return;
    }
    playerRef.current.setMuted(false);
    appendMarker("Reprise", "Resume");
    sendControlTurn(buildResumeControlTurn(language));
    setSessionState("narrating");
    sessionStateRef.current = "narrating";
  }, [appendMarker, language, sendControlTurn]);

  const raiseHand = useCallback(async () => {
    if (!sessionRef.current) {
      return;
    }
    playerRef.current.setMuted(false);
    sendControlTurn(buildRaiseHandControlTurn(language));
    setSessionState("handRaised");
    sessionStateRef.current = "handRaised";

    await micRef.current.start((chunk) => {
      const encoded = encodePcmChunk(chunk);
      sessionRef.current?.sendRealtimeInput({
        audio: encoded,
      });
    });
  }, [language, sendControlTurn]);

  const doneSpeaking = useCallback(() => {
    if (sessionStateRef.current !== "handRaised") {
      return;
    }
    micRef.current.stop();
    sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
    sendControlTurn(buildDoneSpeakingControlTurn(language));
    setSessionState("narrating");
    sessionStateRef.current = "narrating";
  }, [language, sendControlTurn]);

  const enterAwaitingDeliverable = useCallback(() => {
    micRef.current.stop();
    playerRef.current.setMuted(true);
    setSessionState("awaitingDeliverable");
    sessionStateRef.current = "awaitingDeliverable";
  }, []);

  const submitCheckpointToLive = useCallback(
    (summary: string, stepIndex: number) => {
      playerRef.current.setMuted(false);
      sendControlTurn(buildCheckpointSubmittedTurn(language, summary, stepIndex));
      setSessionState("narrating");
      sessionStateRef.current = "narrating";
    },
    [language, sendControlTurn],
  );

  useEffect(() => {
    return () => {
      disconnect();
      playerRef.current.dispose();
    };
  }, [disconnect]);

  useEffect(() => {
    disconnect();
    transcriptRef.current = "";
    setTranscript("");
  }, [scenarioId, disconnect]);

  return {
    sessionState,
    transcript,
    errorMessage,
    engineLabel,
    clearError,
    startBriefing,
    pauseBriefing,
    resumeBriefing,
    raiseHand,
    doneSpeaking,
    enterAwaitingDeliverable,
    submitCheckpointToLive,
    disconnect,
    setTranscript,
  };
}
