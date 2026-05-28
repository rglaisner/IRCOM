import { streamTeacherResponse } from "@/lib/gemini/client";
import { teacherRequestSchema } from "@/lib/teacher/types";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as unknown;
    const parsedPayload = teacherRequestSchema.parse(payload);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamTeacherResponse(parsedPayload)) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Stream failed.";
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
