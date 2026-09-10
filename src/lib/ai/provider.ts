import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { SeasonSetupSchema, PracticePlanSchema, MessageDraftSchema, enforceProvenance, type SeasonSetup, type PracticePlan, type MessageDraft } from "./schemas";
import { filterActivities } from "@/lib/data/activities";
import { getTemplate, currentAgeBand } from "@/lib/sports/templates";

/**
 * AiProvider: every AI feature goes through this interface. When no
 * ANTHROPIC_API_KEY is configured the NullProvider is used and the UI hides
 * the AI buttons; every feature still has a manual path.
 */
export interface AiProvider {
  readonly enabled: boolean;
  parseSeasonSetup(input: { rosterText: string; welcomeEmailText: string; sportTemplateId: string; seasonYear: number }): Promise<SeasonSetup>;
  generatePracticePlan(input: { sportTemplateId: string; playerCount: number; coachCount: number; minutes: number; focus: string }): Promise<PracticePlan>;
  draftMessage(input: { teamName: string; sportTemplateId: string; coaches: string[]; tone: string; context: string }): Promise<MessageDraft>;
}

/** Load a versioned prompt file and fill {{slots}}. Front-matter is metadata only. */
export function loadPrompt(name: string, slots: Record<string, unknown>): { system: string; meta: Record<string, string> } {
  const file = path.join(process.cwd(), "prompts", `${name}.md`);
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta: Record<string, string> = {};
  const body = m ? m[2] : raw;
  if (m) for (const line of m[1].split("\n")) { const [k, ...v] = line.split(":"); if (k) meta[k.trim()] = v.join(":").trim(); }
  const system = body.replace(/\{\{([\w.]+)\}\}/g, (_, key: string) => {
    const val = key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), slots);
    return typeof val === "string" ? val : val == null ? "" : JSON.stringify(val);
  });
  return { system, meta };
}

class NullProvider implements AiProvider {
  readonly enabled = false;
  private off(): never { throw new Error("AI is not configured. Set ANTHROPIC_API_KEY to enable AI features."); }
  parseSeasonSetup(): Promise<SeasonSetup> { return this.off(); }
  generatePracticePlan(): Promise<PracticePlan> { return this.off(); }
  draftMessage(): Promise<MessageDraft> { return this.off(); }
}

class ClaudeProvider implements AiProvider {
  readonly enabled = true;
  private async parse<S extends z.ZodTypeAny>(opts: { system: string; user: string; schema: S; model: string }): Promise<z.infer<S>> {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const { zodOutputFormat } = await import("@anthropic-ai/sdk/helpers/zod");
    const client = new Anthropic();
    const attempt = async (extra?: string) => {
      const res = await client.messages.parse({
        model: opts.model,
        max_tokens: 16000,
        system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: extra ? `${opts.user}\n\nPrevious attempt failed validation: ${extra}. Fix and return again.` : opts.user }],
        output_config: { format: zodOutputFormat(opts.schema) },
      });
      if (res.stop_reason === "refusal") throw new Error("The model declined this request.");
      if (res.stop_reason === "max_tokens") throw new Error("Input too long for one pass; split the paste.");
      return res.parsed_output;
    };
    let out = await attempt();
    if (out == null) out = await attempt("empty or malformed output");
    if (out == null) throw new Error("Could not parse a structured result. Enter this section manually.");
    return opts.schema.parse(out);
  }

  async parseSeasonSetup(input: { rosterText: string; welcomeEmailText: string; sportTemplateId: string; seasonYear: number }) {
    const sport = getTemplate(input.sportTemplateId);
    const { system, meta } = loadPrompt("season-setup.v1", {
      sport: { name: sport.name, ageBands: sport.ageBands.map((b) => b.id).join(", ") },
      seasonYear: String(input.seasonYear), today: new Date().toISOString().slice(0, 10),
    });
    const user = `REGISTRATION EXPORT:\n${input.rosterText}\n\nWELCOME EMAIL:\n${input.welcomeEmailText}`;
    const parsed = await this.parse({ system, user, schema: SeasonSetupSchema, model: meta.model || "claude-opus-5" });
    return enforceProvenance(parsed, user);
  }

  async generatePracticePlan(input: { sportTemplateId: string; playerCount: number; coachCount: number; minutes: number; focus: string }) {
    const sport = getTemplate(input.sportTemplateId);
    const band = currentAgeBand(sport);
    const library = filterActivities({ sportId: sport.sportId, ageBandId: band.id, playerCount: input.playerCount });
    const { system, meta } = loadPrompt("practice-plan.v1", {
      sport: { name: sport.name, vocabulary: sport.vocabulary }, ageBand: band,
      minutes: String(input.minutes), playerCount: String(input.playerCount), coachCount: String(input.coachCount), focus: input.focus,
      activitiesJson: JSON.stringify(library),
    });
    const plan = await this.parse({ system, user: `Build the ${input.minutes}-minute ${sport.vocabulary.session} plan now.`, schema: PracticePlanSchema, model: meta.model || "claude-opus-5" });
    const ids = new Set([...library.map((a) => a.id), "arrival", "water", "closing"]);
    const bad = plan.blocks.filter((b) => !ids.has(b.activityId));
    if (bad.length) plan.warnings.push(`Unknown activities removed: ${bad.map((b) => b.name).join(", ")}`);
    plan.blocks = plan.blocks.filter((b) => ids.has(b.activityId));
    return plan;
  }

  async draftMessage(input: { teamName: string; sportTemplateId: string; coaches: string[]; tone: string; context: string }) {
    const sport = getTemplate(input.sportTemplateId);
    const { system, meta } = loadPrompt("message-draft.v1", {
      team: { name: input.teamName, coaches: input.coaches.join(" & ") }, sport: { name: sport.name }, tone: input.tone, context: input.context,
    });
    return this.parse({ system, user: "Draft the message.", schema: MessageDraftSchema, model: meta.model || "claude-sonnet-5" });
  }
}

let cached: AiProvider | undefined;
export function getAi(): AiProvider {
  if (!cached) cached = process.env.ANTHROPIC_API_KEY ? new ClaudeProvider() : new NullProvider();
  return cached;
}
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);
