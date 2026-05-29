import { getRoleInstruction } from "@/lib/agents/prompts";
import {
  agentDisplayNames,
  resolveAgentRoleFromInput,
} from "@/lib/agents/types";
import { getAtelierScenario } from "@/lib/teacher/atelier-content";
import { getCurriculum, getInteractionScript } from "@/lib/teacher/content";
import { getSprintScenario } from "@/lib/teacher/sprint-content";
import type { SupportedLanguage, TeacherMode } from "@/lib/teacher/types";
import type { TeacherRequestInput } from "@/lib/teacher/types";

function getLanguageLabel(language: SupportedLanguage): string {
  return language === "fr" ? "French" : "English";
}

function getModeInstruction(mode: TeacherMode, language: SupportedLanguage): string {
  const modeModule = getCurriculum(language).modules[mode];
  return modeModule.focus;
}

function getScenarioContext(payload: TeacherRequestInput): string {
  if (payload.mode === "atelier" && payload.scenarioId) {
    const scenario = getAtelierScenario(payload.language, payload.scenarioId);
    if (!scenario) {
      return "";
    }
    return [
      `Atelier scenario: ${scenario.title}`,
      `Situation: ${scenario.situation}`,
      `Constraints: ${scenario.constraints.join("; ")}`,
      `Expected deliverables: ${scenario.deliverables.join("; ")}`,
    ].join("\n");
  }

  if (payload.mode === "sprint" && payload.scenarioId) {
    const scenario = getSprintScenario(payload.language, payload.scenarioId);
    if (!scenario) {
      return "";
    }
    return [
      `Sprint scenario ${scenario.letter}: ${scenario.title}`,
      `Situation: ${scenario.situation}`,
      `Constraints: ${scenario.constraints.join("; ")}`,
      `Deliverables: ${scenario.deliverables.join("; ")}`,
      `Critique focus: ${scenario.critiqueFocus}`,
    ].join("\n");
  }

  return "";
}

export function buildTeacherPrompt(payload: TeacherRequestInput): string {
  const curriculum = getCurriculum(payload.language);
  const selectedModule = curriculum.modules[payload.mode];
  const agentRole = resolveAgentRoleFromInput(payload);
  const roleInstruction = getRoleInstruction(agentRole, payload.language);
  const interactionScript = getInteractionScript(
    payload.language,
    payload.mode,
    payload.interactionNumber,
    payload.scenarioId,
  );

  const historySummary = payload.history
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const agentLabel =
    payload.language === "fr"
      ? agentDisplayNames[agentRole].fr
      : agentDisplayNames[agentRole].en;

  const briefSection =
    payload.briefFields &&
    [
      `Role: ${payload.briefFields.role}`,
      `Context: ${payload.briefFields.context}`,
      `Objective: ${payload.briefFields.objective}`,
      `Constraints: ${payload.briefFields.constraints}`,
      `Format: ${payload.briefFields.format}`,
    ].join("\n");

  const scenarioContext = getScenarioContext(payload);

  const checkpointSection =
    payload.checkpointOnly && payload.briefingStepId
      ? payload.language === "fr"
        ? `Évaluation checkpoint uniquement (étape ${payload.briefingStepId}). Donne un commentaire oral court (2-4 phrases) dans feedback, sans évaluer l'ensemble du scénario.`
        : `Checkpoint-only review (step ${payload.briefingStepId}). Give a short spoken-style comment (2-4 sentences) in feedback, not a full scenario critique.`
      : "";

  const attemptNumber = payload.attemptNumber ?? 1;

  const responseShape =
    payload.mode === "sprint"
      ? "Include deliverableChecklist (array), rubricScores {strategic,workflow,critical}, qualityScore 0-100."
      : payload.mode === "atelier"
        ? "Include visualNotes array when critiquing visuals or scripts."
        : "Include recommendedTool when suggesting next production tool.";

  const verdictRules =
    payload.language === "fr"
      ? [
          "Inclus submissionVerdict: accepted | needs_revision | off_topic | game_over.",
          "off_topic: contenu hors-sujet, blague, spam, ou absence d'effort réel — ton ferme, pas de félicitations.",
          "needs_revision: effort sincère mais livrable insuffisant — feedback constructif + minAcceptableHint (ce qu'un minimum acceptable contient).",
          "accepted: répond aux attentes minimales du scénario pour cette interaction.",
          `game_over: uniquement si attemptNumber est 3 et le livrable reste inacceptable — inclure idealSubmission (exemple idéal).`,
          `attemptNumber actuel: ${attemptNumber} (max 3).`,
        ].join(" ")
      : [
          "Include submissionVerdict: accepted | needs_revision | off_topic | game_over.",
          "off_topic: irrelevant, joke, spam, or no real effort — firm tone, no praise.",
          "needs_revision: genuine effort but deliverable insufficient — constructive feedback + minAcceptableHint.",
          "accepted: meets minimum scenario expectations for this interaction.",
          `game_over: only when attemptNumber is 3 and submission remains unacceptable — include idealSubmission.`,
          `Current attemptNumber: ${attemptNumber} (max 3).`,
        ].join(" ");

  return [
    `You are the IRCOM studio coach (${agentLabel}). Respond in ${getLanguageLabel(payload.language)} only.`,
    roleInstruction,
    "Return JSON only with keys: title, feedback, nextStep, critiqueChecklist, submissionVerdict, attemptNumber.",
    "Optional keys when relevant: minAcceptableHint, idealSubmission.",
    responseShape,
    verdictRules,
    "critiqueChecklist must contain 3 to 8 strings.",
    `Program: ${curriculum.programTitle}`,
    `Central goal: ${curriculum.centralGoal}`,
    `Mode focus: ${selectedModule.focus}`,
    `Expected deliverable: ${selectedModule.expectedDeliverable}`,
    `Evaluation criteria: ${curriculum.evaluationCriteria.join("; ")}`,
    `Guardrails: ${curriculum.guardrails.join("; ")}`,
    `Current interaction number: ${payload.interactionNumber}`,
    interactionScript
      ? `Interaction script: ${interactionScript}`
      : `Mode instruction: ${getModeInstruction(payload.mode, payload.language)}`,
    scenarioContext.length > 0 ? scenarioContext : "",
    checkpointSection,
    payload.sourceTool ? `Student used tool: ${payload.sourceTool}` : "",
    briefSection ? `Agency brief fields:\n${briefSection}` : "",
    payload.exerciseTab ? `Exercise tab: ${payload.exerciseTab}` : "",
    payload.blocId ? `Bloc: ${payload.blocId}` : "",
    historySummary.length > 0 ? `Recent conversation:\n${historySummary}` : "No prior history.",
    `Latest student input:\n${payload.studentInput}`,
  ]
    .filter((line) => line.length > 0)
    .join("\n\n");
}
