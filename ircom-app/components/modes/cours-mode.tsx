"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/lib/copy/ui-messages";
import { getAtelierScenariosForBloc } from "@/lib/teacher/atelier-content";
import { getCourseBloc } from "@/lib/teacher/course-content";
import type { SupportedLanguage } from "@/lib/teacher/types";

interface CoursModeProps {
  language: SupportedLanguage;
}

export function CoursMode({ language }: Readonly<CoursModeProps>) {
  const searchParams = useSearchParams();
  const initialBloc = Number(searchParams.get("bloc") ?? "1");
  const [blocId, setBlocId] = useState(
    initialBloc >= 1 && initialBloc <= 3 ? initialBloc : 1,
  );

  const bloc = getCourseBloc(language, blocId);
  const scenarios = getAtelierScenariosForBloc(language, blocId);
  const defaultScenarioId = scenarios[0]?.id;

  const sectionIds = useMemo(
    () => bloc?.sections.map((section) => section.id) ?? [],
    [bloc],
  );
  const [activeSectionId, setActiveSectionId] = useState(sectionIds[0] ?? "philosophy");

  const activeSection = bloc?.sections.find((section) => section.id === activeSectionId);

  if (!bloc) {
    return null;
  }

  return (
    <Card accentColor={blocId === 1 ? "#3B74F7" : blocId === 2 ? "#F05872" : "#FEBA31"} className="space-y-6">
      <PageHeader
        title={
          language === "fr" ? `Cours — Bloc ${blocId}` : `Course — Block ${blocId}`
        }
        description={bloc.subtitle}
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Blocs">
        {[1, 2, 3].map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={blocId === id}
            onClick={() => {
              setBlocId(id);
              const nextBloc = getCourseBloc(language, id);
              setActiveSectionId(nextBloc?.sections[0]?.id ?? "philosophy");
            }}
            className={`min-h-[var(--ircom-touch-min)] rounded-[var(--ircom-radius-pill)] px-4 text-sm font-medium ${
              blocId === id
                ? "bg-[var(--ircom-blue)] text-white"
                : "bg-[var(--ircom-panel-subtle)] text-[var(--ircom-text-heading)]"
            }`}
            data-testid={`cours-bloc-${id}`}
          >
            {language === "fr" ? `Bloc ${id}` : `Block ${id}`}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1" aria-label={t(language, "courseSections")}>
          {bloc.sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
              className={`min-h-[var(--ircom-touch-min)] w-full rounded-[var(--ircom-radius-md)] px-3 text-left text-sm ${
                activeSectionId === section.id
                  ? "bg-[var(--ircom-navy)] font-medium text-white"
                  : "bg-[var(--ircom-panel-subtle)] text-[var(--ircom-text-heading)] hover:opacity-90"
              }`}
              data-testid={`cours-section-${section.id}`}
            >
              {section.title}
            </button>
          ))}
        </nav>

        <article data-testid="cours-section-content">
          {activeSection ? (
            <>
              <h3 className="ircom-heading mb-4 text-lg font-semibold">{activeSection.title}</h3>
              <MarkdownContent markdown={activeSection.markdown} />
            </>
          ) : null}
        </article>
      </div>

      {defaultScenarioId ? (
        <Link
          href={`/exercise?bloc=${blocId}&scenario=${defaultScenarioId}`}
          className="inline-flex min-h-[var(--ircom-touch-min)] items-center justify-center rounded-[var(--ircom-radius-pill)] bg-[var(--ircom-blue)] px-5 text-sm font-medium text-white hover:opacity-90"
          data-testid="cours-go-atelier"
        >
          {t(language, "goToAtelier")}
        </Link>
      ) : null}
    </Card>
  );
}
