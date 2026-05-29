/** @deprecated Briefing audio uses Gemini Live only; text fallback uses /api/atelier/narrate. */
import { NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { z } from "zod";
import { getGeminiTtsModel } from "@/lib/gemini/models";

const speakRequestSchema = z.object({
  language: z.enum(["fr", "en"]),
  text: z.string().trim().min(1).max(8000),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 503 });
    }

    const payload = (await request.json()) as unknown;
    const parsed = speakRequestSchema.parse(payload);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: getGeminiTtsModel(),
      contents: parsed.text,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: parsed.language === "fr" ? "Aoede" : "Kore",
            },
          },
        },
      },
    });

    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const audioPart = parts.find((part) => part.inlineData?.mimeType?.startsWith("audio/"));

    if (!audioPart?.inlineData?.data) {
      return NextResponse.json({ error: "TTS returned no audio." }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: {
          audioBase64: audioPart.inlineData.data,
          mimeType: audioPart.inlineData.mimeType ?? "audio/wav",
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
