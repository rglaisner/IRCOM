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

const progressModes = ["atelier", "sprint"] as const;

export default function Home() {
  const { language, progress, updateLanguage } = useTeacherState();
  const curriculum = getCurriculum(language);

  const totalCompleted = progressModes.reduce(
    (sum, mode) => sum + getInteractionCount(progress, mode),
    0,
  );
  const totalTarget = progressModes.length * 2;

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

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Mode progress">
          {progressModes.map((mode) => (
            <Card key={mode} data-testid={`${mode}-progress-card`}>
              <p className="ircom-heading text-sm font-medium">
                {mode === "atelier" ? t(language, "navAtelier") : t(language, "navSprint")}
              </p>
              <p className="ircom-secondary mt-1 text-sm">
                {getInteractionCount(progress, mode)} / 2
              </p>
            </Card>
          ))}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {curriculum.blocks.map((block) => {
            const modeProgress =
              block.mode === "sprint" ? progress.sprint : progress.atelier;

            const primaryHref =
              block.id <= 3
                ? (block.courseHref ?? block.href)
                : block.href;
            const secondaryHref =
              block.id <= 3 ? block.atelierHref : undefined;

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
                {block.id <= 3 ? (
                  <p className="ircom-secondary mt-3 text-xs">
                    {language === "fr"
                      ? "Cours écrit + atelier pratique"
                      : "Written course + hands-on workshop"}
                  </p>
                ) : (
                  <p className="ircom-secondary mt-3 text-sm">
                    {modeProgress.interactionsCompleted} / 2 — {t(language, "sessionsTarget")}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={primaryHref}
                    className="inline-flex min-h-[var(--ircom-touch-min)] items-center justify-center rounded-[var(--ircom-radius-pill)] bg-[var(--ircom-blue)] px-4 text-sm font-medium text-[var(--ircom-text-on-navy)] hover:opacity-90"
                  >
                    {block.id <= 3
                      ? t(language, "navCourse")
                      : t(language, "openMode")}
                  </Link>
                  {secondaryHref ? (
                    <Link
                      href={secondaryHref}
                      className="inline-flex min-h-[var(--ircom-touch-min)] items-center justify-center rounded-[var(--ircom-radius-pill)] border border-[var(--ircom-border)] bg-[var(--ircom-surface)] px-4 text-sm font-medium text-[var(--ircom-text-heading)] hover:opacity-90"
                    >
                      {t(language, "navAtelier")}
                    </Link>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      </AppShell>
    </>
  );
}
