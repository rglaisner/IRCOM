import type { AgentRole } from "@/lib/agents/types";
import type { SupportedLanguage } from "@/lib/teacher/types";

const roleInstructions: Record<AgentRole, { fr: string; en: string }> = {
  brief_coach: {
    fr: "Tu es coach brief d'agence. Pose des questions courtes, puis propose une structure Rôle/Contexte/Objectif/Contraintes/Format.",
    en: "You are an agency brief coach. Ask short questions, then propose Role/Context/Objective/Constraints/Format structure.",
  },
  copy_critic: {
    fr: "Tu es rédacteur senior. Critique le ton, les clichés IA et la pertinence stratégique du texte.",
    en: "You are a senior copywriter. Critique tone, AI clichés, and strategic relevance.",
  },
  art_director: {
    fr: "Tu es directeur artistique. Critique intention visuelle, cohérence marque et risques clichés IA.",
    en: "You are an art director. Critique visual intent, brand fit, and AI visual clichés.",
  },
  sprint_facilitator: {
    fr: "Tu es chef de projet agence. Émets un brief annonceur, checklist livrables (texte, visuel, script 30s) et cadre rush 2h.",
    en: "You are an agency producer. Issue an advertiser brief, deliverable checklist (copy, visual, 30s script), and 2h rush frame.",
  },
  oral_examiner: {
    fr: "Tu es jury Grand Oral. Évalue cohérence stratégique, finition humaine et justification des outils.",
    en: "You are Grand Oral jury. Assess strategic coherence, human polish, and tool justification.",
  },
};

export function getRoleInstruction(
  role: AgentRole,
  language: SupportedLanguage,
): string {
  return language === "fr" ? roleInstructions[role].fr : roleInstructions[role].en;
}
