import modulesEn from "@/content/modules.en.json";
import modulesFr from "@/content/modules.fr.json";
import type { SupportedLanguage, TeacherMode } from "@/lib/teacher/types";

interface CurriculumModule {
  title: string;
  focus: string;
  expectedDeliverable: string;
}

interface Curriculum {
  programTitle: string;
  centralGoal: string;
  evaluationCriteria: string[];
  modules: Record<TeacherMode, CurriculumModule>;
  guardrails: string[];
}

const curriculumByLanguage: Record<SupportedLanguage, Curriculum> = {
  fr: modulesFr as Curriculum,
  en: modulesEn as Curriculum,
};

export function getCurriculum(language: SupportedLanguage): Curriculum {
  return curriculumByLanguage[language];
}
