import { NextResponse } from "next/server";
import { z } from "zod";
import { getAi } from "@/lib/ai/provider";

export const runtime = "nodejs";
const Body = z.object({ rosterText: z.string().max(200_000), welcomeEmailText: z.string().max(50_000), sportTemplateId: z.string(), seasonYear: z.number().int() });

/** AI proposes; nothing is written here. The wizard's review table decides what is saved. */
export async function POST(req: Request) {
  const ai = getAi();
  if (!ai.enabled) return NextResponse.json({ error: "AI not configured. Use the manual importer." }, { status: 503 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    return NextResponse.json(await ai.parseSeasonSetup(parsed.data));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI request failed" }, { status: 502 });
  }
}
