"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LangSync } from "@/components/lang-sync";
import { useTeacherState } from "@/components/teacher-app";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { t } from "@/lib/copy/ui-messages";
import { getCurriculum } from "@/lib/teacher/content";
import { getInteractionCount } from "@/lib/teacher/progress";

export default function Home() {
  const { language, progress, updateLanguage } = useTeacherState();
  const curriculum = getCurriculum(language);
  const modes = ["coach", "exercise", "sprint"] as const;

  const totalCompleted = modes.reduce(
    (sum, mode) => sum + getInteractionCount(progress, mode),
    0,
  );
  const totalTarget = modes.length * 2;

  return (
    <>
      <LangSync language={language} />
      <AppShell language={language} onLanguageChange={updateLanguage}>
        <section className="space-y-2">
          <h2 className="ircom-heading text-2xl font-semibold">{t(language, "journeyTitle")}</h2>
          <p className="ircom-body text-sm leading-relaxed">{t(language, "journeySubtitle")}</p>
          <p className="ircom-secondary text-xs">
            {language === "fr" ? "Bac+5 — Alternance" : "Master — Work-study"}
          </p>
        </section>

        <ProgressBar
          value={totalCompleted}
          max={totalTarget}
          label={t(language, "progressLabel")}
        />

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Mode progress">
          {modes.map((mode) => (
            <Card key={mode} data-testid={`${mode}-progress-card`}>
              <p className="ircom-heading text-sm font-medium capitalize">{mode}</p>
              <p className="ircom-secondary mt-1 text-sm">
                {getInteractionCount(progress, mode)} / 2
              </p>
            </Card>
          ))}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {curriculum.blocks.map((block) => {
            const modeProgress =
              block.mode === "coach"
                ? progress.coach
                : block.mode === "exercise"
                  ? progress.exercise
                  : progress.sprint;

            return (
              <Card
                key={block.id}
                accentColor={block.accentColor}
                data-testid={`block-${block.id}-card`}
              >
                <Badge color={block.accentColor}>
                  {t(language, "blockLabel")} {block.id}
                </Badge>
                <h3 className="ircom-heading mt-2 text-lg font-semibold">{block.title}</h3>
                <p className="ircom-secondary mt-1 text-sm">{block.subtitle}</p>
                <p className="ircom-secondary mt-3 text-sm">
                  {modeProgress.interactionsCompleted} / 2 — {t(language, "sessionsTarget")}
                </p>
                <Link
                  href={block.href}
                  className="mt-4 inline-flex min-h-[var(--ircom-touch-min)] items-center justify-center rounded-[var(--ircom-radius-pill)] bg-[var(--ircom-blue)] px-4 text-sm font-medium text-[var(--ircom-text-on-navy)] hover:opacity-90"
                >
                  {t(language, "openMode")}
                </Link>
              </Card>
            );
          })}
        </div>
      </AppShell>
    </>
  );
}
