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
  const feedbackByMode =
    input.mode === "sprint"
      ? isFrench
        ? "Le facilitateur sprint n'est pas connecté. Utilisez le briefing vocal et préparez votre kit pour la restitution."
        : "The sprint facilitator is offline. Use the voice briefing and prepare your kit for review."
      : isFrench
        ? "Le coach atelier n'est pas connecté. Continuez le scénario avec les outils recommandés, puis soumettez votre livrable."
        : "The workshop coach is offline. Continue the scenario with recommended tools, then submit your deliverable.";
  return {
    title: isFrench ? "Mode démonstration" : "Demo mode",
    feedback: feedbackByMode,
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

function getDemoNarration(language: "fr" | "en"): string {
  return language === "fr"
    ? "Mode démonstration : le facilitateur vocal n'est pas connecté. Lisez le scénario à gauche, puis utilisez le chat ou le panneau livrable pour continuer."
    : "Demo mode: voice facilitator is offline. Read the scenario on the left, then use chat or the deliverable panel to continue.";
}

export async function* streamPlainTextPrompt(
  prompt: string,
  language: "fr" | "en",
): AsyncGenerator<string> {
  if (!process.env.GEMINI_API_KEY) {
    yield getDemoNarration(language);
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stream = await ai.models.generateContentStream({
    model: modelName,
    contents: prompt,
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

export async function generatePlainTextPrompt(
  prompt: string,
  language: "fr" | "en",
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return getDemoNarration(language);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const result = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  const rawText = result.text?.trim();
  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  return rawText;
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
