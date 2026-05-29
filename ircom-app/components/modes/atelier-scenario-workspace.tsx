"use client";

import { useState } from "react";
import { VoiceSessionPanel } from "@/components/atelier/voice-session-panel";
import { Button } from "@/components/ui/button";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TeacherFeedback } from "@/components/studio/teacher-feedback";
import { ToolRouter } from "@/components/studio/tool-router";
import { t } from "@/lib/copy/ui-messages";
import type { PendingAttachment } from "@/lib/attachments/read-files";
import { stripDataUrlPrefix, toTeacherAttachments } from "@/lib/attachments/read-files";
import { useVoiceBriefing } from "@/lib/hooks/use-voice-briefing";
import { useTeacherApi } from "@/lib/hooks/use-teacher-api";
import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import type {
  SupportedLanguage,
  TeacherMode,
  TeacherRequestMessage,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

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
      imageBase64: firstAttachment ? stripDataUrlPrefix(firstAttachment.base64) : undefined,
      imageMimeType: firstAttachment?.mimeType,
      ...(attachments.length > 0 ? { attachments: toTeacherAttachments(attachments) } : {}),
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

        <FileUploadButton
          language={props.language}
          files={attachments}
          onFilesSelected={setAttachments}
          testId="exercise-attachments"
        />

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
