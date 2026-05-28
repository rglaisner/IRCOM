import type { TeacherRequestInput } from "@/lib/teacher/types";

export type AgentRole =
  | "brief_coach"
  | "copy_critic"
  | "art_director"
  | "sprint_facilitator"
  | "oral_examiner";

export function resolveAgentRoleFromInput(input: TeacherRequestInput): AgentRole {
  if (input.mode === "coach") {
    return "brief_coach";
  }

  if (input.mode === "exercise") {
    if (input.imageBase64) {
      return "art_director";
    }
    return input.exerciseTab === "script" ? "copy_critic" : "art_director";
  }

  if (input.interactionNumber >= 2) {
    return "oral_examiner";
  }

  return "sprint_facilitator";
}

export const agentDisplayNames: Record<AgentRole, { fr: string; en: string }> = {
  brief_coach: { fr: "Coach brief", en: "Brief coach" },
  copy_critic: { fr: "Critique copy", en: "Copy critic" },
  art_director: { fr: "Direction artistique", en: "Art director" },
  sprint_facilitator: { fr: "Facilitateur sprint", en: "Sprint facilitator" },
  oral_examiner: { fr: "Grand Oral", en: "Oral examiner" },
};
