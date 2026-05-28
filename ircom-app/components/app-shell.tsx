"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/coach", label: "Coach" },
  { href: "/exercise", label: "Exercise" },
  { href: "/sprint", label: "Sprint" },
];

export function AppShell({
  children,
  language,
  onLanguageChange,
}: Readonly<{
  children: React.ReactNode;
  language: "fr" | "en";
  onLanguageChange: (language: "fr" | "en") => void;
}>) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">IRCOM Gemini Teacher</h1>
          <label className="flex items-center gap-2 text-sm">
            <span>{language === "fr" ? "Langue" : "Language"}</span>
            <select
              className="rounded-md border border-black/20 bg-transparent px-2 py-1"
              value={language}
              onChange={(event) =>
                onLanguageChange(event.target.value as "fr" | "en")
              }
              data-testid="language-select"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </label>
        </div>
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
