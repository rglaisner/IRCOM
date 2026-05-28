"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TeacherFeedback } from "@/components/studio/teacher-feedback";
import { ToolRouter } from "@/components/studio/tool-router";
import { t } from "@/lib/copy/ui-messages";
import { useTeacherApi } from "@/lib/hooks/use-teacher-api";
import { getCurriculum } from "@/lib/teacher/content";
import { getInteractionCount } from "@/lib/teacher/progress";
import type {
  StudentProgress,
  SupportedLanguage,
  TeacherMode,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

const RUSH_SECONDS = 2 * 60 * 60;

interface SprintModeProps {
  language: SupportedLanguage;
  progress: StudentProgress;
  registerInteraction: (mode: TeacherMode) => void;
  getHistory: (mode: TeacherMode) => import("@/lib/teacher/types").TeacherRequestMessage[];
  appendHistory: (
    mode: TeacherMode,
    studentInput: string,
    teacherResponse: TeacherResponseOutput,
  ) => void;
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function SprintMode(props: Readonly<SprintModeProps>) {
  const [draft, setDraft] = useState("");
  const [response, setResponse] = useState<TeacherResponseOutput | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RUSH_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const { submit, isLoading, errorMessage } = useTeacherApi(props.language);
  const completed = getInteractionCount(props.progress, "sprint");
  const sampleBrief = getCurriculum(props.language).blocks.find((b) => b.id === 4)?.sampleBrief;

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const handleSubmit = async () => {
    if (draft.trim().length === 0) {
      return;
    }

    const result = await submit({
      mode: "sprint",
      language: props.language,
      studentInput: draft.trim(),
      interactionNumber: completed + 1,
      history: props.getHistory("sprint"),
    });

    if (result) {
      setResponse(result);
      props.registerInteraction("sprint");
      props.appendHistory("sprint", draft, result);
    }
  };

  const exportKit = () => {
    if (!response) {
      return;
    }

    const lines = [
      `# ${response.title}`,
      "",
      response.feedback,
      "",
      `## ${props.language === "fr" ? "Prochaine étape" : "Next step"}`,
      response.nextStep,
      "",
      "## Checklist",
      ...response.critiqueChecklist.map((item) => `- ${item}`),
    ];

    if (response.deliverableChecklist) {
      lines.push("", "## Deliverables", ...response.deliverableChecklist.map((d) => `- ${d}`));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ircom-sprint-kit.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card accentColor="#071554" className="space-y-6">
      <PageHeader
        title={props.language === "fr" ? "Bloc 4 — Sprint agence" : "Block 4 — Agency sprint"}
        description={
          props.language === "fr"
            ? "Rush 2 h : texte, visuel, script 30 s — puis Grand Oral."
            : "2h rush: copy, visual, 30s script — then Grand Oral."
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--ircom-radius-md)] bg-[var(--ircom-navy)] p-4 text-white">
        <div>
          <p className="text-sm opacity-80">
            {props.language === "fr" ? "Temps restant" : "Time remaining"}
          </p>
          <p className="text-2xl font-semibold tabular-nums" data-testid="sprint-timer">
            {formatTime(secondsLeft)}
          </p>
        </div>
        <Button
          variant="secondary"
          className="!bg-[var(--ircom-surface)] !text-[var(--ircom-text-heading)]"
          onClick={() => setTimerRunning(true)}
          data-testid="sprint-start-timer"
        >
          {props.language === "fr" ? "Lancer le rush" : "Start rush"}
        </Button>
      </div>

      <ProgressBar value={completed} max={2} label={t(props.language, "progressLabel")} />

      <ToolRouter language={props.language} blockId={4} />

      {sampleBrief ? (
        <p className="ircom-panel-subtle ircom-body rounded-[var(--ircom-radius-md)] p-4 text-sm">
          <span className="ircom-heading font-medium">
            {props.language === "fr" ? "Exemple de brief : " : "Sample brief: "}
          </span>
          {sampleBrief}
        </p>
      ) : null}

      <textarea
        className="ircom-input min-h-36 w-full rounded-[var(--ircom-radius-md)] p-3 text-sm"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={
          props.language === "fr"
            ? "Décris ta mission, tes livrables ou colle ton kit de campagne…"
            : "Describe your mission, deliverables, or paste your campaign kit…"
        }
        data-testid="sprint-input"
      />

      <Button onClick={handleSubmit} disabled={isLoading} data-testid="sprint-submit">
        {isLoading ? t(props.language, "submitting") : t(props.language, "submit")}
      </Button>

      {errorMessage ? (
        <p className="rounded-[var(--ircom-radius-md)] bg-[#f0587222] p-3 text-sm text-[var(--ircom-red)]" data-testid="error-message">
          {errorMessage}
        </p>
      ) : null}

      {response ? (
        <div data-testid="sprint-response">
          <TeacherFeedback language={props.language} response={response} />
          <Button variant="ghost" className="mt-4" onClick={exportKit} data-testid="sprint-export">
            {t(props.language, "exportSprint")}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
