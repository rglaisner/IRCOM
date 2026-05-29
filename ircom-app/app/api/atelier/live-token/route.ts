import { NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { z } from "zod";
import {
  buildLiveSystemInstruction,
  buildStartBriefingTurn,
} from "@/lib/atelier/live-instructions";
import { resolveBriefingSteps } from "@/lib/atelier/briefing-orchestrator";
import { getGeminiLiveModel } from "@/lib/gemini/models";
import { getAtelierScenario } from "@/lib/teacher/atelier-content";
import { getSprintScenario } from "@/lib/teacher/sprint-content";

const liveTokenRequestSchema = z.object({
  language: z.enum(["fr", "en"]),
  scenarioId: z.string().min(1).max(64),
  context: z.enum(["atelier", "sprint"]).optional(),
  briefingStepIndex: z.number().int().min(0).max(20).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 503 });
    }

    const payload = (await request.json()) as unknown;
    const parsed = liveTokenRequestSchema.parse(payload);
    const context = parsed.context ?? "atelier";
    const stepIndex = parsed.briefingStepIndex ?? 0;

    const scenario =
      context === "sprint"
        ? getSprintScenario(parsed.language, parsed.scenarioId)
        : getAtelierScenario(parsed.language, parsed.scenarioId);

    if (!scenario) {
      return NextResponse.json({ error: "Unknown scenario." }, { status: 404 });
    }

    const briefingSteps =
      context === "atelier" && "briefingSteps" in scenario
        ? resolveBriefingSteps(scenario)
        : [
            {
              type: "narrate" as const,
              id: "full-briefing",
              hint: scenario.narrationScript,
            },
          ];

    const systemInstruction = buildLiveSystemInstruction({
      language: parsed.language,
      scenario,
      briefingSteps,
      currentStepIndex: stepIndex,
      context,
    });

    const startTurn = buildStartBriefingTurn(
      parsed.language,
      briefingSteps[stepIndex],
    );

    const model = getGeminiLiveModel();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
      },
    });

    if (!token.name) {
      return NextResponse.json({ error: "Failed to mint live token." }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: {
          token: token.name,
          model,
          startTurn,
          briefingStepIndex: stepIndex,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    if (error instanceof Error) {
      console.error({
        msg: "live-token creation failed",
        error: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error({ msg: "live-token unexpected error", error });
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
