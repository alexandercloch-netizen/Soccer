import { NextResponse } from "next/server";
import { z } from "zod";
import { getAi } from "@/lib/ai/provider";

export const runtime = "nodejs";
const Body = z.object({ teamName: z.string(), sportTemplateId: z.string(), coaches: z.array(z.string()), tone: z.enum(["warm", "brief", "urgent", "celebratory"]), context: z.string().max(5000) });

export async function POST(req: Request) {
  const ai = getAi();
  if (!ai.enabled) return NextResponse.json({ error: "AI not configured. Write the message by hand." }, { status: 503 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    return NextResponse.json(await ai.draftMessage(parsed.data));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI request failed" }, { status: 502 });
  }
}
