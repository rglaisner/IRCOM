import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { buildTeacherPrompt } from "@/lib/teacher/orchestrator";
import {
  teacherResponseSchema,
  type TeacherRequestInput,
  type TeacherResponseOutput,
} from "@/lib/teacher/types";

const modelName = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";

function extractJsonBlock(rawText: string): string {
  const trimmedText = rawText.trim();
  if (trimmedText.startsWith("{")) {
    return trimmedText;
  }

  const fencedMatch = trimmedText.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }

  const objectMatch = trimmedText.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  throw new Error("Model output did not include a JSON object.");
}

function getFallbackResponse(input: TeacherRequestInput): TeacherResponseOutput {
  const isFrench = input.language === "fr";
  return {
    title: isFrench ? "Mode degrade actif" : "Fallback mode active",
    feedback: isFrench
      ? "La cle API Gemini est absente. L'application fonctionne en mode local de demonstration."
      : "Gemini API key is missing. The app is running in local demo mode.",
    nextStep: isFrench
      ? "Ajoute GEMINI_API_KEY dans .env.local, puis relance l'application."
      : "Add GEMINI_API_KEY in .env.local, then restart the app.",
    critiqueChecklist: isFrench
      ? [
          "Verifier la clarte de l'objectif",
          "Supprimer les formulations generiques",
          "Renforcer l'angle strategique",
        ]
      : [
          "Confirm objective clarity",
          "Remove generic phrasing",
          "Strengthen strategic angle",
        ],
  };
}

export async function generateTeacherResponse(
  input: TeacherRequestInput,
): Promise<TeacherResponseOutput> {
  if (!process.env.GEMINI_API_KEY) {
    return getFallbackResponse(input);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = buildTeacherPrompt(input);

  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    const rawText = result.text;
    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsedJson = JSON.parse(extractJsonBlock(rawText)) as unknown;
    return teacherResponseSchema.parse(parsedJson);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid response schema: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Gemini request failed: ${error.message}`);
    }

    throw new Error("Gemini request failed with an unknown error.");
  }
}
