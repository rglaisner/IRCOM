"use client";

import { useEffect, useState } from "react";
import {
  createDefaultProgress,
  migrateStoredProgress,
  progressSchemaVersionKey,
  CURRENT_PROGRESS_SCHEMA_VERSION,
  studentProgressStorageKey,
} from "@/lib/teacher/progress";
import { clearPersistedSession } from "@/lib/teacher/reset-session";
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

function migrateHistoryKeys(): void {
  const legacyPairs: Array<[string, string]> = [
    ["coach", "course"],
    ["exercise", "atelier"],
  ];

  for (const [legacy, next] of legacyPairs) {
    const legacyKey = `${historyStoragePrefix}:${legacy}`;
    const nextKey = `${historyStoragePrefix}:${next}`;
    const legacyValue = window.localStorage.getItem(legacyKey);
    if (legacyValue && !window.localStorage.getItem(nextKey)) {
      window.localStorage.setItem(nextKey, legacyValue);
    }
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

      migrateHistoryKeys();
      const rawProgress = window.localStorage.getItem(studentProgressStorageKey);
      setProgress(
        migrateStoredProgress(
          rawProgress ? (JSON.parse(rawProgress) as unknown) : null,
        ),
      );
      window.localStorage.setItem(
        progressSchemaVersionKey,
        String(CURRENT_PROGRESS_SCHEMA_VERSION),
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

  const getHistory = (mode: TeacherMode): TeacherRequestMessage[] => {
    if (typeof window === "undefined") {
      return [];
    }
    return getSafeJson<TeacherRequestMessage[]>(
      window.localStorage.getItem(`${historyStoragePrefix}:${mode}`),
      [],
    );
  };

  const appendHistory = (
    mode: TeacherMode,
    studentInput: string,
    teacherResponse: TeacherResponseOutput,
  ) => {
    if (typeof window === "undefined") {
      return;
    }
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

  const resetSession = () => {
    clearPersistedSession();
    setProgress(createDefaultProgress());
    window.location.assign("/");
  };

  return {
    language,
    progress,
    isHydrated,
    updateLanguage,
    registerInteraction,
    getHistory,
    appendHistory,
    resetSession,
  };
}
