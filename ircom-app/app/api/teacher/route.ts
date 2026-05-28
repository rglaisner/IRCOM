import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTeacherResponse } from "@/lib/gemini/client";
import { teacherRequestSchema } from "@/lib/teacher/types";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = (await request.json()) as unknown;
    const parsedPayload = teacherRequestSchema.parse(payload);
    const response = await generateTeacherResponse(parsedPayload);
    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
