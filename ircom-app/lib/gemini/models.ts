/** Central Gemini model routing — server and shared defaults. */

export const GEMINI_MODEL_DEFAULT = "gemini-3-flash-preview";
export const GEMINI_LIVE_MODEL_DEFAULT = "gemini-2.5-flash-native-audio-preview-12-2025";
export const GEMINI_TTS_MODEL_DEFAULT = "gemini-2.5-flash-preview-tts";
export const VOICE_ENGINE_DEFAULT = "live";

export type VoiceEngine = "live" | "browser";

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT;
}

export function getGeminiLiveModel(): string {
  return process.env.GEMINI_LIVE_MODEL ?? GEMINI_LIVE_MODEL_DEFAULT;
}

export function getGeminiTtsModel(): string {
  return process.env.GEMINI_TTS_MODEL ?? GEMINI_TTS_MODEL_DEFAULT;
}

export function getVoiceEngine(): VoiceEngine {
  const raw =
    process.env.NEXT_PUBLIC_VOICE_ENGINE ??
    process.env.VOICE_ENGINE ??
    VOICE_ENGINE_DEFAULT;
  return raw === "browser" ? "browser" : "live";
}
