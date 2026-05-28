"use client";

import { AppShell } from "@/components/app-shell";
import { ModeInteraction } from "@/components/mode-interaction";
import { useTeacherState } from "@/components/teacher-app";

export default function ExercisePage() {
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
        mode="exercise"
        language={language}
        progress={progress}
        registerInteraction={registerInteraction}
        getHistory={getHistory}
        appendHistory={appendHistory}
        title={language === "fr" ? "Mode Exercice" : "Exercise Mode"}
        description={
          language === "fr"
            ? "Soumets une proposition, puis ameliore-la apres critique."
            : "Submit a draft, then improve it after AI critique."
        }
        placeholder={
          language === "fr"
            ? "Exemple: Voici mon carrousel Instagram de campagne..."
            : "Example: Here is my campaign Instagram carousel draft..."
        }
      />
    </AppShell>
  );
}
