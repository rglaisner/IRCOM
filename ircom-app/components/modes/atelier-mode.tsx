"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AtelierScenarioWorkspace } from "@/components/modes/atelier-scenario-workspace";
import { ScenarioPicker } from "@/components/atelier/scenario-picker";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getAtelierScenario, getAtelierScenariosForBloc } from "@/lib/teacher/atelier-content";
import { getInteractionCount } from "@/lib/teacher/progress";
import type {
  StudentProgress,
  SupportedLanguage,
  TeacherMode,
  TeacherRequestMessage,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

interface AtelierModeProps {
  language: SupportedLanguage;
  progress: StudentProgress;
  registerInteraction: (mode: TeacherMode) => void;
  getHistory: (mode: TeacherMode) => TeacherRequestMessage[];
  appendHistory: (
    mode: TeacherMode,
    studentInput: string,
    teacherResponse: TeacherResponseOutput,
  ) => void;
}

export function AtelierMode(props: Readonly<AtelierModeProps>) {
  const searchParams = useSearchParams();
  const initialBloc = Number(searchParams.get("bloc") ?? "1");
  const initialScenario = searchParams.get("scenario");

  const [blocId, setBlocId] = useState(
    initialBloc >= 1 && initialBloc <= 3 ? initialBloc : 1,
  );
  const scenarios = useMemo(
    () => getAtelierScenariosForBloc(props.language, blocId),
    [props.language, blocId],
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    initialScenario && scenarios.some((s) => s.id === initialScenario)
      ? initialScenario
      : (scenarios[0]?.id ?? null),
  );

  const completed = getInteractionCount(props.progress, "atelier");
  const scenario =
    selectedScenarioId !== null
      ? getAtelierScenario(props.language, selectedScenarioId)
      : undefined;

  return (
    <Card
      accentColor={blocId === 1 ? "#3B74F7" : blocId === 2 ? "#F05872" : "#FEBA31"}
      className="space-y-6"
    >
      <PageHeader
        title={
          props.language === "fr" ? `Bloc ${blocId} — Atelier` : `Block ${blocId} — Workshop`
        }
        description={
          props.language === "fr"
            ? "Scénario pratique avec briefing vocal et coaching"
            : "Hands-on scenario with voice briefing and coaching"
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist">
        {[1, 2, 3].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setBlocId(id);
              const next = getAtelierScenariosForBloc(props.language, id);
              setSelectedScenarioId(next[0]?.id ?? null);
            }}
            className={`min-h-[var(--ircom-touch-min)] rounded-[var(--ircom-radius-pill)] px-4 text-sm font-medium ${
              blocId === id
                ? "bg-[var(--ircom-blue)] text-white"
                : "bg-[var(--ircom-panel-subtle)] text-[var(--ircom-text-heading)]"
            }`}
            data-testid={`atelier-bloc-${id}`}
          >
            {props.language === "fr" ? `Bloc ${id}` : `Block ${id}`}
          </button>
        ))}
      </div>

      <ScenarioPicker
        language={props.language}
        scenarios={scenarios}
        selectedId={selectedScenarioId}
        onSelect={(id) => setSelectedScenarioId(id)}
      />

      {scenario ? (
        <AtelierScenarioWorkspace
          key={scenario.id}
          language={props.language}
          scenario={scenario}
          completed={completed}
          getHistory={props.getHistory}
          registerInteraction={props.registerInteraction}
          appendHistory={props.appendHistory}
        />
      ) : null}
    </Card>
  );
}
