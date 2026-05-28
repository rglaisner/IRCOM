import { buildAtelierNarrationPrompt, buildSprintNarrationPrompt } from "@/lib/atelier/pipeline";
import { streamPlainTextPrompt } from "@/lib/gemini/client";
import { atelierNarrateRequestSchema } from "@/lib/teacher/types";
import { z } from "zod";

const sprintNarrateSchema = atelierNarrateRequestSchema.extend({
  context: z.enum(["atelier", "sprint"]).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as unknown;
    const parsed = sprintNarrateSchema.parse(payload);
    const prompt =
      parsed.context === "sprint"
        ? buildSprintNarrationPrompt(parsed.language, parsed.scenarioId)
        : buildAtelierNarrationPrompt(parsed);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamPlainTextPrompt(prompt, parsed.language)) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Stream failed.";
          controller.enqueue(encoder.encode(JSON.stringify({ error: message })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return Response.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
