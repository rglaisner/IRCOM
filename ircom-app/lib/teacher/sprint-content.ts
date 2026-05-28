import sprintEn from "@/content/sprint-scenarios.en.json";
import sprintFr from "@/content/sprint-scenarios.fr.json";
import {
  sprintContentSchema,
  type SprintContent,
  type SprintScenario,
} from "@/lib/teacher/curriculum-types";
import type { SupportedLanguage } from "@/lib/teacher/types";

const sprintByLanguage: Record<SupportedLanguage, SprintContent> = {
  fr: sprintContentSchema.parse(sprintFr),
  en: sprintContentSchema.parse(sprintEn),
};

export function getSprintContent(language: SupportedLanguage): SprintContent {
  return sprintByLanguage[language];
}

export function getSprintScenario(
  language: SupportedLanguage,
  scenarioId: string,
): SprintScenario | undefined {
  return getSprintContent(language).scenarios.find(
    (scenario) => scenario.id === scenarioId,
  );
}
