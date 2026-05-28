import { getCurriculum } from "@/lib/teacher/content";
import type {
  SupportedLanguage,
  TeacherMode,
  TeacherRequestInput,
} from "@/lib/teacher/types";

function getLanguageLabel(language: SupportedLanguage): string {
  return language === "fr" ? "French" : "English";
}

function getModeInstruction(mode: TeacherMode, language: SupportedLanguage): string {
  if (language === "fr") {
    switch (mode) {
      case "coach":
        return "Mode coach: accompagne l'etudiant avec questions courtes, puis propose une version amelioree.";
      case "exercise":
        return "Mode exercice: analyse la proposition, donne une critique precise, puis une piste de revision.";
      case "sprint":
        return "Mode sprint: genere une mission realistic, puis challenge la coherence strategique des livrables.";
      default:
        return "Mode pedagogique general.";
    }
  }

  switch (mode) {
    case "coach":
      return "Coach mode: guide the student with concise prompts and then suggest an improved draft.";
    case "exercise":
      return "Exercise mode: analyze the student output, provide concrete critique, then propose one revision path.";
    case "sprint":
      return "Sprint mode: generate a realistic scenario and challenge strategic coherence of deliverables.";
    default:
      return "General pedagogical mode.";
  }
}

export function buildTeacherPrompt(payload: TeacherRequestInput): string {
  const curriculum = getCurriculum(payload.language);
  const selectedModule = curriculum.modules[payload.mode];
  const historySummary = payload.history
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return [
    `You are the IRCOM teacher. Respond in ${getLanguageLabel(payload.language)} only.`,
    "Your role is to coach, enforce strategic thinking, and improve student output quality.",
    "Return JSON only with keys: title, feedback, nextStep, critiqueChecklist.",
    "critiqueChecklist must contain 3 to 6 bullet-like strings.",
    `Program: ${curriculum.programTitle}`,
    `Central goal: ${curriculum.centralGoal}`,
    `Mode focus: ${selectedModule.focus}`,
    `Expected deliverable: ${selectedModule.expectedDeliverable}`,
    `Evaluation criteria: ${curriculum.evaluationCriteria.join("; ")}`,
    `Guardrails: ${curriculum.guardrails.join("; ")}`,
    `Current interaction number in this mode: ${payload.interactionNumber}`,
    `Mode instruction: ${getModeInstruction(payload.mode, payload.language)}`,
    historySummary.length > 0 ? `Recent conversation:\n${historySummary}` : "No prior history.",
    `Latest student input:\n${payload.studentInput}`,
  ].join("\n\n");
}
