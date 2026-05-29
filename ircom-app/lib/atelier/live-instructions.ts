import type { BriefingStep } from "@/lib/atelier/briefing-orchestrator";
import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import type { SprintScenario } from "@/lib/teacher/curriculum-types";
import type { SupportedLanguage } from "@/lib/teacher/types";

type SessionScenario = AtelierScenario | SprintScenario;

function getLanguageLabel(language: SupportedLanguage): string {
  return language === "fr" ? "French" : "English";
}

function getPauseResumeRules(language: SupportedLanguage): string {
  if (language === "fr") {
    return [
      "PAUSE : quand l'étudiant met en pause, réponds en UNE phrase courte pour confirmer la pause (« Très bien, je m'arrête ici. »), puis cesse de parler.",
      "REPRISE : quand l'étudiant reprend, continue le briefing exactement où tu t'étais arrêté, sans recommencer depuis le début.",
    ].join("\n");
  }

  return [
    "PAUSE: when the student pauses, reply with ONE short sentence acknowledging the pause, then stop speaking.",
    "RESUME: when the student resumes, continue the briefing exactly where you stopped — do not restart from the beginning.",
  ].join("\n");
}

function getRaiseHandRules(language: SupportedLanguage): string {
  if (language === "fr") {
    return [
      "LEVER LA MAIN : termine la phrase en cours (sans couper un mot), puis invite chaleureusement la question de l'étudiant.",
      "Écoute la question via l'audio entrant. Réponds de façon concise et professionnelle.",
      "Si la question est hors sujet, redirige fermement mais avec courtoisie vers le scénario en cours — ne reste pas en digression.",
      "Après la réponse, reprends le briefing restant depuis l'étape en cours.",
    ].join("\n");
  }

  return [
    "RAISE HAND: finish your current sentence (no mid-word cut), then warmly invite the student's question.",
    "Listen via incoming audio. Answer concisely and professionally.",
    "If off-topic, assertively but courteously redirect back to the scenario — do not stay off track.",
    "After answering, resume the remaining briefing from the current step.",
  ].join("\n");
}

function formatStepInstruction(
  step: BriefingStep,
  stepIndex: number,
  language: SupportedLanguage,
): string {
  if (step.type === "narrate") {
    return language === "fr"
      ? `Étape ${stepIndex + 1} (narration) — ${step.hint}`
      : `Step ${stepIndex + 1} (narrate) — ${step.hint}`;
  }

  return language === "fr"
    ? `Étape ${stepIndex + 1} (checkpoint livrable) — ${step.voiceCue} Attendez la soumission avant de continuer.`
    : `Step ${stepIndex + 1} (deliverable checkpoint) — ${step.voiceCue} Wait for submission before continuing.`;
}

export function buildLiveSystemInstruction(params: {
  language: SupportedLanguage;
  scenario: SessionScenario;
  briefingSteps: BriefingStep[];
  currentStepIndex: number;
  context?: "atelier" | "sprint";
}): string {
  const { language, scenario, briefingSteps, currentStepIndex, context = "atelier" } = params;
  const roleLabel =
    context === "sprint"
      ? language === "fr"
        ? "producteur d'agence sprint IRCOM"
        : "IRCOM sprint agency producer"
      : language === "fr"
        ? "facilitateur atelier IRCOM"
        : "IRCOM workshop facilitator";

  const stepsOutline = briefingSteps
    .map((step, index) => formatStepInstruction(step, index, language))
    .join("\n");

  const currentStep = briefingSteps[currentStepIndex];
  const currentStepLine = currentStep
    ? formatStepInstruction(currentStep, currentStepIndex, language)
    : "";

  const constraints = scenario.constraints.join("; ");

  return [
    `You are an ${roleLabel}. Speak only in ${getLanguageLabel(language)}.`,
    "Deliver a masterclass-style spoken briefing — warm, precise, never robotic.",
    "Do not read JSON or markdown headers aloud. Keep sentences short for speech.",
    getPauseResumeRules(language),
    getRaiseHandRules(language),
    `Scenario: ${scenario.title}`,
    `Situation: ${scenario.situation}`,
    `Constraints: ${constraints}`,
    `Deliverables: ${scenario.deliverables.join("; ")}`,
    `Briefing outline:\n${stepsOutline}`,
    currentStepLine.length > 0 ? `Current step (focus now):\n${currentStepLine}` : "",
    `Facilitator script reference: ${scenario.narrationScript}`,
    language === "fr"
      ? "Invite l'étudiant à lever la main pour interrompre. Termine par une première action concrète."
      : "Invite the student to raise a hand to interrupt. End with one concrete first action.",
  ]
    .filter((line) => line.length > 0)
    .join("\n\n");
}

export function buildPauseControlTurn(language: SupportedLanguage): string {
  return language === "fr"
    ? "[CONTROL] L'étudiant met le briefing en pause. Confirme la pause en une phrase courte, puis arrête-toi."
    : "[CONTROL] The student is pausing the briefing. Acknowledge the pause in one short sentence, then stop speaking.";
}

export function buildResumeControlTurn(language: SupportedLanguage): string {
  return language === "fr"
    ? "[CONTROL] L'étudiant reprend l'écoute. Continue le briefing exactement où tu t'étais arrêté."
    : "[CONTROL] The student is resuming. Continue the briefing exactly where you stopped.";
}

export function buildRaiseHandControlTurn(language: SupportedLanguage): string {
  return language === "fr"
    ? "[CONTROL] L'étudiant lève la main. Termine la phrase en cours, invite sa question, puis écoute."
    : "[CONTROL] The student raised a hand. Finish your current sentence, invite their question, then listen.";
}

export function buildDoneSpeakingControlTurn(language: SupportedLanguage): string {
  return language === "fr"
    ? "[CONTROL] L'étudiant a fini de parler. Réponds à sa question, puis reprends le briefing."
    : "[CONTROL] The student finished speaking. Answer their question, then resume the briefing.";
}

export function buildCheckpointSubmittedTurn(
  language: SupportedLanguage,
  summary: string,
  stepIndex: number,
): string {
  return language === "fr"
    ? `[CONTROL] L'étudiant a soumis son livrable checkpoint. Commentaire coach :\n${summary}\nReprends le briefing à partir de l'étape ${stepIndex + 2}.`
    : `[CONTROL] The student submitted their checkpoint deliverable. Coach feedback:\n${summary}\nResume the briefing from step ${stepIndex + 2}.`;
}

export function buildStartBriefingTurn(
  language: SupportedLanguage,
  step: BriefingStep | undefined,
): string {
  if (!step) {
    return language === "fr"
      ? "[CONTROL] Commence le briefing vocal du scénario."
      : "[CONTROL] Begin the spoken scenario briefing.";
  }

  if (step.type === "deliverable_checkpoint") {
    return language === "fr"
      ? `[CONTROL] ${step.voiceCue}`
      : `[CONTROL] ${step.voiceCue}`;
  }

  return language === "fr"
    ? `[CONTROL] Commence l'étape : ${step.hint}`
    : `[CONTROL] Begin step: ${step.hint}`;
}
