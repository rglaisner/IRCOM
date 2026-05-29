/** Central Gemini model routing — server and shared defaults. */

export const GEMINI_MODEL_DEFAULT = "gemini-3-flash-preview";
/** Sole product audio engine — briefing and raise-hand use Live WebSocket. */
export const GEMINI_LIVE_MODEL_DEFAULT = "gemini-2.5-flash-native-audio-preview-12-2025";
/** @deprecated Not used in product flow; briefing audio is Live-only, text fallback is narrate API. */
export const GEMINI_TTS_MODEL_DEFAULT = "gemini-2.5-flash-preview-tts";
export const VOICE_ENGINE_DEFAULT = "live";

export type VoiceEngine = "live" | "browser";

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT;
}

export function getGeminiLiveModel(): string {
  return process.env.GEMINI_LIVE_MODEL ?? GEMINI_LIVE_MODEL_DEFAULT;
}

/** @deprecated Use getGeminiLiveModel for audio; narrate API for text fallback. */
export function getGeminiTtsModel(): string {
  return process.env.GEMINI_TTS_MODEL ?? GEMINI_TTS_MODEL_DEFAULT;
}

/** `browser` maps to text-only fallback (no speechSynthesis). */
export function getVoiceEngine(): VoiceEngine {
  const raw =
    process.env.NEXT_PUBLIC_VOICE_ENGINE ??
    process.env.VOICE_ENGINE ??
    VOICE_ENGINE_DEFAULT;
  return raw === "browser" ? "browser" : "live";
}

export function prefersLiveAudio(): boolean {
  return getVoiceEngine() === "live";
}
