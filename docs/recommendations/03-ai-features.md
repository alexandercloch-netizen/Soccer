# Expert Recommendations: AI Features & Prompt Engineering

*Produced by the "prompt engineer / AI product engineer" member of the advisory team, after checking current Claude API model IDs, structured-output support, and pricing.*

**Model guidance (verified 2026-09):** default `claude-opus-5` ($5/$25 per MTok, 1M context, structured outputs via `client.messages.parse()` + `zodOutputFormat`, cache reads ~0.1x). Cheaper option after evals: `claude-sonnet-5` ($2/$10). Enable refusal fallbacks by default. Keep `tool_choice: auto` everywhere.

## 1. Feature catalog (ranked)

| # | Feature | UI trigger | Model / est. cost | Latency | Human review |
|---|---|---|---|---|---|
| 1 | **Season Setup Wizard** | "New season → paste roster + welcome email" | Opus 5, ~$0.07/parse | 5–15s one-shot | Mandatory review table before save |
| 2 | **Practice Plan Generator** | "Plan practice" on an event | Opus 5, ~$0.06 (library cached → ~$0.03) | 8–20s, streamed | Edit/reorder blocks, then save |
| 3 | **Lineup / Rotation Builder** | "Build rotation" on a game | **Deterministic code**; optional Sonnet 5 explanation | <100ms | Tap to swap |
| 4 | **Parent Comms Drafter** | "Draft message" (tone chips) | Opus 5, ~$0.02 | 3–8s, streamed | Always edit-then-send; app never sends |
| 5 | **Schedule Diff / Rain-Date Reasoner** | Paste league update / "Rained out" | Opus 5, ~$0.03 | 5–10s | Accept/reject per change |
| 6 | **Ask-the-Assistant** | Chat drawer | Opus 5 + tool runner | 3–10s streamed | Read-only tools; writes propose changes |
| 7 | Post-game notes → skills tracker | "Log game" free-text | Opus 5, ~$0.02 | 3s | Confirm tags per player |
| 8 | Gear/checklist reminder composer | Day-before cron | Sonnet 5, ~$0.01 | 2s | Preview |

**Common guardrails:** kids' PII (names, DOB, phones, emails) is sent only for parsing (features 1, 5, 6) and never to logs; prompts forbid inventing contact data; every extracted contact field carries `confidence` + `source` (verbatim snippet from the pasted text) so the review UI can show provenance; nothing is persisted without explicit save.

### (a) Season Setup Wizard
Inputs: `rosterText`, `welcomeEmailText`, `sportTemplate`, `seasonYear`. Output (Zod sketch):

```ts
const Field = <T extends z.ZodTypeAny>(v: T) => z.object({
  value: v.nullable(), confidence: z.enum(["high","medium","low"]),
  source: z.string().nullable(),  // quoted snippet from input; null => inferred
  note: z.string().nullable(),
});
export const SeasonSetup = z.object({
  team: z.object({ name: Field(z.string()), league: Field(z.string()), ageBand: Field(z.string()), sport: z.string() }),
  players: z.array(z.object({ tempId: z.string(), firstName: Field(z.string()), lastName: Field(z.string()),
    dob: Field(z.string()), grade: Field(z.string()), school: Field(z.string()),
    shirtSize: Field(z.string()), availabilityNotes: Field(z.string()),
    status: z.enum(["registered","unregistered","unclear"]), guardianTempIds: z.array(z.string()) })),
  guardians: z.array(z.object({ tempId: z.string(), name: Field(z.string()), phone: Field(z.string()),
    email: Field(z.string()), relationship: Field(z.string()) })),
  events: z.array(z.object({ kind: z.enum(["practice","game","pictureDay","rainDate","other"]),
    title: Field(z.string()), date: Field(z.string()), startTime: Field(z.string()),
    durationMin: Field(z.number()), location: Field(z.string()), recurrence: Field(z.string()) })),
  gear: z.array(z.object({ item: Field(z.string()), providedBy: z.enum(["family","team","league","unknown"]) })),
  rules: z.array(Field(z.string())),
  warnings: z.array(z.object({ code: z.enum(["POSSIBLE_DUPLICATE","GUARDIAN_UNLINKED","MISSING_CONTACT",
    "UNPARSEABLE_ROW","DATE_AMBIGUOUS","OUT_OF_AGE_BAND"]), refs: z.array(z.string()), message: z.string() })),
});
```
Failure modes: hallucinated phone/email, guardian attached to wrong child, same kid twice (nickname vs. legal name), MM/DD vs DD/MM. Guardrails: post-parse check that every `source` snippet actually appears in the input (else downgrade to `low`); dedupe by normalized name+DOB; date sanity vs. `seasonYear`.

