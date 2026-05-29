import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import type { SupportedLanguage } from "@/lib/teacher/types";

export function getAtelierBriefMarkdown(
  scenario: AtelierScenario,
  language: SupportedLanguage,
): string {
  if (scenario.briefMarkdown) {
    return scenario.briefMarkdown;
  }

  const constraints = scenario.constraints.map((item) => `- ${item}`).join("\n");
  const deliverables = scenario.deliverables.map((item) => `- ${item}`).join("\n");

  return [
    `## ${scenario.title}`,
    "",
    scenario.situation,
    "",
    language === "fr" ? "**Contraintes**" : "**Constraints**",
    constraints,
    "",
    language === "fr" ? "**Livrables**" : "**Deliverables**",
    deliverables,
  ].join("\n");
}
