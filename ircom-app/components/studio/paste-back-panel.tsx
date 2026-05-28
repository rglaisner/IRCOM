"use client";

import { t } from "@/lib/copy/ui-messages";
import type { SupportedLanguage } from "@/lib/teacher/types";

export function PasteBackPanel({
  language,
  value,
  onChange,
}: Readonly<{
  language: SupportedLanguage;
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <div className="space-y-2">
      <label htmlFor="paste-back-input" className="ircom-heading text-sm font-medium">
        {t(language, "pasteBackTitle")}
      </label>
      <textarea
        id="paste-back-input"
        className="ircom-input min-h-28 w-full rounded-[var(--ircom-radius-md)] p-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          language === "fr"
            ? "Colle ici le texte ou décris le visuel produit dans Claude, Firefly, etc."
            : "Paste copy or describe visuals produced in Claude, Firefly, etc."
        }
        data-testid="paste-back-input"
      />
    </div>
  );
}
