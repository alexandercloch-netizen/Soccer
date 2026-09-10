import { z } from "zod";

/** Every AI-extracted field carries provenance so the review UI can show it. */
export const Confidence = z.enum(["high", "medium", "low"]);
export const Field = <T extends z.ZodTypeAny>(v: T) =>
  z.object({
    value: v.nullable(),
    confidence: Confidence,
    source: z.string().nullable().describe("Exact substring of the input this came from; null if inferred"),
    note: z.string().nullable(),
  });

export const WarningCode = z.enum([
  "POSSIBLE_DUPLICATE", "GUARDIAN_UNLINKED", "MISSING_CONTACT", "UNPARSEABLE_ROW", "DATE_AMBIGUOUS", "OUT_OF_AGE_BAND",
]);

export const SeasonSetupSchema = z.object({
  team: z.object({
    name: Field(z.string()),
    league: Field(z.string()),
    ageBand: Field(z.string()),
    sport: z.string(),
  }),
  players: z.array(z.object({
    tempId: z.string(),
    firstName: Field(z.string()),
    lastName: Field(z.string()),
    dob: Field(z.string()),
    grade: Field(z.string()),
    school: Field(z.string()),
    shirtSize: Field(z.string()),
    availabilityNotes: Field(z.string()),
    status: z.enum(["registered", "unregistered", "unclear"]),
    guardianTempIds: z.array(z.string()),
  })),
  guardians: z.array(z.object({
    tempId: z.string(),
    name: Field(z.string()),
    phone: Field(z.string()),
    email: Field(z.string()),
    relationship: Field(z.string()),
  })),
  events: z.array(z.object({
    kind: z.enum(["practice", "game", "pictureDay", "rainDate", "other"]),
    title: Field(z.string()),
    date: Field(z.string()),
    startTime: Field(z.string()),
    durationMin: Field(z.number()),
    location: Field(z.string()),
    recurrence: Field(z.string()),
  })),
  gear: z.array(z.object({ item: Field(z.string()), providedBy: z.enum(["family", "team", "league", "unknown"]) })),
  rules: z.array(Field(z.string())),
  warnings: z.array(z.object({ code: WarningCode, refs: z.array(z.string()), message: z.string() })),
});
export type SeasonSetup = z.infer<typeof SeasonSetupSchema>;

export const PracticePlanSchema = z.object({
  title: z.string(),
  totalMinutes: z.number(),
  blocks: z.array(z.object({
    activityId: z.string(),
    name: z.string(),
    minutes: z.number(),
    setup: z.string(),
    coachingPoints: z.array(z.string()),
    adaptations: z.object({ tooEasy: z.string(), tooChaotic: z.string() }),
  })),
  equipment: z.array(z.string()),
  warnings: z.array(z.string()),
});
export type PracticePlan = z.infer<typeof PracticePlanSchema>;

export const MessageDraftSchema = z.object({ subject: z.string(), body: z.string() });
export type MessageDraft = z.infer<typeof MessageDraftSchema>;

/**
 * Post-parse guardrail: any contact field whose `source` is not found verbatim in the
 * input is downgraded to low confidence and its value cleared. AI never invents contacts.
 */
export function enforceProvenance(setup: SeasonSetup, input: string): SeasonSetup {
  const norm = input.replace(/\s+/g, " ");
  const check = <T,>(f: { value: T | null; confidence: "high" | "medium" | "low"; source: string | null; note: string | null }) => {
    if (f.value == null) return f;
    if (!f.source || !norm.includes(f.source.replace(/\s+/g, " "))) {
      return { ...f, value: null, confidence: "low" as const, note: `${f.note ?? ""} [removed: source not found in input]`.trim() };
    }
    return f;
  };
  return {
    ...setup,
    guardians: setup.guardians.map((g) => ({ ...g, phone: check(g.phone), email: check(g.email) })),
    players: setup.players.map((p) => ({ ...p, dob: check(p.dob) })),
  };
}
