"use client";

import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import type { SupportedLanguage } from "@/lib/teacher/types";
import { t } from "@/lib/copy/ui-messages";

interface ScenarioPickerProps {
  language: SupportedLanguage;
  scenarios: AtelierScenario[];
  selectedId: string | null;
  onSelect: (scenarioId: string) => void;
}

export function ScenarioPicker({
  language,
  scenarios,
  selectedId,
  onSelect,
}: Readonly<ScenarioPickerProps>) {
  return (
    <div className="space-y-3" data-testid="scenario-picker">
      <p className="ircom-heading text-sm font-medium">{t(language, "selectScenario")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onSelect(scenario.id)}
            className={`min-h-[var(--ircom-touch-min)] rounded-[var(--ircom-radius-md)] border p-4 text-left transition ${
              selectedId === scenario.id
                ? "border-[var(--ircom-blue)] bg-[#3b74f712]"
                : "border-[var(--ircom-border)] bg-[var(--ircom-surface)] hover:border-[var(--ircom-blue)]"
            }`}
            data-testid={`scenario-card-${scenario.id}`}
          >
            <p className="ircom-heading text-sm font-semibold">{scenario.title}</p>
            <p className="ircom-secondary mt-1 text-xs leading-relaxed">{scenario.summary}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
