"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { LangSync } from "@/components/lang-sync";
import { AtelierMode } from "@/components/modes/atelier-mode";
import { useTeacherState } from "@/components/teacher-app";

export default function ExercisePage() {
  const state = useTeacherState();

  return (
    <>
      <LangSync language={state.language} />
      <AppShell
        language={state.language}
        onLanguageChange={state.updateLanguage}
        onRestartSession={state.resetSession}
      >
        <Suspense fallback={<p className="ircom-secondary text-sm">…</p>}>
          <AtelierMode
            language={state.language}
            progress={state.progress}
            registerInteraction={state.registerInteraction}
            getHistory={state.getHistory}
            appendHistory={state.appendHistory}
          />
        </Suspense>
      </AppShell>
    </>
  );
}