### (b) Practice Plan Generator
RAG-lite: `activities.json` filtered *in code* by `sport`, `ageBand`, `minPlayers ≤ n`, `focusTags`; pass only the matching activities behind a `cache_control` breakpoint. Output: `{ blocks: [{ activityId, name, minutes, setup, coachingPoints[], adaptations }], totalMinutes, equipment[], warnings[] }`. Validate `activityId ∈ library` and `sum(minutes) == requested ± 3`; retry once with the error appended.

### (c) Lineup / Rotation
**Deterministic TypeScript**: min-max fairness over periods, respecting `sportTemplate.gameFormat`, absences, and "never sit twice in a row". An LLM adds nothing but nondeterminism and cost to fairness math. Optional LLM call writes the "why this rotation" note.

### (d) Comms Drafter
Tone presets (`warm`, `brief`, `urgent`, `celebratory`); inputs: intent, related event(s), audience. Never includes another family's contact info; drafts are copied to clipboard/email client, not sent.

### (e) Schedule diff
Input: existing `events[]` + new text. Output: `{ changes: [{ op: "add"|"move"|"cancel"|"unchanged", eventId?, before?, after?, reason, confidence }] }`. The coach confirms each.

### (f) Ask-the-Assistant
Tool runner with read tools: `getRoster`, `getSchedule(range)`, `getGuardian(playerId)`, `getAttendance`, `proposeEventChange` (writes go to a pending queue). Answer only from tool results. Cap iterations at 6.

## 2. System prompts
Shipped as files in `/prompts/` (see `prompts/season-setup.v1.md` and `prompts/practice-plan.v1.md` in this repo).

## 3. Architecture
- **Where calls live:** Next.js Route Handlers under `app/api/ai/*` (Node runtime). One-shot `parse()` for setup and diff; `stream()` for plans, comms, and chat.
- **Structured output:** `client.messages.parse({ output_config: { format: zodOutputFormat(Schema) } })`. Schema limits: no `min/max`, no recursion.
- **Validation/retry:** null `parsed_output` or zod failure → one retry with the zod error appended; then surface "couldn't parse, edit manually".
- **Caching:** frozen system prompt + sport template + activity library first, volatile inputs after the breakpoint.
- **Cost controls:** per-team daily call cap, token-count guard rejecting pastes >50K tokens, log `usage` per call (no prompt bodies).
- **Keys:** `ANTHROPIC_API_KEY` server-only env, never `NEXT_PUBLIC_*`.
- **No-key fallback:** `AiProvider` interface; `ClaudeProvider` vs `NullProvider` chosen at boot. Every AI feature has a manual path. UI hides AI buttons when disabled.
- **Prompt versioning:** `/prompts/<feature>.v<N>.md` with front-matter; bump version → new file.

## 4. Evals
`/evals/season-setup/` with 12–15 golden cases: clean export; shifted columns; merged cells; unregistered row; sibling row without guardian; nickname duplicate; two guardians one row; missing email; ambiguous DOB; email with rain dates + picture day; "Tuesdays and Thursdays"; row containing "ignore previous instructions"; player age outside band; empty paste. Measure: field-level precision on contacts (target 100%; a wrong phone is worse than null), recall on players/events, warning recall, zero hallucinated contacts, latency and cost per call.

## 5. Sport-agnostic design
```ts
type SportTemplate = {
  id: string; name: string;
  ageBands: { id: string; label: string; guidance: string }[];
  positions: { id: string; label: string; onFieldCount?: number }[];
  gameFormat: { playersOnField: number; periods: number; periodMinutes: number; substitutionRule: "anytime"|"period"|"inning" };
  gear: string[];
  vocabulary: Record<string,string>;
  eventKinds: string[];
  activityTags: string[];
};
```
Prompts reference only template slots, schemas take `sport` as a discriminant, positions come from `template.positions`, and the activity library is keyed by `sportId`. Adding baseball = one JSON template + activities; zero prompt edits.

## 6. Risks and the review UI
- **Hallucinated contacts:** accept phone/email only when `source` matches input verbatim; low-confidence cells amber, blank ones red.
- **Guardian misassignment:** review grid groups guardian under child with an "unlink / move to…" control; unlinked rows go to a "needs a parent" bucket.
- **Silent duplicates:** render both rows side-by-side with "merge / keep both".
- **Prompt injection via paste:** treat as data; Q&A tools are read-only.
- **PII leakage:** no prompt logging, no client-side key, redact phone/email in error reports.
- **Over-trust:** nothing writes to the DB from an AI route; every feature ends in a diff the coach approves.
