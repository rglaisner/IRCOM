"use client";

import { useState } from "react";
import { VoiceSessionPanel } from "@/components/atelier/voice-session-panel";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TeacherFeedback } from "@/components/studio/teacher-feedback";
import { ToolRouter } from "@/components/studio/tool-router";
import { t } from "@/lib/copy/ui-messages";
import { useVoiceBriefing } from "@/lib/hooks/use-voice-briefing";
import { useTeacherApi } from "@/lib/hooks/use-teacher-api";
import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import type {
  SupportedLanguage,
  TeacherMode,
  TeacherRequestMessage,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

interface PendingAttachment {
  filename: string;
  mimeType: string;
  base64: string;
}

interface AtelierScenarioWorkspaceProps {
  language: SupportedLanguage;
  scenario: AtelierScenario;
  completed: number;
  getHistory: (mode: TeacherMode) => TeacherRequestMessage[];
  registerInteraction: (mode: TeacherMode) => void;
  appendHistory: (
    mode: TeacherMode,
    studentInput: string,
    teacherResponse: TeacherResponseOutput,
  ) => void;
}

export function AtelierScenarioWorkspace(props: Readonly<AtelierScenarioWorkspaceProps>) {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [response, setResponse] = useState<TeacherResponseOutput | null>(null);
  const [chatHistory, setChatHistory] = useState<TeacherRequestMessage[]>([]);

  const { submit, isLoading, errorMessage } = useTeacherApi(props.language);

  const onChatReply = (question: string, answer: string) => {
    setChatHistory((prev) => [
      ...prev,
      { role: "student", content: question },
      { role: "teacher", content: answer },
    ]);
  };

  const briefing = useVoiceBriefing({
    language: props.language,
    scenario: props.scenario,
    chatHistory: [...props.getHistory("atelier"), ...chatHistory],
    onChatReply,
  });

  const handleAttachments = async (files: FileList | null) => {
    if (!files) {
      return;
    }

    const next: PendingAttachment[] = [];
    for (const file of Array.from(files).slice(0, MAX_ATTACHMENTS)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        continue;
      }
      const base64 = await readFileAsDataUrl(file);
      next.push({ filename: file.name, mimeType: file.type, base64 });
    }
    setAttachments(next);
  };

  const handleSubmit = async () => {
    if (draft.trim().length === 0 && attachments.length === 0) {
      return;
    }

    const isCheckpoint = briefing.orchestrator.isCheckpointActive;
    const checkpointStep = briefing.orchestrator.currentStep;

    const contextPrefix =
      props.language === "fr"
        ? `Scénario : ${props.scenario.title}\n${props.scenario.situation}\n\nLivrable :\n`
        : `Scenario: ${props.scenario.title}\n${props.scenario.situation}\n\nDeliverable:\n`;

    const firstAttachment = attachments[0];
    const result = await submit({
      mode: "atelier",
      language: props.language,
      studentInput: `${contextPrefix}${draft.trim() || (props.language === "fr" ? "Pièces jointes pour analyse." : "Attachments for analysis.")}`,
      interactionNumber: props.completed + 1,
      history: props.getHistory("atelier"),
      scenarioId: props.scenario.id,
      blocId: props.scenario.blocId,
      exerciseTab:
        props.scenario.blocId === 3 ? "script" : props.scenario.blocId === 2 ? "visual" : undefined,
      imageBase64: firstAttachment?.base64.replace(/^data:[^;]+;base64,/, ""),
      imageMimeType: firstAttachment?.mimeType,
      ...(attachments.length > 0
        ? {
            attachments: attachments.map((item) => ({
              filename: item.filename,
              mimeType: item.mimeType,
              base64: item.base64.replace(/^data:[^;]+;base64,/, ""),
            })),
          }
        : {}),
      briefingStepId:
        isCheckpoint && checkpointStep?.type === "deliverable_checkpoint"
          ? checkpointStep.id
          : undefined,
      checkpointOnly: isCheckpoint,
    });

    if (result) {
      setResponse(result);
      if (isCheckpoint) {
        briefing.submitCheckpointToVoice(result.feedback);
      } else {
        props.registerInteraction("atelier");
        props.appendHistory("atelier", draft, result);
      }
    }
  };

  const checkpointPlaceholder =
    briefing.orchestrator.checkpointPrompt ??
    (props.language === "fr"
      ? "Collez votre livrable ou décrivez ce que vous avez produit avec les outils…"
      : "Paste your deliverable or describe what you produced with the tools…");

  return (
    <>
      <VoiceSessionPanel
        language={props.language}
        scenario={props.scenario}
        chatHistory={[...props.getHistory("atelier"), ...chatHistory]}
        onChatReply={onChatReply}
        briefing={briefing}
      />

      <div className="space-y-4" data-testid="atelier-deliverable-panel">
        <h3 className="ircom-heading text-sm font-medium">{t(props.language, "workOnDeliverable")}</h3>

        <ProgressBar
          value={props.completed}
          max={2}
          label={t(props.language, "progressLabel")}
        />

        <label className="block space-y-2 text-sm">
          <span className="ircom-heading font-medium">
            {props.language === "fr"
              ? "Pièces jointes (PDF, images, texte — max 3 × 4 Mo)"
              : "Supporting files (PDF, images, text — max 3 × 4 MB)"}
          </span>
          <input
            type="file"
            accept=".pdf,.txt,.md,image/*"
            multiple
            onChange={(event) => void handleAttachments(event.target.files)}
            className="min-h-[var(--ircom-touch-min)] w-full text-sm"
            data-testid="exercise-attachments-input"
          />
        </label>

        {attachments.length > 0 ? (
          <ul className="ircom-secondary list-inside list-disc text-xs">
            {attachments.map((file) => (
              <li key={file.filename}>{file.filename}</li>
            ))}
          </ul>
        ) : null}

        <textarea
          className="ircom-input min-h-36 w-full rounded-[var(--ircom-radius-md)] p-3 text-sm"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={checkpointPlaceholder}
          data-testid="exercise-input"
        />

        <Button onClick={() => void handleSubmit()} disabled={isLoading} data-testid="exercise-submit">
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

      <ToolRouter language={props.language} blockId={props.scenario.blocId} />
    </>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read file."));
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}
