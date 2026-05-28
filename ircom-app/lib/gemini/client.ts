import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { buildTeacherPrompt } from "@/lib/teacher/pipeline";
import {
  teacherResponseSchema,
  type TeacherRequestInput,
  type TeacherResponseOutput,
} from "@/lib/teacher/types";

const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

function extractJsonBlock(rawText: string): string {
  const trimmedText = rawText.trim();
  if (trimmedText.startsWith("{")) {
    return trimmedText;
  }

  const fencedMatch = trimmedText.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
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
    title: isFrench ? "Mode démonstration" : "Demo mode",
    feedback: isFrench
      ? "Le coach IA n'est pas connecté sur ce serveur. Tu peux continuer à structurer ton brief et coller tes livrables pour préparer l'atelier."
      : "The AI coach is not connected on this server. You can still structure your brief and paste deliverables to prepare for the workshop.",
    nextStep: isFrench
      ? "Demande à ton formateur d'activer la clé Gemini, ou utilise les liens outils ci-dessus."
      : "Ask your instructor to enable the Gemini key, or use the tool links above.",
    critiqueChecklist: isFrench
      ? [
          "Vérifier la clarté de l'objectif",
          "Supprimer les formulations génériques",
          "Renforcer l'angle stratégique",
        ]
      : [
          "Confirm objective clarity",
          "Remove generic phrasing",
          "Strengthen strategic angle",
        ],
    qualityScore: 40,
    recommendedTool: "gemini",
  };
}

function buildContents(input: TeacherRequestInput, prompt: string) {
  if (input.imageBase64 && input.imageMimeType) {
    return [
      {
        role: "user" as const,
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: input.imageMimeType,
              data: input.imageBase64.replace(/^data:[^;]+;base64,/, ""),
            },
          },
        ],
      },
    ];
  }

  return prompt;
}

export async function generateTeacherResponse(
  input: TeacherRequestInput,
): Promise<TeacherResponseOutput> {
  if (!process.env.GEMINI_API_KEY) {
    return getFallbackResponse(input);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = buildTeacherPrompt(input);
  const contents = buildContents(input, prompt);

  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents,
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

export async function* streamTeacherResponse(
  input: TeacherRequestInput,
): AsyncGenerator<string> {
  if (!process.env.GEMINI_API_KEY) {
    const fallback = getFallbackResponse(input);
    yield JSON.stringify(fallback);
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = buildTeacherPrompt(input);
  const contents = buildContents(input, prompt);

  const stream = await ai.models.generateContentStream({
    model: modelName,
    contents,
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}
