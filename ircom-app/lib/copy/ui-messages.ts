import type { SupportedLanguage } from "@/lib/teacher/types";

type MessageKey =
  | "productTitle"
  | "productSubtitle"
  | "navDashboard"
  | "navCourse"
  | "navAtelier"
  | "navSprint"
  | "goToAtelier"
  | "courseSections"
  | "selectScenario"
  | "startNarration"
  | "pauseNarration"
  | "resumeNarration"
  | "doneSpeaking"
  | "raiseHand"
  | "openChat"
  | "workOnDeliverable"
  | "narrationTranscript"
  | "voiceFallbackNotice"
  | "attemptLabel"
  | "gameOverTitle"
  | "gameOverHint"
  | "offTopicTitle"
  | "needsRevisionTitle"
  | "languageLabel"
  | "journeyTitle"
  | "journeySubtitle"
  | "blockLabel"
  | "openMode"
  | "progressLabel"
  | "sessionsTarget"
  | "submit"
  | "submitting"
  | "errorGeneric"
  | "errorOffline"
  | "errorApiKey"
  | "qualityMeter"
  | "exportSprint"
  | "toolRouterTitle"
  | "pasteBackTitle";

const messages: Record<SupportedLanguage, Record<MessageKey, string>> = {
  fr: {
    productTitle: "Ircom",
    productSubtitle: "Studio IA — Management & Communication",
    navDashboard: "Parcours",
    navCourse: "Cours",
    navAtelier: "Atelier",
    navSprint: "Sprint",
    languageLabel: "Langue",
    journeyTitle: "Parcours formation — 12 h",
    journeySubtitle:
      "Quatre blocs pratiques : prompt, visuel, format court, sprint agence. Progresse à ton rythme.",
    blockLabel: "Bloc",
    openMode: "Commencer",
    progressLabel: "Ateliers complétés",
    sessionsTarget: "2 ateliers recommandés par mode",
    submit: "Obtenir le feedback",
    submitting: "Analyse en cours…",
    errorGeneric:
      "Impossible d'obtenir un feedback pour le moment. Réessaie dans un instant.",
    errorOffline: "Connexion indisponible. Vérifie ton réseau.",
    errorApiKey:
      "Le coach IA n'est pas configuré sur ce serveur. Contacte ton formateur.",
    qualityMeter: "Niveau « prêt à publier »",
    exportSprint: "Exporter le kit sprint",
    toolRouterTitle: "Outils recommandés pour ce bloc",
    pasteBackTitle: "Coller le résultat de ton outil",
    goToAtelier: "Passer à l'Atelier",
    courseSections: "Sections du cours",
    selectScenario: "Choisir un scénario",
    startNarration: "Écouter le briefing",
    pauseNarration: "Pause",
    resumeNarration: "Reprendre l'écoute",
    doneSpeaking: "J'ai fini de parler",
    raiseHand: "Lever la main",
    openChat: "Poser une question",
    workOnDeliverable: "Travailler sur le livrable",
    narrationTranscript: "Transcription en direct",
    voiceFallbackNotice:
      "Audio indisponible — lisez le briefing ci-dessus. Vous pouvez lever la main pour un échange vocal si la connexion Live est rétablie.",
    attemptLabel: "Essai",
    gameOverTitle: "Session terminée pour ce scénario",
    gameOverHint: "Trois essais insuffisants. Voici ce qu'une soumission idéale aurait pu contenir :",
    offTopicTitle: "Hors sujet — recentrez-vous",
    needsRevisionTitle: "À retravailler",
  },
  en: {
    productTitle: "Ircom",
    productSubtitle: "AI Studio — Management & Communication",
    navDashboard: "Journey",
    navCourse: "Course",
    navAtelier: "Workshop",
    navSprint: "Sprint",
    languageLabel: "Language",
    journeyTitle: "Training journey — 12 hours",
    journeySubtitle:
      "Four hands-on blocks: prompting, visuals, short format, agency sprint. Learn at your pace.",
    blockLabel: "Block",
    openMode: "Start",
    progressLabel: "Workshops completed",
    sessionsTarget: "2 workshops recommended per mode",
    submit: "Get feedback",
    submitting: "Analyzing…",
    errorGeneric: "We could not get feedback right now. Please try again shortly.",
    errorOffline: "You appear to be offline. Check your connection.",
    errorApiKey:
      "The AI coach is not configured on this server. Contact your instructor.",
    qualityMeter: "Publish-ready level",
    exportSprint: "Export sprint kit",
    toolRouterTitle: "Recommended tools for this block",
    pasteBackTitle: "Paste output from your tool",
    goToAtelier: "Go to Workshop",
    courseSections: "Course sections",
    selectScenario: "Choose a scenario",
    startNarration: "Listen to briefing",
    pauseNarration: "Pause",
    resumeNarration: "Resume briefing",
    doneSpeaking: "Done speaking",
    raiseHand: "Raise hand",
    openChat: "Ask a question",
    workOnDeliverable: "Work on deliverable",
    narrationTranscript: "Live transcript",
    voiceFallbackNotice:
      "Audio unavailable — read the briefing above. Raise your hand for live voice when the connection is restored.",
    attemptLabel: "Attempt",
    gameOverTitle: "Session ended for this scenario",
    gameOverHint: "Three insufficient attempts. Here is what an ideal submission could have included:",
    offTopicTitle: "Off topic — please refocus",
    needsRevisionTitle: "Needs revision",
  },
};

export function t(language: SupportedLanguage, key: MessageKey): string {
  return messages[language][key];
}
