"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useTeacherState } from "@/components/teacher-app";

const modeCards = [
  { key: "coach", href: "/coach", titleFr: "Coach", titleEn: "Coach" },
  {
    key: "exercise",
    href: "/exercise",
    titleFr: "Exercice",
    titleEn: "Exercise",
  },
  { key: "sprint", href: "/sprint", titleFr: "Sprint", titleEn: "Sprint" },
] as const;

export default function Home() {
  const { language, progress, updateLanguage } = useTeacherState();

  return (
    <AppShell language={language} onLanguageChange={updateLanguage}>
      <main className="grid gap-4">
        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold">
            {language === "fr"
              ? "Parcours IRCOM - Assistant Pedagogique"
              : "IRCOM Learning Path - Teaching Assistant"}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {language === "fr"
              ? "Objectif MVP: terminer au moins 2 interactions dans chaque mode."
              : "MVP target: complete at least 2 interactions in each mode."}
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {modeCards.map((card) => (
            <article
              key={card.key}
              className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900"
              data-testid={`${card.key}-progress-card`}
            >
              <h3 className="text-lg font-semibold">
                {language === "fr" ? card.titleFr : card.titleEn}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {progress[card.key].interactionsCompleted} / 2
              </p>
              <Link
                href={card.href}
                className="mt-3 inline-flex rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
              >
                {language === "fr" ? "Ouvrir" : "Open"}
              </Link>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
