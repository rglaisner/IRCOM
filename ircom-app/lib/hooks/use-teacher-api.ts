"use client";

import { useState } from "react";
import { toUserFacingError } from "@/lib/errors/user-facing";
import type {
  SupportedLanguage,
  TeacherRequestInput,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

export function useTeacherApi(language: SupportedLanguage) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");

  const submit = async (
    payload: TeacherRequestInput,
    options?: { stream?: boolean },
  ): Promise<TeacherResponseOutput | null> => {
    setIsLoading(true);
    setErrorMessage(null);
    setStreamingText("");

    try {
      if (options?.stream) {
        const response = await fetch("/api/teacher/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
          throw new Error("Stream request failed.");
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
          setStreamingText(accumulated);
        }

        const parsedJson = JSON.parse(accumulated) as TeacherResponseOutput;
        return parsedJson;
      }

      const response = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as {
        data?: TeacherResponseOutput;
        error?: string;
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error ?? "Request failed.");
      }

      return body.data;
    } catch (error: unknown) {
      setErrorMessage(toUserFacingError(language, error));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { submit, isLoading, errorMessage, streamingText };
}
