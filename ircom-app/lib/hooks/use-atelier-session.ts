"use client";

import { useCallback, useState } from "react";
import { toUserFacingError } from "@/lib/errors/user-facing";
import type { SupportedLanguage, TeacherRequestMessage } from "@/lib/teacher/types";

export function useAtelierSession(language: SupportedLanguage) {
  const [isNarrating, setIsNarrating] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamNarration = useCallback(
    async (
      scenarioId: string,
      options?: { context?: "atelier" | "sprint" },
    ): Promise<string> => {
      setIsNarrating(true);
      setErrorMessage(null);
      setTranscript("");

      try {
        const response = await fetch("/api/atelier/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            scenarioId,
            context: options?.context ?? "atelier",
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Narration request failed.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setTranscript(accumulated);
        }

        return accumulated;
      } catch (error: unknown) {
        setErrorMessage(toUserFacingError(language, error));
        return "";
      } finally {
        setIsNarrating(false);
      }
    },
    [language],
  );

  const askQuestion = useCallback(
    async (
      scenarioId: string,
      question: string,
      history: TeacherRequestMessage[],
    ): Promise<string | null> => {
      setIsChatLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/atelier/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            scenarioId,
            question,
            transcript,
            history,
          }),
        });

        const body = (await response.json()) as { data?: { answer: string }; error?: string };
        if (!response.ok || !body.data?.answer) {
          throw new Error(body.error ?? "Chat request failed.");
        }

        return body.data.answer;
      } catch (error: unknown) {
        setErrorMessage(toUserFacingError(language, error));
        return null;
      } finally {
        setIsChatLoading(false);
      }
    },
    [language, transcript],
  );

  return {
    streamNarration,
    askQuestion,
    isNarrating,
    isChatLoading,
    transcript,
    errorMessage,
    setTranscript,
  };
}
