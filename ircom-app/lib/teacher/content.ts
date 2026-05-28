import modulesEn from "@/content/modules.en.json";
import modulesFr from "@/content/modules.fr.json";
import { getSprintScenario } from "@/lib/teacher/sprint-content";
import type { SupportedLanguage, TeacherMode } from "@/lib/teacher/types";

export interface CurriculumModule {
  title: string;
  focus: string;
  expectedDeliverable: string;
  interactionScripts?: Record<string, string>;
}

export interface CurriculumBlock {
  id: number;
  title: string;
  subtitle: string;
  mode: TeacherMode | "course";
  href: string;
  courseHref?: string;
  atelierHref?: string;
  accentColor: string;
  recommendedTools: string[];
  objectives: string[];
  workshopPrompts: string[];
  sampleBrief: string;
}

export interface Curriculum {
  programTitle: string;
  centralGoal: string;
  evaluationCriteria: string[];
  modules: Record<TeacherMode, CurriculumModule>;
  guardrails: string[];
  blocks: CurriculumBlock[];
}

const curriculumByLanguage: Record<SupportedLanguage, Curriculum> = {
  fr: modulesFr as Curriculum,
  en: modulesEn as Curriculum,
};

export function getCurriculum(language: SupportedLanguage): Curriculum {
  return curriculumByLanguage[language];
}

export function getBlockById(
  language: SupportedLanguage,
  blockId: number,
): CurriculumBlock | undefined {
  return getCurriculum(language).blocks.find((block) => block.id === blockId);
}

export function getInteractionScript(
  language: SupportedLanguage,
  mode: TeacherMode,
  interactionNumber: number,
  scenarioId?: string,
): string | undefined {
  if (mode === "sprint" && scenarioId) {
    const scenario = getSprintScenario(language, scenarioId);
    const key = interactionNumber === 2 ? "2" : "1";
    return scenario?.interactionScripts[key];
  }

  const modeModule = getCurriculum(language).modules[mode];
  return modeModule.interactionScripts?.[String(interactionNumber)];
}
