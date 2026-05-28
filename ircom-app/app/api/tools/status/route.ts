import { NextResponse } from "next/server";
import { getToolRegistry } from "@/lib/tools/registry";

export async function GET(): Promise<NextResponse> {
  const tools = getToolRegistry().map((tool) => ({
    id: tool.id,
    apiConfigured: tool.apiConfigured,
    externalUrl: tool.externalUrl,
  }));

  return NextResponse.json({ tools }, { status: 200 });
}
