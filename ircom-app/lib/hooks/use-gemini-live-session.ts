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

const SETUP_COMPLETE_TIMEOUT_MS = 20_000;

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
  onFallbackRequired?: (reason: string | null) => void;
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

function isConstrainedLiveToken(token: string): boolean {
  return token.startsWith("auth_tokens/");
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
  const pendingStartTurnRef = useRef<string | null>(null);
  const setupCompleteResolveRef = useRef<(() => void) | null>(null);
  const setupCompleteRejectRef = useRef<((error: Error) => void) | null>(null);

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

  const clearSetupWaiters = useCallback(() => {
    setupCompleteResolveRef.current = null;
    setupCompleteRejectRef.current = null;
    pendingStartTurnRef.current = null;
  }, []);

  const flushPendingStartTurn = useCallback(() => {
    const turn = pendingStartTurnRef.current;
    const session = sessionRef.current;
    if (!turn || !session) {
      return;
    }
    pendingStartTurnRef.current = null;
    session.sendClientContent({
      turns: [{ role: "user", parts: [{ text: turn }] }],
      turnComplete: true,
    });
  }, []);

  const sendControlTurn = useCallback((text: string) => {
    sessionRef.current?.sendClientContent({
      turns: [{ role: "user", parts: [{ text }] }],
      turnComplete: true,
    });
  }, []);

  const disconnect = useCallback(() => {
    clearSetupWaiters();
    micRef.current.stop();
    playerRef.current.stop();
    sessionRef.current?.close();
    sessionRef.current = null;
    setSessionState("idle");
    sessionStateRef.current = "idle";
  }, [clearSetupWaiters]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const waitForSetupComplete = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      setupCompleteResolveRef.current = resolve;
      setupCompleteRejectRef.current = reject;

      window.setTimeout(() => {
        if (setupCompleteRejectRef.current !== reject) {
          return;
        }
        clearSetupWaiters();
        reject(
          new Error(
            language === "fr"
              ? "Délai dépassé en attente de la session Live."
              : "Timed out waiting for Live session setup.",
          ),
        );
      }, SETUP_COMPLETE_TIMEOUT_MS);
    });
  }, [clearSetupWaiters, language]);

  const connectLive = useCallback(
    async (stepIndexOverride?: number): Promise<boolean> => {
      if (!enabled) {
        return false;
      }

      const effectiveStepIndex = stepIndexOverride ?? briefingStepIndex;

      setErrorMessage(null);
      setSessionState("connecting");
      sessionStateRef.current = "connecting";
      transcriptRef.current = "";
      setTranscript("");
      clearSetupWaiters();

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

        const token = body.data.token;
        const model = body.data.model ?? GEMINI_LIVE_MODEL_DEFAULT;
        const constrained = isConstrainedLiveToken(token);

        const { GoogleGenAI } = await import("@google/genai");

        const ai = new GoogleGenAI({
          apiKey: token,
          httpOptions: { apiVersion: "v1alpha" },
        });

        pendingStartTurnRef.current = body.data.startTurn;

        const setupPromise = waitForSetupComplete();

        const session = await ai.live.connect({
          model,
          callbacks: {
            onopen: () => {
              /* Narrating starts after setupComplete, not on socket open. */
            },
            onmessage: (message) => {
              if (message.setupComplete) {
                flushPendingStartTurn();
                setSessionState("narrating");
                sessionStateRef.current = "narrating";
                setupCompleteResolveRef.current?.();
                setupCompleteResolveRef.current = null;
                setupCompleteRejectRef.current = null;
              }

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
            onerror: (event: ErrorEvent) => {
              const detail =
                event.message?.trim().length > 0
                  ? event.message
                  : language === "fr"
                    ? "Connexion Live interrompue."
                    : "Live connection interrupted.";
              setErrorMessage(detail);
              setupCompleteRejectRef.current?.(new Error(detail));
              setupCompleteRejectRef.current = null;
              setupCompleteResolveRef.current = null;
            },
            onclose: () => {
              if (sessionStateRef.current !== "idle") {
                setSessionState("idle");
                sessionStateRef.current = "idle";
              }
            },
          },
          // Config is locked in the ephemeral token (auth_tokens/*); do not pass config here.
        });

        sessionRef.current = session;
        setEngineLabel("live");

        await setupPromise;
        return true;
      } catch (error: unknown) {
        const reason =
          error instanceof Error ? error.message : "Live connection failed.";
        setErrorMessage(toUserFacingError(language, error));
        setSessionState("idle");
        sessionStateRef.current = "idle";
        disconnect();
        onFallbackRequired?.(reason);
        return false;
      }
    },
    [
      appendTranscript,
      briefingStepIndex,
      clearSetupWaiters,
      context,
      disconnect,
      enabled,
      flushPendingStartTurn,
      language,
      onFallbackRequired,
      onTurnComplete,
      scenarioId,
      waitForSetupComplete,
    ],
  );

  const startBriefing = useCallback(
    async (stepIndexOverride?: number): Promise<boolean> => {
      return connectLive(stepIndexOverride);
    },
    [connectLive],
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
