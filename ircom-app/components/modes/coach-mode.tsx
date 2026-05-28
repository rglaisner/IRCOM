"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PasteBackPanel } from "@/components/studio/paste-back-panel";
import { TeacherFeedback } from "@/components/studio/teacher-feedback";
import { ToolRouter } from "@/components/studio/tool-router";
import { t } from "@/lib/copy/ui-messages";
import { useTeacherApi } from "@/lib/hooks/use-teacher-api";
import { getInteractionCount } from "@/lib/teacher/progress";
import type {
  BriefFields,
  StudentProgress,
  SupportedLanguage,
  TeacherMode,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

const emptyBrief: BriefFields = {
  role: "",
  context: "",
  objective: "",
  constraints: "",
  format: "",
};

interface CoachModeProps {
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

export function CoachMode(props: Readonly<CoachModeProps>) {
  const [brief, setBrief] = useState<BriefFields>(emptyBrief);
  const [notes, setNotes] = useState("");
  const [pasteBack, setPasteBack] = useState("");
  const [response, setResponse] = useState<TeacherResponseOutput | null>(null);
  const { submit, isLoading, errorMessage } = useTeacherApi(props.language);
  const completed = getInteractionCount(props.progress, "coach");
  const target = 2;

  const briefPreview = [
    `Rôle: ${brief.role}`,
    `Contexte: ${brief.context}`,
    `Objectif: ${brief.objective}`,
    `Contraintes: ${brief.constraints}`,
    `Format: ${brief.format}`,
  ].join("\n");

  const handleSubmit = async () => {
    const studentInput =
      pasteBack.trim().length > 0
        ? pasteBack.trim()
        : notes.trim().length > 0
          ? `${briefPreview}\n\n${notes.trim()}`
          : briefPreview.trim();

    if (studentInput.length === 0) {
      return;
    }

    const result = await submit({
      mode: "coach",
      language: props.language,
      studentInput,
      interactionNumber: completed + 1,
      history: props.getHistory("coach"),
      briefFields: brief,
      sourceTool: pasteBack ? "external" : undefined,
    });

    if (result) {
      setResponse(result);
      props.registerInteraction("coach");
      props.appendHistory("coach", studentInput, result);
      setPasteBack("");
    }
  };

  return (
    <Card accentColor="#3B74F7" className="space-y-6">
      <PageHeader
        title={props.language === "fr" ? "Bloc 1 — Coach brief" : "Block 1 — Brief coach"}
        description={
          props.language === "fr"
            ? "Structure ton brief d'agence, puis obtiens un feedback stratégique."
            : "Structure your agency brief, then get strategic feedback."
        }
      />

      <ProgressBar
        value={completed}
        max={target}
        label={t(props.language, "progressLabel")}
      />

      <ToolRouter language={props.language} blockId={1} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {(
            [
              ["role", props.language === "fr" ? "Rôle" : "Role"],
              ["context", props.language === "fr" ? "Contexte" : "Context"],
              ["objective", props.language === "fr" ? "Objectif" : "Objective"],
              ["constraints", props.language === "fr" ? "Contraintes" : "Constraints"],
              ["format", "Format"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1 text-sm">
              <span className="ircom-heading font-medium">{label}</span>
              <input
                className="ircom-input min-h-[var(--ircom-touch-min)] w-full rounded-[var(--ircom-radius-md)] px-3"
                value={brief[key]}
                onChange={(event) =>
                  setBrief((previous) => ({ ...previous, [key]: event.target.value }))
                }
                data-testid={`coach-brief-${key}`}
              />
            </label>
          ))}
        </div>

        <div className="ircom-panel-subtle rounded-[var(--ircom-radius-md)] p-4">
          <p className="ircom-heading mb-2 text-sm font-medium">
            {props.language === "fr" ? "Aperçu du brief" : "Brief preview"}
          </p>
          <pre className="ircom-body whitespace-pre-wrap text-sm">
            {briefPreview || (props.language === "fr" ? "Complète les champs…" : "Fill in the fields…")}
          </pre>
        </div>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="ircom-heading font-medium">
          {props.language === "fr" ? "Demande ou brouillon" : "Request or draft"}
        </span>
        <textarea
          className="ircom-input min-h-28 w-full rounded-[var(--ircom-radius-md)] p-3 text-sm"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={
            props.language === "fr"
              ? "Ex. : Transformer ce communiqué en fil LinkedIn…"
              : "E.g. Turn this press release into a LinkedIn thread…"
          }
          data-testid="coach-input"
        />
      </label>

      <PasteBackPanel language={props.language} value={pasteBack} onChange={setPasteBack} />

      <Button
        onClick={handleSubmit}
        disabled={
          isLoading ||
          (pasteBack.trim().length === 0 &&
            notes.trim().length === 0 &&
            briefPreview.trim().length < 20)
        }
        data-testid="coach-submit"
      >
        {isLoading ? t(props.language, "submitting") : t(props.language, "submit")}
      </Button>

      {errorMessage ? (
        <p className="rounded-[var(--ircom-radius-md)] bg-[#f0587222] p-3 text-sm text-[var(--ircom-red)]" data-testid="error-message">
          {errorMessage}
        </p>
      ) : null}

      {response ? (
        <div data-testid="coach-response">
          <TeacherFeedback language={props.language} response={response} />
        </div>
      ) : null}
    </Card>
  );
}
