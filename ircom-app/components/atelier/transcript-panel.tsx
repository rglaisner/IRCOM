"use client";

import { t } from "@/lib/copy/ui-messages";
import type { SupportedLanguage } from "@/lib/teacher/types";

interface TranscriptPanelProps {
  language: SupportedLanguage;
  transcript: string;
  isStreaming: boolean;
}

export function TranscriptPanel({
  language,
  transcript,
  isStreaming,
}: Readonly<TranscriptPanelProps>) {
  return (
    <section
      className="ircom-panel-subtle max-h-64 overflow-y-auto rounded-[var(--ircom-radius-md)] p-4"
      aria-live="polite"
      data-testid="narration-transcript"
    >
      <p className="ircom-heading mb-2 text-xs font-medium uppercase tracking-wide opacity-70">
        {t(language, "narrationTranscript")}
        {isStreaming ? "…" : ""}
      </p>
      <p className="ircom-body whitespace-pre-wrap text-sm leading-relaxed">
        {transcript.length > 0
          ? transcript
          : language === "fr"
            ? "Le briefing apparaîtra ici au fur et à mesure."
            : "The briefing will appear here as it is generated."}
      </p>
    </section>
  );
}
