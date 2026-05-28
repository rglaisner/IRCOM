"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TeacherFeedback } from "@/components/studio/teacher-feedback";
import { ToolRouter } from "@/components/studio/tool-router";
import { t } from "@/lib/copy/ui-messages";
import { useTeacherApi } from "@/lib/hooks/use-teacher-api";
import { getInteractionCount } from "@/lib/teacher/progress";
import type {
  ExerciseTab,
  StudentProgress,
  SupportedLanguage,
  TeacherMode,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

interface ExerciseModeProps {
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

export function ExerciseMode(props: Readonly<ExerciseModeProps>) {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "script" ? "script" : "visual";
  const [tab, setTab] = useState<ExerciseTab>(initialTab);
  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | undefined>();
  const [response, setResponse] = useState<TeacherResponseOutput | null>(null);
  const { submit, isLoading, errorMessage } = useTeacherApi(props.language);
  const completed = getInteractionCount(props.progress, "exercise");
  const blockId = tab === "script" ? 3 : 2;

  const tabLabels = useMemo(
    () =>
      props.language === "fr"
        ? { visual: "Direction artistique", script: "Format court" }
        : { visual: "Art direction", script: "Short format" },
    [props.language],
  );

  const handleImage = (file: File | null) => {
    if (!file) {
      setImagePreview(null);
      setImageMime(undefined);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setImagePreview(result);
      setImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (draft.trim().length === 0 && !imagePreview) {
      return;
    }

    const result = await submit({
      mode: "exercise",
      language: props.language,
      studentInput: draft.trim() || (props.language === "fr" ? "Analyse visuelle jointe." : "Attached visual for analysis."),
      interactionNumber: completed + 1,
      history: props.getHistory("exercise"),
      exerciseTab: tab,
      imageBase64: imagePreview?.replace(/^data:[^;]+;base64,/, ""),
      imageMimeType: imageMime,
    });

    if (result) {
      setResponse(result);
      props.registerInteraction("exercise");
      props.appendHistory("exercise", draft, result);
    }
  };

  return (
    <Card accentColor={tab === "visual" ? "#F05872" : "#FEBA31"} className="space-y-6">
      <PageHeader
        title={
          props.language === "fr"
            ? `Bloc ${blockId} — Atelier`
            : `Block ${blockId} — Workshop`
        }
        description={tabLabels[tab]}
      />

      <div className="flex flex-wrap gap-2">
        {(["visual", "script"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`min-h-[var(--ircom-touch-min)] rounded-[var(--ircom-radius-pill)] px-4 text-sm font-medium ${
              tab === key
                ? "bg-[var(--ircom-blue)] text-white"
                : "bg-[var(--ircom-panel-subtle)] text-[var(--ircom-text-heading)]"
            }`}
            data-testid={`exercise-tab-${key}`}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      <ProgressBar value={completed} max={2} label={t(props.language, "progressLabel")} />

      <ToolRouter language={props.language} blockId={blockId} />

      {tab === "visual" ? (
        <label className="block space-y-2 text-sm">
          <span className="ircom-heading font-medium">
            {props.language === "fr" ? "Importer un visuel (optionnel)" : "Upload visual (optional)"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => handleImage(event.target.files?.[0] ?? null)}
            className="min-h-[var(--ircom-touch-min)] w-full text-sm"
            data-testid="exercise-image-input"
          />
        </label>
      ) : null}

      <textarea
        className="ircom-input min-h-36 w-full rounded-[var(--ircom-radius-md)] p-3 text-sm"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={
          tab === "visual"
            ? props.language === "fr"
              ? "Décris ton visuel ou colle le prompt Firefly utilisé…"
              : "Describe your visual or paste the Firefly prompt used…"
            : props.language === "fr"
              ? "Colle ton script 30 secondes…"
              : "Paste your 30-second script…"
        }
        data-testid="exercise-input"
      />

      <Button onClick={handleSubmit} disabled={isLoading} data-testid="exercise-submit">
        {isLoading ? t(props.language, "submitting") : t(props.language, "submit")}
      </Button>

      {errorMessage ? (
        <p className="rounded-[var(--ircom-radius-md)] bg-[#f0587222] p-3 text-sm text-[var(--ircom-red)]" data-testid="error-message">
          {errorMessage}
        </p>
      ) : null}

      {response ? (
        <div data-testid="exercise-response">
          <TeacherFeedback language={props.language} response={response} />
        </div>
      ) : null}
    </Card>
  );
}
