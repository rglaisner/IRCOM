"use client";

import { getCurriculum } from "@/lib/teacher/content";
import { getToolsForBlock } from "@/lib/tools/registry";
import type { SupportedLanguage } from "@/lib/teacher/types";

export function ToolRouter({
  language,
  blockId,
}: Readonly<{ language: SupportedLanguage; blockId: number }>) {
  const block = getCurriculum(language).blocks.find((item) => item.id === blockId);
  if (!block) {
    return null;
  }

  const tools = getToolsForBlock(block.recommendedTools, language);

  return (
    <section
      className="ircom-panel-subtle space-y-3 rounded-[var(--ircom-radius-md)] border border-[var(--ircom-border)] p-4"
      data-testid="tool-router"
    >
      <h3 className="ircom-heading text-sm font-semibold">
        {language === "fr" ? "Outils recommandés" : "Recommended tools"}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {tools.map((tool) => (
          <li
            key={tool.id}
            className="flex flex-col gap-2 rounded-[var(--ircom-radius-md)] border border-[var(--ircom-border)] bg-[var(--ircom-surface)] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="ircom-heading font-medium">{tool.label}</span>
              <span
                className={`text-xs font-medium ${
                  tool.apiConfigured
                    ? "text-[var(--ircom-green-text)]"
                    : "ircom-secondary"
                }`}
              >
                {tool.apiConfigured
                  ? language === "fr"
                    ? "Connecté"
                    : "Connected"
                  : language === "fr"
                    ? "Lien guidé"
                    : "Guided link"}
              </span>
            </div>
            <p className="ircom-secondary text-sm">{tool.description}</p>
            <a
              href={tool.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[var(--ircom-touch-min)] items-center justify-center rounded-[var(--ircom-radius-pill)] border-2 border-[var(--ircom-blue)] px-3 text-sm font-medium text-[var(--ircom-blue)] hover:bg-[var(--ircom-blue)] hover:text-white"
            >
              {language === "fr" ? `Ouvrir ${tool.label}` : `Open ${tool.label}`}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
