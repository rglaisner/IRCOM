import { getAtelierScenario } from "@/lib/teacher/atelier-content";
import { getCourseBloc } from "@/lib/teacher/course-content";
import { getCurriculum } from "@/lib/teacher/content";
import { getSprintScenario } from "@/lib/teacher/sprint-content";
import type { AtelierChatRequest, AtelierNarrateRequest, SupportedLanguage } from "@/lib/teacher/types";

function getLanguageLabel(language: SupportedLanguage): string {
  return language === "fr" ? "French" : "English";
}

function getCourseContext(language: SupportedLanguage, blocId: number, sectionIds: string[]): string {
  const bloc = getCourseBloc(language, blocId);
  if (!bloc) {
    return "";
  }

  return bloc.sections
    .filter((section) => sectionIds.includes(section.id))
    .map((section) => `### ${section.title}\n${section.markdown}`)
    .join("\n\n");
}

export function buildAtelierNarrationPrompt(payload: AtelierNarrateRequest): string {
  const scenario = getAtelierScenario(payload.language, payload.scenarioId);
  if (!scenario) {
    throw new Error("Unknown atelier scenario.");
  }

  const curriculum = getCurriculum(payload.language);
  const courseContext = getCourseContext(
    payload.language,
    scenario.blocId,
    scenario.linkedCourseSectionIds,
  );

  return [
    `You are an IRCOM atelier facilitator. Speak in ${getLanguageLabel(payload.language)} only.`,
    "Deliver a spoken-style briefing (plain text, no JSON, no markdown headers).",
    "All source documents are shown in the on-screen brief panel — never tell the student to open an external PDF or file.",
    "Walk through: situation, constraints, deliverables, and how this connects to the course.",
    "Keep paragraphs short for text-to-speech. Target 250–400 words.",
    `Program: ${curriculum.programTitle}`,
    `Scenario: ${scenario.title}`,
    `Situation: ${scenario.situation}`,
    `Constraints: ${scenario.constraints.join("; ")}`,
    `Deliverables: ${scenario.deliverables.join("; ")}`,
    `Facilitator outline: ${scenario.narrationScript}`,
    courseContext.length > 0 ? `Related course excerpts:\n${courseContext}` : "",
    "Invite the student to interrupt with questions. End with one concrete first step.",
  ]
    .filter((line) => line.length > 0)
    .join("\n\n");
}

export function buildAtelierChatPrompt(payload: AtelierChatRequest): string {
  const scenario = getAtelierScenario(payload.language, payload.scenarioId);
  if (!scenario) {
    throw new Error("Unknown atelier scenario.");
  }

  const historySummary =
    payload.history
      ?.map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join("\n") ?? "";

  return [
    `You are an IRCOM atelier coach. Answer in ${getLanguageLabel(payload.language)} only.`,
    "Be concise, practical, and grounded in the scenario. No JSON.",
    `Scenario: ${scenario.title}`,
    `Situation: ${scenario.situation}`,
    `Constraints: ${scenario.constraints.join("; ")}`,
    payload.transcript ? `Narration so far:\n${payload.transcript}` : "",
    historySummary.length > 0 ? `Chat history:\n${historySummary}` : "",
    `Student question: ${payload.question}`,
  ]
    .filter((line) => line.length > 0)
    .join("\n\n");
}

export function buildSprintChatPrompt(payload: AtelierChatRequest): string {
  const scenario = getSprintScenario(payload.language, payload.scenarioId);
  if (!scenario) {
    throw new Error("Unknown sprint scenario.");
  }

  const historySummary =
    payload.history
      ?.map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join("\n") ?? "";

  return [
    `You are an IRCOM sprint agency coach. Answer in ${getLanguageLabel(payload.language)} only.`,
    "Be concise, practical, and grounded in the scenario. No JSON.",
    "All source material is in the on-screen brief — never reference an external PDF.",
    `Scenario ${scenario.letter}: ${scenario.title}`,
    `Situation: ${scenario.situation}`,
    `Constraints: ${scenario.constraints.join("; ")}`,
    `Deliverables: ${scenario.deliverables.join("; ")}`,
    payload.transcript ? `Narration so far:\n${payload.transcript}` : "",
    historySummary.length > 0 ? `Chat history:\n${historySummary}` : "",
    `Student question: ${payload.question}`,
  ]
    .filter((line) => line.length > 0)
    .join("\n\n");
}

export function buildSprintNarrationPrompt(
  language: SupportedLanguage,
  scenarioId: string,
): string {
  const scenario = getSprintScenario(language, scenarioId);
  if (!scenario) {
    throw new Error("Unknown sprint scenario.");
  }

  const curriculum = getCurriculum(language);

  return [
    `You are an IRCOM sprint agency producer. Speak in ${getLanguageLabel(language)} only.`,
    "Deliver a rush briefing (plain text, no JSON). 2-hour pressure frame.",
    "All source documents are in the on-screen brief — never tell the student to open an external PDF.",
    `Program: ${curriculum.programTitle}`,
    `Scenario ${scenario.letter}: ${scenario.title}`,
    `Situation: ${scenario.situation}`,
    `Constraints: ${scenario.constraints.join("; ")}`,
    `Deliverables: ${scenario.deliverables.join("; ")}`,
    `Critique focus: ${scenario.critiqueFocus}`,
    `Outline: ${scenario.narrationScript}`,
    "End with the deliverable checklist as a short numbered list.",
  ].join("\n\n");
}
