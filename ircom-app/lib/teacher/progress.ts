import type { StudentProgress, TeacherMode } from "@/lib/teacher/types";

export const studentProgressStorageKey = "ircom-gemini-student-progress";

function createDefaultModeProgress() {
  return {
    interactionsCompleted: 0,
    lastUpdatedAtIso: null,
  };
}

export function createDefaultProgress(): StudentProgress {
  return {
    coach: createDefaultModeProgress(),
    exercise: createDefaultModeProgress(),
    sprint: createDefaultModeProgress(),
  };
}

export function getInteractionCount(
  progress: StudentProgress,
  mode: TeacherMode,
): number {
  return progress[mode].interactionsCompleted;
}
