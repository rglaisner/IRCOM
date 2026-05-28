"use client";

import { t } from "@/lib/copy/ui-messages";
import type { SupportedLanguage, TeacherResponseOutput } from "@/lib/teacher/types";
import { ProgressBar } from "@/components/ui/progress-bar";

export function TeacherFeedback({
  language,
  response,
  streamingText,
}: Readonly<{
  language: SupportedLanguage;
  response: TeacherResponseOutput | null;
  streamingText?: string;
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

  return (
    <article className={panelClass} data-testid="teacher-response">
      <h3 className="ircom-heading font-semibold">{response.title}</h3>
      <p className="ircom-body text-sm leading-relaxed">{response.feedback}</p>

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
