"use client";

import { AppShell } from "@/components/app-shell";
import { ModeInteraction } from "@/components/mode-interaction";
import { useTeacherState } from "@/components/teacher-app";

export default function CoachPage() {
  const {
    language,
    progress,
    registerInteraction,
    getHistory,
    appendHistory,
    updateLanguage,
  } = useTeacherState();

  return (
    <AppShell language={language} onLanguageChange={updateLanguage}>
      <ModeInteraction
        mode="coach"
        language={language}
        progress={progress}
        registerInteraction={registerInteraction}
        getHistory={getHistory}
        appendHistory={appendHistory}
        title={language === "fr" ? "Mode Coach" : "Coach Mode"}
        description={
          language === "fr"
            ? "Travaille le brief, le ton et la structure du prompt."
            : "Practice briefing, tone alignment, and prompt structure."
        }
        placeholder={
          language === "fr"
            ? "Exemple: Je dois transformer un communique de presse en post LinkedIn impactant."
            : "Example: I need to convert a press release into a strong LinkedIn post."
        }
      />
    </AppShell>
  );
}
