"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { LangSync } from "@/components/lang-sync";
import { CoursMode } from "@/components/modes/cours-mode";
import { useTeacherState } from "@/components/teacher-app";

export default function CoachPage() {
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
          <CoursMode language={state.language} />
        </Suspense>
      </AppShell>
    </>
  );
}
