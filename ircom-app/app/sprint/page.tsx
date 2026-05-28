"use client";

import { AppShell } from "@/components/app-shell";
import { LangSync } from "@/components/lang-sync";
import { SprintMode } from "@/components/modes/sprint-mode";
import { useTeacherState } from "@/components/teacher-app";

export default function SprintPage() {
  const state = useTeacherState();

  return (
    <>
      <LangSync language={state.language} />
      <AppShell language={state.language} onLanguageChange={state.updateLanguage}>
        <SprintMode
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
