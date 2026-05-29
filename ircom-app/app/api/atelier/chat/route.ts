import {
  buildAtelierChatPrompt,
  buildSprintChatPrompt,
} from "@/lib/atelier/pipeline";
import { generatePlainTextPrompt } from "@/lib/gemini/client";
import { atelierChatRequestSchema } from "@/lib/teacher/types";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as unknown;
    const parsed = atelierChatRequestSchema.parse(payload);
    const context = parsed.context ?? "atelier";
    const prompt =
      context === "sprint"
        ? buildSprintChatPrompt(parsed)
        : buildAtelierChatPrompt(parsed);
    const answer = await generatePlainTextPrompt(prompt, parsed.language);

    return Response.json({ data: { answer } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
