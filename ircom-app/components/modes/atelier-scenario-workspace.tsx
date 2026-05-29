"use client";

import { useEffect, useState } from "react";
import { VoiceSessionPanel } from "@/components/atelier/voice-session-panel";
import { Button } from "@/components/ui/button";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TeacherFeedback } from "@/components/studio/teacher-feedback";
import { ToolRouter } from "@/components/studio/tool-router";
import { t } from "@/lib/copy/ui-messages";
import type { PendingAttachment } from "@/lib/attachments/read-files";
import { stripDataUrlPrefix, toTeacherAttachments } from "@/lib/attachments/read-files";
import { useVoiceBriefing } from "@/lib/hooks/use-voice-briefing";
import { useTeacherApi } from "@/lib/hooks/use-teacher-api";
import { getAtelierBriefMarkdown } from "@/lib/teacher/brief-markdown";
import {
  getScenarioAttempt,
  recordSubmissionAttempt,
} from "@/lib/teacher/scenario-attempts";
import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import type {
  SubmissionVerdict,
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
  const [attemptRecord, setAttemptRecord] = useState(() =>
    getScenarioAttempt("atelier", props.scenario.id),
  );

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

  useEffect(() => {
    setAttemptRecord(getScenarioAttempt("atelier", props.scenario.id));
    setResponse(null);
    setDraft("");
    setAttachments([]);
  }, [props.scenario.id]);

  const isLockedOut = attemptRecord.sessionStatus === "locked_out";

  const handleSubmit = async () => {
    if (isLockedOut || (draft.trim().length === 0 && attachments.length === 0)) {
      return;
    }

    const isCheckpoint = briefing.orchestrator.isCheckpointActive;
    const checkpointStep = briefing.orchestrator.currentStep;
    const nextAttempt = attemptRecord.attemptCount + 1;

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
      attemptNumber: nextAttempt,
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

    if (!result) {
      return;
    }

    const verdict: SubmissionVerdict = result.submissionVerdict ?? "needs_revision";
    const updatedAttempts = recordSubmissionAttempt("atelier", props.scenario.id, verdict);
    setAttemptRecord(updatedAttempts);
    setResponse(result);

    if (verdict === "accepted") {
      if (isCheckpoint) {
        briefing.submitCheckpointToVoice(result.feedback);
      } else {
        props.registerInteraction("atelier");
        props.appendHistory("atelier", draft, result);
      }
    } else if (verdict !== "game_over" && updatedAttempts.sessionStatus !== "locked_out") {
      setDraft("");
    }
  };

  const checkpointPlaceholder =
    briefing.orchestrator.checkpointPrompt ??
    (props.language === "fr"
      ? "Collez votre livrable ou décrivez ce que vous avez produit avec les outils…"
      : "Paste your deliverable or describe what you produced with the tools…");

  const briefMarkdown = getAtelierBriefMarkdown(props.scenario, props.language);

  return (
    <>
      <article className="ircom-panel-subtle rounded-[var(--ircom-radius-md)] p-4" data-testid="atelier-brief">
        <h3 className="ircom-heading mb-2 text-lg font-semibold">{props.scenario.title}</h3>
        <MarkdownContent markdown={briefMarkdown} />
        <ul className="ircom-secondary mt-4 list-inside list-disc text-sm">
          {props.scenario.deliverables.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

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

        {isLockedOut ? (
          <p className="ircom-secondary text-sm" data-testid="game-over-banner">
            {t(props.language, "gameOverTitle")}
          </p>
        ) : null}

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
          disabled={isLockedOut}
          data-testid="exercise-input"
        />

        <Button
          onClick={() => void handleSubmit()}
          disabled={isLoading || isLockedOut}
          data-testid="exercise-submit"
        >
          {isLoading ? t(props.language, "submitting") : t(props.language, "submit")}
        </Button>

        {errorMessage ? (
          <p
            className="rounded-[var(--ircom-radius-md)] bg-[#f0587222] p-3 text-sm text-[var(--ircom-red)]"
            data-testid="submit-error-message"
          >
            {errorMessage}
          </p>
        ) : null}

        {response ? (
          <div data-testid="exercise-response">
            <TeacherFeedback
              language={props.language}
              response={response}
              attemptCount={attemptRecord.attemptCount}
              isLockedOut={isLockedOut}
            />
          </div>
        ) : null}
      </div>

      <ToolRouter language={props.language} blockId={props.scenario.blocId} />
    </>
  );
}
