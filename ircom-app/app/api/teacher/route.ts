import { NextResponse } from "next/server";
import { generateTeacherResponse } from "@/lib/gemini/client";
import { teacherRequestSchema } from "@/lib/teacher/types";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = (await request.json()) as unknown;
    const parsedPayload = teacherRequestSchema.parse(payload);
    const response = await generateTeacherResponse(parsedPayload);
    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const isValidationError = error.name === "ZodError";
      return NextResponse.json(
        {
          error: isValidationError ? "Invalid request payload." : error.message,
        },
        { status: isValidationError ? 400 : 500 },
      );
    }

    return NextResponse.json(
      {
        error: "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
