"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/copy/ui-messages";
import type { SupportedLanguage } from "@/lib/teacher/types";

const navItems = [
  { href: "/", labelKey: "navDashboard" as const },
  { href: "/coach", labelKey: "navCourse" as const },
  { href: "/exercise", labelKey: "navAtelier" as const },
  { href: "/sprint", labelKey: "navSprint" as const },
];

export function AppShell({
  children,
  language,
  onLanguageChange,
}: Readonly<{
  children: React.ReactNode;
  language: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
}>) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col bg-[var(--ircom-page)]">
      <header className="border-b border-[var(--ircom-navy)] bg-[var(--ircom-navy)] text-[var(--ircom-text-on-navy)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="inline-flex shrink-0 items-center">
              <Image
                src="/ircom-logo-bleu-baseline.png"
                alt="IRCOM — Humanités et Management"
                width={160}
                height={40}
                priority
                className="brightness-0 invert"
                style={{ width: "auto", height: "2.25rem" }}
              />
            </Link>
            <label className="flex min-h-[var(--ircom-touch-min)] items-center gap-2 text-sm">
              <span className="sr-only">{t(language, "languageLabel")}</span>
              <select
                className="min-h-[var(--ircom-touch-min)] rounded-[var(--ircom-radius-md)] border border-white/40 bg-white/15 px-3 py-2 text-[var(--ircom-text-on-navy)] [&_option]:bg-white [&_option]:text-[var(--ircom-text)]"
                value={language}
                onChange={(event) =>
                  onLanguageChange(event.target.value as SupportedLanguage)
                }
                data-testid="language-select"
                aria-label={t(language, "languageLabel")}
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
            </label>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Main">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-[var(--ircom-touch-min)] items-center rounded-[var(--ircom-radius-pill)] px-4 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--ircom-blue)] text-[var(--ircom-text-on-navy)]"
                      : "bg-white/15 text-[var(--ircom-text-on-navy)] hover:bg-white/25"
                  }`}
                >
                  {t(language, item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
