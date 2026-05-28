import atelierEn from "@/content/atelier-scenarios.en.json";
import atelierFr from "@/content/atelier-scenarios.fr.json";
import {
  atelierContentSchema,
  type AtelierContent,
  type AtelierScenario,
} from "@/lib/teacher/curriculum-types";
import type { SupportedLanguage } from "@/lib/teacher/types";

const atelierByLanguage: Record<SupportedLanguage, AtelierContent> = {
  fr: atelierContentSchema.parse(atelierFr),
  en: atelierContentSchema.parse(atelierEn),
};

export function getAtelierContent(language: SupportedLanguage): AtelierContent {
  return atelierByLanguage[language];
}

export function getAtelierScenario(
  language: SupportedLanguage,
  scenarioId: string,
): AtelierScenario | undefined {
  return getAtelierContent(language).scenarios.find(
    (scenario) => scenario.id === scenarioId,
  );
}

export function getAtelierScenariosForBloc(
  language: SupportedLanguage,
  blocId: number,
): AtelierScenario[] {
  return getAtelierContent(language).scenarios.filter(
    (scenario) => scenario.blocId === blocId,
  );
}
