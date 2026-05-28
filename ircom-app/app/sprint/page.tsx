"use client";

import { AppShell } from "@/components/app-shell";
import { ModeInteraction } from "@/components/mode-interaction";
import { useTeacherState } from "@/components/teacher-app";

export default function SprintPage() {
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
        mode="sprint"
        language={language}
        progress={progress}
        registerInteraction={registerInteraction}
        getHistory={getHistory}
        appendHistory={appendHistory}
        title={language === "fr" ? "Mode Sprint Agence" : "Agency Sprint Mode"}
        description={
          language === "fr"
            ? "Simule un brief annonceur et produis un mini-kit multi-formats."
            : "Simulate an advertiser brief and produce a multi-format mini campaign."
        }
        placeholder={
          language === "fr"
            ? "Exemple: Brief client pour lancement d'evenement corporate..."
            : "Example: Client brief for a corporate event launch..."
        }
      />
    </AppShell>
  );
}
