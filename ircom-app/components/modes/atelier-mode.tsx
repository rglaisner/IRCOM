"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ScenarioPicker } from "@/components/atelier/scenario-picker";
import { VoiceSessionPanel } from "@/components/atelier/voice-session-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TeacherFeedback } from "@/components/studio/teacher-feedback";
import { ToolRouter } from "@/components/studio/tool-router";
import { t } from "@/lib/copy/ui-messages";
import { useTeacherApi } from "@/lib/hooks/use-teacher-api";
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
  const [deliverableOpen, setDeliverableOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | undefined>();
  const [response, setResponse] = useState<TeacherResponseOutput | null>(null);
  const [chatHistory, setChatHistory] = useState<TeacherRequestMessage[]>([]);

  const { submit, isLoading, errorMessage } = useTeacherApi(props.language);
  const completed = getInteractionCount(props.progress, "atelier");
  const scenario =
    selectedScenarioId !== null
      ? getAtelierScenario(props.language, selectedScenarioId)
      : undefined;

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
    if (!scenario || (draft.trim().length === 0 && !imagePreview)) {
      return;
    }

    const contextPrefix =
      props.language === "fr"
        ? `Scénario : ${scenario.title}\n${scenario.situation}\n\nLivrable :\n`
        : `Scenario: ${scenario.title}\n${scenario.situation}\n\nDeliverable:\n`;

    const result = await submit({
      mode: "atelier",
      language: props.language,
      studentInput: `${contextPrefix}${draft.trim() || (props.language === "fr" ? "Analyse visuelle jointe." : "Attached visual for analysis.")}`,
      interactionNumber: completed + 1,
      history: props.getHistory("atelier"),
      scenarioId: scenario.id,
      blocId: scenario.blocId,
      exerciseTab: scenario.blocId === 3 ? "script" : scenario.blocId === 2 ? "visual" : undefined,
      imageBase64: imagePreview?.replace(/^data:[^;]+;base64,/, ""),
      imageMimeType: imageMime,
    });

    if (result) {
      setResponse(result);
      props.registerInteraction("atelier");
      props.appendHistory("atelier", draft, result);
    }
  };

  const onChatReply = (question: string, answer: string) => {
    setChatHistory((prev) => [
      ...prev,
      { role: "student", content: question },
      { role: "teacher", content: answer },
    ]);
  };

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
              setResponse(null);
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
        onSelect={(id) => {
          setSelectedScenarioId(id);
          setResponse(null);
        }}
      />

      {scenario ? (
        <>
          <div className="ircom-panel-subtle space-y-2 rounded-[var(--ircom-radius-md)] p-4 text-sm">
            <p className="ircom-heading font-medium">{scenario.title}</p>
            <p className="ircom-body leading-relaxed">{scenario.situation}</p>
            <ul className="ircom-secondary list-inside list-disc text-xs">
              {scenario.constraints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <VoiceSessionPanel
            language={props.language}
            scenario={scenario}
            chatHistory={[...props.getHistory("atelier"), ...chatHistory]}
            onChatReply={onChatReply}
          />

          <ToolRouter language={props.language} blockId={scenario.blocId} />

          <button
            type="button"
            className="ircom-heading min-h-[var(--ircom-touch-min)] text-sm font-medium text-[var(--ircom-blue)] underline-offset-2 hover:underline"
            onClick={() => setDeliverableOpen((open) => !open)}
            data-testid="toggle-deliverable-panel"
          >
            {t(props.language, "workOnDeliverable")}
            {deliverableOpen ? " ▴" : " ▾"}
          </button>

          {deliverableOpen ? (
            <div className="space-y-4" data-testid="atelier-deliverable-panel">
              <ProgressBar
                value={completed}
                max={2}
                label={t(props.language, "progressLabel")}
              />

              {scenario.allowsImageUpload ? (
                <label className="block space-y-2 text-sm">
                  <span className="ircom-heading font-medium">
                    {props.language === "fr"
                      ? "Importer un visuel (optionnel)"
                      : "Upload visual (optional)"}
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
                  props.language === "fr"
                    ? "Collez votre livrable ou décrivez ce que vous avez produit avec les outils…"
                    : "Paste your deliverable or describe what you produced with the tools…"
                }
                data-testid="exercise-input"
              />

              <Button onClick={handleSubmit} disabled={isLoading} data-testid="exercise-submit">
                {isLoading ? t(props.language, "submitting") : t(props.language, "submit")}
              </Button>

              {errorMessage ? (
                <p
                  className="rounded-[var(--ircom-radius-md)] bg-[#f0587222] p-3 text-sm text-[var(--ircom-red)]"
                  data-testid="error-message"
                >
                  {errorMessage}
                </p>
              ) : null}

              {response ? (
                <div data-testid="exercise-response">
                  <TeacherFeedback language={props.language} response={response} />
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
