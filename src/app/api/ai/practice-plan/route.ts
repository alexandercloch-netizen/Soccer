import { NextResponse } from "next/server";
import { z } from "zod";
import { getAi } from "@/lib/ai/provider";

export const runtime = "nodejs";
const Body = z.object({ sportTemplateId: z.string(), playerCount: z.number().int().min(1).max(40), coachCount: z.number().int().min(1).max(6), minutes: z.number().int().min(20).max(120), focus: z.string().max(200) });

export async function POST(req: Request) {
  const ai = getAi();
  if (!ai.enabled) return NextResponse.json({ error: "AI not configured. Use the default plan." }, { status: 503 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    return NextResponse.json(await ai.generatePracticePlan(parsed.data));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI request failed" }, { status: 502 });
  }
}
