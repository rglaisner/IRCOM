import type { SupportedLanguage } from "@/lib/teacher/types";
import { t } from "@/lib/copy/ui-messages";

export function toUserFacingError(
  language: SupportedLanguage,
  error: unknown,
): string {
  if (!(error instanceof Error)) {
    return t(language, "errorGeneric");
  }

  const message = error.message.toLowerCase();

  if (message.includes("failed to fetch") || message.includes("network")) {
    return t(language, "errorOffline");
  }

  if (message.includes("api key") || message.includes("gemini_api_key")) {
    return t(language, "errorApiKey");
  }

  if (message.includes("gemini request failed") || message.includes("quota")) {
    return t(language, "errorGeneric");
  }

  return t(language, "errorGeneric");
}
