import type { StudentProgress, TeacherMode } from "@/lib/teacher/types";

export const studentProgressStorageKey = "ircom-gemini-student-progress";
export const progressSchemaVersionKey = "ircom-progress-schema-version";
export const CURRENT_PROGRESS_SCHEMA_VERSION = 2;

function createDefaultModeProgress() {
  return {
    interactionsCompleted: 0,
    lastUpdatedAtIso: null,
  };
}

export function createDefaultProgress(): StudentProgress {
  return {
    course: createDefaultModeProgress(),
    atelier: createDefaultModeProgress(),
    sprint: createDefaultModeProgress(),
  };
}

interface LegacyProgressShape {
  coach?: { interactionsCompleted: number; lastUpdatedAtIso: string | null };
  exercise?: { interactionsCompleted: number; lastUpdatedAtIso: string | null };
  sprint?: { interactionsCompleted: number; lastUpdatedAtIso: string | null };
}

export function migrateStoredProgress(raw: unknown): StudentProgress {
  const defaults = createDefaultProgress();
  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const legacy = raw as LegacyProgressShape & Partial<StudentProgress>;

  if ("atelier" in legacy && legacy.atelier) {
    return {
      course: legacy.course ?? defaults.course,
      atelier: legacy.atelier,
      sprint: legacy.sprint ?? defaults.sprint,
    };
  }

  return {
    course: legacy.coach ?? defaults.course,
    atelier: legacy.exercise ?? defaults.atelier,
    sprint: legacy.sprint ?? defaults.sprint,
  };
}

export function getInteractionCount(
  progress: StudentProgress,
  mode: TeacherMode,
): number {
  return progress[mode].interactionsCompleted;
}
