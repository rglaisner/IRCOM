"use client";

import { t } from "@/lib/copy/ui-messages";
import type { SupportedLanguage, TeacherResponseOutput } from "@/lib/teacher/types";
import { ProgressBar } from "@/components/ui/progress-bar";

export function TeacherFeedback({
  language,
  response,
  streamingText,
  attemptCount,
  isLockedOut,
}: Readonly<{
  language: SupportedLanguage;
  response: TeacherResponseOutput | null;
  streamingText?: string;
  attemptCount?: number;
  isLockedOut?: boolean;
}>) {
  if (!response && !streamingText) {
    return null;
  }

  const panelClass =
    "mt-4 space-y-4 rounded-[var(--ircom-radius-md)] border border-[var(--ircom-border)] bg-[var(--ircom-surface)] p-4";

  if (!response && streamingText) {
    return (
      <article className={panelClass} data-testid="streaming-response">
        <p className="ircom-body text-sm whitespace-pre-wrap">{streamingText}</p>
      </article>
    );
  }

  if (!response) {
    return null;
  }

  const verdict = response.submissionVerdict;
  const verdictTitle =
    verdict === "game_over" || isLockedOut
      ? t(language, "gameOverTitle")
      : verdict === "off_topic"
        ? t(language, "offTopicTitle")
        : verdict === "needs_revision"
          ? t(language, "needsRevisionTitle")
          : null;

  const verdictBorder =
    verdict === "game_over" || isLockedOut
      ? "border-[var(--ircom-red)]"
      : verdict === "off_topic"
        ? "border-[var(--ircom-red)]"
        : verdict === "needs_revision"
          ? "border-[#FEBA31]"
          : "border-[var(--ircom-border)]";

  return (
    <article
      className={`${panelClass} ${verdictTitle ? verdictBorder : ""}`}
      data-testid="teacher-response"
      data-verdict={verdict ?? "unknown"}
    >
      {typeof attemptCount === "number" && attemptCount > 0 ? (
        <p className="ircom-secondary text-xs" data-testid="attempt-counter">
          {t(language, "attemptLabel")} {attemptCount}/3
        </p>
      ) : null}

      {verdictTitle ? (
        <p className="ircom-heading text-sm font-semibold text-[var(--ircom-text-heading)]">
          {verdictTitle}
        </p>
      ) : null}

      <h3 className="ircom-heading font-semibold">{response.title}</h3>
      <p className="ircom-body text-sm leading-relaxed">{response.feedback}</p>

      {response.minAcceptableHint ? (
        <div
          className="rounded-[var(--ircom-radius-md)] bg-[var(--ircom-panel-subtle)] p-3 text-sm"
          data-testid="min-acceptable-hint"
        >
          <p className="ircom-heading mb-1 text-xs font-semibold uppercase tracking-wide">
            {language === "fr" ? "Minimum acceptable" : "Minimum acceptable"}
          </p>
          <p className="ircom-body">{response.minAcceptableHint}</p>
        </div>
      ) : null}

      {(verdict === "game_over" || isLockedOut) && response.idealSubmission ? (
        <div
          className="rounded-[var(--ircom-radius-md)] border border-[var(--ircom-border)] p-3 text-sm"
          data-testid="ideal-submission"
        >
          <p className="ircom-heading mb-1 font-semibold">{t(language, "gameOverHint")}</p>
          <p className="ircom-body whitespace-pre-wrap">{response.idealSubmission}</p>
        </div>
      ) : null}

      {typeof response.qualityScore === "number" ? (
        <div data-testid="quality-meter">
          <ProgressBar
            value={response.qualityScore}
            max={100}
            label={t(language, "qualityMeter")}
          />
        </div>
      ) : null}

      <p className="ircom-body text-sm">
        <span className="ircom-heading font-medium">
          {language === "fr" ? "Prochaine étape : " : "Next step: "}
        </span>
        {response.nextStep}
      </p>

      {response.recommendedTool ? (
        <p className="ircom-secondary text-sm">
          {language === "fr" ? "Outil suggéré : " : "Suggested tool: "}
          <span className="font-medium text-[var(--ircom-text)]">
            {response.recommendedTool}
          </span>
        </p>
      ) : null}

      <ul className="ircom-secondary list-disc space-y-1 pl-5 text-sm">
        {response.critiqueChecklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {response.deliverableChecklist && response.deliverableChecklist.length > 0 ? (
        <div>
          <p className="ircom-heading mb-2 text-sm font-medium">
            {language === "fr" ? "Checklist livrables" : "Deliverable checklist"}
          </p>
          <ul className="ircom-secondary list-decimal space-y-1 pl-5 text-sm">
            {response.deliverableChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {response.visualNotes && response.visualNotes.length > 0 ? (
        <div>
          <p className="ircom-heading mb-2 text-sm font-medium">
            {language === "fr" ? "Notes visuelles" : "Visual notes"}
          </p>
          <ul className="ircom-secondary list-disc space-y-1 pl-5 text-sm">
            {response.visualNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
