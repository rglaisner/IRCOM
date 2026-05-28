import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(8000),
});

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Claude API is not configured. Use the guided link in the tool router.",
        fallback: true,
      },
      { status: 503 },
    );
  }

  try {
    const payload = requestSchema.parse((await request.json()) as unknown);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: payload.prompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Claude request failed." },
        { status: response.status },
      );
    }

    const body = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    const text =
      body.content?.find((part) => part.type === "text")?.text ??
      "No text returned.";

    return NextResponse.json({ data: { text } }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
