import type { TeacherMode } from "@/lib/teacher/types";

export const scenarioAttemptsStorageKey = "ircom-scenario-attempts";

export type ScenarioSessionStatus = "active" | "locked_out";

export interface ScenarioAttemptRecord {
  attemptCount: number;
  sessionStatus: ScenarioSessionStatus;
}

export type ScenarioAttemptsStore = Record<string, ScenarioAttemptRecord>;

function attemptKey(mode: TeacherMode, scenarioId: string): string {
  return `${mode}:${scenarioId}`;
}

function readStore(): ScenarioAttemptsStore {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(scenarioAttemptsStorageKey);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as ScenarioAttemptsStore;
  } catch {
    return {};
  }
}

function writeStore(store: ScenarioAttemptsStore): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(scenarioAttemptsStorageKey, JSON.stringify(store));
}

export function getScenarioAttempt(
  mode: TeacherMode,
  scenarioId: string,
): ScenarioAttemptRecord {
  const store = readStore();
  return store[attemptKey(mode, scenarioId)] ?? { attemptCount: 0, sessionStatus: "active" };
}

export function recordSubmissionAttempt(
  mode: TeacherMode,
  scenarioId: string,
  verdict: "accepted" | "needs_revision" | "off_topic" | "game_over",
): ScenarioAttemptRecord {
  const key = attemptKey(mode, scenarioId);
  const store = readStore();
  const current = store[key] ?? { attemptCount: 0, sessionStatus: "active" as const };

  if (current.sessionStatus === "locked_out") {
    return current;
  }

  const nextCount = current.attemptCount + 1;
  const lockedOut =
    verdict === "game_over" || (verdict !== "accepted" && nextCount >= 3);

  const updated: ScenarioAttemptRecord = {
    attemptCount: nextCount,
    sessionStatus: lockedOut ? "locked_out" : "active",
  };

  store[key] = updated;
  writeStore(store);
  return updated;
}

export function resetScenarioAttempts(mode: TeacherMode, scenarioId: string): void {
  const store = readStore();
  delete store[attemptKey(mode, scenarioId)];
  writeStore(store);
}
