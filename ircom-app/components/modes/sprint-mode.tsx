"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { VoiceSessionPanel } from "@/components/atelier/voice-session-panel";
import { useVoiceBriefing } from "@/lib/hooks/use-voice-briefing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TeacherFeedback } from "@/components/studio/teacher-feedback";
import { ToolRouter } from "@/components/studio/tool-router";
import { t } from "@/lib/copy/ui-messages";
import type { PendingAttachment } from "@/lib/attachments/read-files";
import { stripDataUrlPrefix, toTeacherAttachments } from "@/lib/attachments/read-files";
import { useTeacherApi } from "@/lib/hooks/use-teacher-api";
import { getSprintContent, getSprintScenario } from "@/lib/teacher/sprint-content";
import { getInteractionCount } from "@/lib/teacher/progress";
import {
  getScenarioAttempt,
  recordSubmissionAttempt,
} from "@/lib/teacher/scenario-attempts";
import type {
  SubmissionVerdict,
  StudentProgress,
  SupportedLanguage,
  TeacherMode,
  TeacherRequestMessage,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

const RUSH_SECONDS = 2 * 60 * 60;

interface SprintModeProps {
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

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function SprintMode(props: Readonly<SprintModeProps>) {
  const searchParams = useSearchParams();
  const sprintContent = getSprintContent(props.language);
  const initialScenario = searchParams.get("scenario");
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    initialScenario && sprintContent.scenarios.some((s) => s.id === initialScenario)
      ? initialScenario
      : sprintContent.scenarios[0].id,
  );
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [response, setResponse] = useState<TeacherResponseOutput | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RUSH_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [chatHistory, setChatHistory] = useState<TeacherRequestMessage[]>([]);
  const { submit, isLoading, errorMessage } = useTeacherApi(props.language);
  const completed = getInteractionCount(props.progress, "sprint");
  const scenario =
    getSprintScenario(props.language, selectedScenarioId) ?? sprintContent.scenarios[0];

  const [attemptRecord, setAttemptRecord] = useState(() =>
    getScenarioAttempt("sprint", scenario.id),
  );

  const onChatReply = (question: string, answer: string) => {
    setChatHistory((prev) => [
      ...prev,
      { role: "student", content: question },
      { role: "teacher", content: answer },
    ]);
  };

  const startRushTimer = useCallback(() => {
    setSecondsLeft(RUSH_SECONDS);
    setTimerRunning(true);
    setTimeUp(false);
  }, []);

  const briefing = useVoiceBriefing({
    language: props.language,
    scenario,
    context: "sprint",
    chatHistory: [...props.getHistory("sprint"), ...chatHistory],
    onChatReply,
    onBriefingStart: startRushTimer,
  });

  const disconnectLive = briefing.disconnectLive;

  useEffect(() => {
    setAttemptRecord(getScenarioAttempt("sprint", scenario.id));
    setResponse(null);
    setDraft("");
    setAttachments([]);
    setSecondsLeft(RUSH_SECONDS);
    setTimerRunning(false);
    setTimeUp(false);
  }, [scenario.id]);

  useEffect(() => {
    if (!timerRunning || secondsLeft > 0) {
      return;
    }

    setTimerRunning(false);
    setTimeUp(true);
    disconnectLive();
  }, [timerRunning, secondsLeft, disconnectLive]);

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const isLockedOut = attemptRecord.sessionStatus === "locked_out";

  const handleSubmit = async () => {
    if (!scenario || isLockedOut || (draft.trim().length === 0 && attachments.length === 0)) {
      return;
    }

    const prefix =
      props.language === "fr"
        ? `Scénario ${scenario.letter} — ${scenario.title}\n\nKit de campagne :\n`
        : `Scenario ${scenario.letter} — ${scenario.title}\n\nCampaign kit:\n`;

    const nextAttempt = attemptRecord.attemptCount + 1;
    const firstAttachment = attachments[0];
    const result = await submit({
      mode: "sprint",
      language: props.language,
      studentInput: `${prefix}${draft.trim() || (props.language === "fr" ? "Pièces jointes pour analyse." : "Attachments for analysis.")}`,
      interactionNumber: completed + 1,
      attemptNumber: nextAttempt,
      history: props.getHistory("sprint"),
      scenarioId: scenario.id,
      blocId: 4,
      imageBase64: firstAttachment ? stripDataUrlPrefix(firstAttachment.base64) : undefined,
      imageMimeType: firstAttachment?.mimeType,
      ...(attachments.length > 0 ? { attachments: toTeacherAttachments(attachments) } : {}),
    });

    if (!result) {
      return;
    }

    const verdict: SubmissionVerdict = result.submissionVerdict ?? "needs_revision";
    const updatedAttempts = recordSubmissionAttempt("sprint", scenario.id, verdict);
    setAttemptRecord(updatedAttempts);
    setResponse(result);

    if (verdict === "accepted") {
      props.registerInteraction("sprint");
      props.appendHistory("sprint", draft, result);
    } else if (verdict !== "game_over" && updatedAttempts.sessionStatus !== "locked_out") {
      setDraft("");
    }
  };

  const exportKit = () => {
    if (!response || !scenario) {
      return;
    }

    const lines = [
      `# ${response.title}`,
      "",
      `## ${scenario.title}`,
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
    anchor.download = `ircom-sprint-${scenario.letter}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!scenario) {
    return null;
  }

  return (
    <Card accentColor="#071554" className="space-y-6">
      <PageHeader
        title={props.language === "fr" ? "Bloc 4 — Sprint agence" : "Block 4 — Agency sprint"}
        description={
          props.language === "fr"
            ? "Rush 2 h : lancez le briefing pour démarrer le chrono, produisez, puis Grand Oral."
            : "2h rush: start the briefing to begin the clock, produce, then Grand Oral."
        }
      />

      <div className="flex flex-wrap gap-2" data-testid="sprint-scenario-picker">
        {sprintContent.scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSelectedScenarioId(item.id);
              setResponse(null);
            }}
            className={`min-h-[var(--ircom-touch-min)] rounded-[var(--ircom-radius-pill)] px-4 text-sm font-medium ${
              selectedScenarioId === item.id
                ? "bg-[var(--ircom-navy)] text-white"
                : "bg-[var(--ircom-panel-subtle)] text-[var(--ircom-text-heading)]"
            }`}
            data-testid={`sprint-scenario-${item.letter}`}
          >
            {props.language === "fr" ? `Scénario ${item.letter}` : `Scenario ${item.letter}`}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--ircom-radius-md)] bg-[var(--ircom-navy)] p-4 text-white">
        <div>
          <p className="text-sm opacity-80">
            {props.language === "fr" ? "Temps restant" : "Time remaining"}
          </p>
          <p className="text-2xl font-semibold tabular-nums" data-testid="sprint-timer">
            {formatTime(secondsLeft)}
          </p>
          {timerRunning ? (
            <p className="mt-1 text-xs opacity-80" data-testid="sprint-timer-running">
              {props.language === "fr" ? "Rush en cours" : "Rush in progress"}
            </p>
          ) : null}
        </div>
        <p className="max-w-xs text-sm opacity-90">
          {props.language === "fr"
            ? "Le chrono démarre avec « Écouter le briefing »."
            : "The clock starts when you listen to the briefing."}
        </p>
      </div>

      {timeUp ? (
        <p
          className="rounded-[var(--ircom-radius-md)] border border-[var(--ircom-red)] bg-[#f0587211] p-3 text-sm text-[var(--ircom-red)]"
          data-testid="sprint-time-up"
        >
          {props.language === "fr"
            ? "Temps écoulé — finalisez votre kit ou exportez ce que vous avez."
            : "Time is up — finalize your kit or export what you have."}
        </p>
      ) : null}

      <article className="ircom-panel-subtle rounded-[var(--ircom-radius-md)] p-4" data-testid="sprint-brief">
        <h3 className="ircom-heading mb-2 text-lg font-semibold">{scenario.title}</h3>
        <MarkdownContent markdown={scenario.briefMarkdown} />
        <ul className="ircom-secondary mt-4 list-inside list-disc text-sm">
          {scenario.deliverableChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <VoiceSessionPanel
        language={props.language}
        scenario={scenario}
        chatHistory={[...props.getHistory("sprint"), ...chatHistory]}
        onChatReply={onChatReply}
        briefing={briefing}
      />

      <ProgressBar value={completed} max={2} label={t(props.language, "progressLabel")} />

      <FileUploadButton
        language={props.language}
        files={attachments}
        onFilesSelected={setAttachments}
        testId="sprint-attachments"
      />

      <textarea
        className="ircom-input min-h-36 w-full rounded-[var(--ircom-radius-md)] p-3 text-sm"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={
          props.language === "fr"
            ? "Collez votre kit de campagne (texte, notes visuelles, script vidéo)…"
            : "Paste your campaign kit (copy, visual notes, video script)…"
        }
        disabled={isLockedOut}
        data-testid="sprint-input"
      />

      <Button
        onClick={() => void handleSubmit()}
        disabled={isLoading || isLockedOut}
        data-testid="sprint-submit"
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
        <div data-testid="sprint-response">
          <TeacherFeedback
            language={props.language}
            response={response}
            attemptCount={attemptRecord.attemptCount}
            isLockedOut={isLockedOut}
          />
          <Button variant="ghost" className="mt-4" onClick={exportKit} data-testid="sprint-export">
            {t(props.language, "exportSprint")}
          </Button>
        </div>
      ) : null}

      <ToolRouter language={props.language} blockId={4} />
    </Card>
  );
}
