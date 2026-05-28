import { getCurriculum } from "@/lib/teacher/content";
import type { SupportedLanguage, TeacherMode } from "@/lib/teacher/types";

export type ToolId = "claude" | "gemini" | "chatgpt" | "firefly";

export interface ToolDefinition {
  id: ToolId;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
  externalUrl: string;
  apiConfigured: boolean;
}

function isConfigured(envKey: string): boolean {
  const value = process.env[envKey];
  return typeof value === "string" && value.trim().length > 0;
}

export function getToolRegistry(): ToolDefinition[] {
  return [
    {
      id: "gemini",
      labelFr: "Gemini",
      labelEn: "Gemini",
      descriptionFr: "Coach, critique et orchestration pédagogique.",
      descriptionEn: "Coaching, critique, and pedagogical orchestration.",
      externalUrl: "https://aistudio.google.com/",
      apiConfigured: isConfigured("GEMINI_API_KEY"),
    },
    {
      id: "claude",
      labelFr: "Claude",
      labelEn: "Claude",
      descriptionFr: "Copy stratégique et briefs longs.",
      descriptionEn: "Strategic copy and long-form briefs.",
      externalUrl: "https://claude.ai/",
      apiConfigured: isConfigured("ANTHROPIC_API_KEY"),
    },
    {
      id: "chatgpt",
      labelFr: "ChatGPT",
      labelEn: "ChatGPT",
      descriptionFr: "Variantes de texte et brainstorming.",
      descriptionEn: "Text variants and brainstorming.",
      externalUrl: "https://chat.openai.com/",
      apiConfigured: false,
    },
    {
      id: "firefly",
      labelFr: "Adobe Firefly",
      labelEn: "Adobe Firefly",
      descriptionFr: "Assets visuels et direction artistique.",
      descriptionEn: "Visual assets and art direction.",
      externalUrl: "https://firefly.adobe.com/",
      apiConfigured: isConfigured("ADOBE_FIREFLY_API_KEY"),
    },
  ];
}

export function getToolsForBlock(
  recommendedToolIds: string[],
  language: SupportedLanguage,
): Array<ToolDefinition & { label: string; description: string }> {
  const registry = getToolRegistry();
  return recommendedToolIds
    .map((id) => registry.find((tool) => tool.id === id))
    .filter((tool): tool is ToolDefinition => tool !== undefined)
    .map((tool) => ({
      ...tool,
      label: language === "fr" ? tool.labelFr : tool.labelEn,
      description: language === "fr" ? tool.descriptionFr : tool.descriptionEn,
    }));
}

export function getRecommendedToolsForMode(
  language: SupportedLanguage,
  mode: TeacherMode,
): string[] {
  const block = getCurriculum(language).blocks.find((item) => item.mode === mode);
  return block?.recommendedTools ?? ["gemini"];
}
