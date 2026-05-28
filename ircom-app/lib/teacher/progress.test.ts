import { describe, expect, it } from "node:test";
import { createDefaultProgress, migrateStoredProgress } from "@/lib/teacher/progress";

describe("migrateStoredProgress", () => {
  it("maps legacy coach and exercise keys to course and atelier", () => {
    const migrated = migrateStoredProgress({
      coach: { interactionsCompleted: 2, lastUpdatedAtIso: "2026-01-01" },
      exercise: { interactionsCompleted: 1, lastUpdatedAtIso: null },
      sprint: { interactionsCompleted: 0, lastUpdatedAtIso: null },
    });

    expect(migrated.course.interactionsCompleted).toBe(2);
    expect(migrated.atelier.interactionsCompleted).toBe(1);
    expect(migrated.sprint.interactionsCompleted).toBe(0);
  });

  it("returns defaults for invalid payload", () => {
    const migrated = migrateStoredProgress(null);
    expect(migrated).toEqual(createDefaultProgress());
  });
});
