import { studentProgressStorageKey } from "@/lib/teacher/progress";
import { scenarioAttemptsStorageKey } from "@/lib/teacher/scenario-attempts";
import { teacherModes } from "@/lib/teacher/types";

const historyStoragePrefix = "ircom-gemini-history";

const legacyHistoryModes = ["coach", "exercise"] as const;

/** Removes workshop progress, scenario attempts, and coach chat history. Keeps language preference. */
export function clearPersistedSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(studentProgressStorageKey);
  window.localStorage.removeItem(scenarioAttemptsStorageKey);

  for (const mode of teacherModes) {
    window.localStorage.removeItem(`${historyStoragePrefix}:${mode}`);
  }

  for (const legacyMode of legacyHistoryModes) {
    window.localStorage.removeItem(`${historyStoragePrefix}:${legacyMode}`);
  }
}
