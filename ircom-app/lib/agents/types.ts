import type { TeacherRequestInput } from "@/lib/teacher/types";

export type AgentRole =
  | "brief_coach"
  | "copy_critic"
  | "art_director"
  | "atelier_facilitator"
  | "sprint_facilitator"
  | "oral_examiner";

export function resolveAgentRoleFromInput(input: TeacherRequestInput): AgentRole {
  if (input.mode === "atelier") {
    if (input.imageBase64) {
      return "art_director";
    }
    if (input.blocId === 3 || input.exerciseTab === "script") {
      return "copy_critic";
    }
    if (input.blocId === 2 || input.exerciseTab === "visual") {
      return "art_director";
    }
    return "atelier_facilitator";
  }

  if (input.mode === "sprint") {
    if (input.interactionNumber >= 2) {
      return "oral_examiner";
    }
    return "sprint_facilitator";
  }

  return "brief_coach";
}

export const agentDisplayNames: Record<AgentRole, { fr: string; en: string }> = {
  brief_coach: { fr: "Coach brief", en: "Brief coach" },
  copy_critic: { fr: "Critique copy", en: "Copy critic" },
  art_director: { fr: "Direction artistique", en: "Art director" },
  atelier_facilitator: { fr: "Facilitateur atelier", en: "Workshop facilitator" },
  sprint_facilitator: { fr: "Facilitateur sprint", en: "Sprint facilitator" },
  oral_examiner: { fr: "Grand Oral", en: "Oral examiner" },
};
