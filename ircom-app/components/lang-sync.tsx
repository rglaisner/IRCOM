"use client";

import { useEffect } from "react";
import type { SupportedLanguage } from "@/lib/teacher/types";

export function LangSync({ language }: Readonly<{ language: SupportedLanguage }>) {
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
