"use client";

import { useEffect, useState } from "react";
import { createDefaultProgress, studentProgressStorageKey } from "@/lib/teacher/progress";
import type {
  StudentProgress,
  SupportedLanguage,
  TeacherMode,
  TeacherRequestMessage,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

const languageStorageKey = "ircom-gemini-language";
const historyStoragePrefix = "ircom-gemini-history";

function getSafeJson<T>(value: string | null, fallbackValue: T): T {
  if (!value) {
    return fallbackValue;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallbackValue;
  }
}

export function useTeacherState() {
  const [language, setLanguage] = useState<SupportedLanguage>("fr");
  const [progress, setProgress] = useState<StudentProgress>(createDefaultProgress);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const persistedLanguage = window.localStorage.getItem(languageStorageKey);
      if (persistedLanguage === "fr" || persistedLanguage === "en") {
        setLanguage(persistedLanguage);
      }

      setProgress(
        getSafeJson<StudentProgress>(
          window.localStorage.getItem(studentProgressStorageKey),
          createDefaultProgress(),
        ),
      );
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const updateLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguage(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
  };

  const registerInteraction = (mode: TeacherMode) => {
    setProgress((previousProgress) => {
      const updatedProgress: StudentProgress = {
        ...previousProgress,
        [mode]: {
          interactionsCompleted: previousProgress[mode].interactionsCompleted + 1,
          lastUpdatedAtIso: new Date().toISOString(),
        },
      };
      window.localStorage.setItem(
        studentProgressStorageKey,
        JSON.stringify(updatedProgress),
      );
      return updatedProgress;
    });
  };

  const getHistory = (mode: TeacherMode): TeacherRequestMessage[] =>
    getSafeJson<TeacherRequestMessage[]>(
      window.localStorage.getItem(`${historyStoragePrefix}:${mode}`),
      [],
    );

  const appendHistory = (
    mode: TeacherMode,
    studentInput: string,
    teacherResponse: TeacherResponseOutput,
  ) => {
    const existingHistory = getHistory(mode);
    const updatedHistory = [
      ...existingHistory,
      { role: "student" as const, content: studentInput },
      { role: "teacher" as const, content: teacherResponse.feedback },
    ].slice(-12);

    window.localStorage.setItem(
      `${historyStoragePrefix}:${mode}`,
      JSON.stringify(updatedHistory),
    );
  };

  return {
    language,
    progress,
    isHydrated,
    updateLanguage,
    registerInteraction,
    getHistory,
    appendHistory,
  };
}
