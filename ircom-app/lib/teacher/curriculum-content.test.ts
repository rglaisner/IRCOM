import { describe, expect, it } from "node:test";
import { getAtelierScenario } from "@/lib/teacher/atelier-content";
import { getCourseBloc } from "@/lib/teacher/course-content";
import { getSprintScenario } from "@/lib/teacher/sprint-content";

describe("curriculum content loaders", () => {
  it("loads three course blocs in French", () => {
    const bloc = getCourseBloc("fr", 2);
    expect(bloc?.sections.length).toBeGreaterThanOrEqual(3);
  });

  it("loads atelier scenario by id", () => {
    const scenario = getAtelierScenario("en", "b1-mobilite-launch");
    expect(scenario?.blocId).toBe(1);
  });

  it("loads sprint scenario A", () => {
    const scenario = getSprintScenario("fr", "sprint-a-urban-weave");
    expect(scenario?.letter).toBe("A");
  });
});
