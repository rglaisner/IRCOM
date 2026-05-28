"use client";

import { AppShell } from "@/components/app-shell";
import { LangSync } from "@/components/lang-sync";
import { CoachMode } from "@/components/modes/coach-mode";
import { useTeacherState } from "@/components/teacher-app";

export default function CoachPage() {
  const state = useTeacherState();

  return (
    <>
      <LangSync language={state.language} />
      <AppShell language={state.language} onLanguageChange={state.updateLanguage}>
        <CoachMode
          language={state.language}
          progress={state.progress}
          registerInteraction={state.registerInteraction}
          getHistory={state.getHistory}
          appendHistory={state.appendHistory}
        />
      </AppShell>
    </>
  );
}
