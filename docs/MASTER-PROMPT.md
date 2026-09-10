# Master Build Prompt: GoodSport (youth team management, sport-agnostic)

> This is the prompt to hand to an AI coding agent (or a human developer) to build the site. It was written by synthesizing three expert briefs: a youth coach, a product designer / front-end architect, and a prompt engineer. The briefs live in `docs/recommendations/`. Use this prompt verbatim when starting a new build phase; edit the "Current phase" line as you go.

---

## Role

You are a senior full-stack engineer with three advisors on call: a USSF-trained Pre-K/K rec soccer coach, a product designer who specializes in phone-first field-side UX, and a prompt engineer who builds structured-output features on the Claude API. Build **GoodSport**, a web app a volunteer parent-coach uses to run a youth rec team. The first team is "Tottenham Boys" (Vernon Hills Park District, Fall 2026, mixed Pre-K and Kindergarten boys, ~8 players, two parent coaches). The app must work unchanged for **future teams and other sports**: that is the non-negotiable design constraint.

## Non-negotiables

1. **Sport-agnostic core.** Organization → Season → Team. A `SportTemplate` (positions, game format, period unit, gear, age bands, vocabulary, rotation model) drives every sport-specific behavior. No `if (sport === "soccer")` in components. Ship `soccer-u6`, `soccer-u8`, and `tball` templates on day one to prove it.
2. **Phone-first for the field, desktop-friendly for setup.** Game Day, attendance, snacks, and This Week are designed for one hand on a sunny sideline: 48px+ tap targets, 7:1 contrast, undo instead of confirm dialogs.
3. **Kids' data is protected by default.** Public views show "Arthur L." only. Guardian contacts, DOB, and medical notes are coach-only and never in public payloads. Contact data is never invented by AI and never logged.
4. **Every AI feature ends in a review step.** AI proposes; the coach approves; the app writes. AI is optional: with no API key, every feature has a manual path.
5. **Equal playing time is math, not vibes.** The rotation engine is deterministic, unit-tested code.

## Stack

Next.js (App Router, TypeScript), Tailwind v4 with CSS-variable design tokens, Zod for all schemas, Anthropic SDK (`claude-opus-5` default, `claude-sonnet-5` for cheap calls) with structured outputs, deployable to Vercel. Data starts as versioned JSON seed files under `data/` behind a repository interface so it can move to Postgres/Prisma without touching UI. Auth (magic link for coaches, share code for parents) is phase 2.

## Domain model

Organization, Season, Sport, Team (colors, crest, shareCode), Player (first/last, jersey, grade, shirt size, photoConsent, notes), Guardian (name, phone, email, relationship), Household (sibling links), Membership (role: owner/coach/guardian), Event (practice | game | rainDate | pictureDay | other; start, end, location, status: scheduled/cancelled/tentative), Attendance, Lineup (period-by-period on/off with minutes ledger), PracticePlan (ordered activity blocks), Activity (library, tagged by sport + age band + skill), Announcement, SnackAssignment.

## Screens (build in this order)

1. **This Week** dashboard: next event hero card, "needs attention" chips, snack parent.
2. **Roster**: kid avatar, name, jersey, guardian tap-to-call (coach only).
3. **Schedule**: grouped by week, type icons, rain dates shown as tentative, ICS export later.
4. **Game Day**: clock + period, on-field vs bench lists, "Next sub" sticky button, minutes ledger.
5. **Practice**: plan list, timeline editor, "Run mode" timer, "Generate with AI".
6. **Communications**: composer with tone chips, history, copy-as-text.
7. **Season Setup wizard**: sport → paste roster + welcome email → review table → theme → done.
8. **Settings**: team identity/colors, sport template, sharing, coaches.

## Design system

Nunito (headings) + Inter (body), 16px minimum body on phone, 56px tabular-nums game clock. Tokens on `:root` with light and dark variants; team colors override only `--team-primary`, `--team-on-primary` (computed for WCAG contrast), `--team-accent`. Semantic colors never overridden. Lucide icons. Empty states are warm and direct, not childish.

## AI features (priority order)

1. Season Setup Wizard: parse pasted registration export + welcome email → players, guardians, events, gear, rules, warnings. Every field has `value`, `confidence`, `source` (verbatim snippet). Reject any contact whose `source` isn't in the input.
2. Practice Plan Generator: grounded in the activity library filtered in code by sport/age/headcount/focus. Validates activity IDs and total minutes.
3. Equal-time rotation: deterministic; optional AI "why this rotation" note.
4. Parent message drafter with tone presets; never sends, always copies.
5. Schedule diff / rain-date reasoner with accept/reject per change.
6. Ask-the-assistant with read-only tools.

System prompts live in `/prompts/*.vN.md`. Golden evals live in `/evals/`.

## Coaching rules baked into the product

No lines, no laps, no lectures; every kid has a ball; blocks ≤8 min for ages ≤6; no score kept at U6; nobody sits two periods in a row; allergies pinned to the game card; one message per event; a rain decision deadline on every weather-risk event; "Did every kid smile today?" at the end of practice.

## Definition of done per phase

- **v0 Shell**: tokens, theme injection, bottom nav, three seeded sport templates, all routes render on phone and desktop.
- **v1 Roster + Schedule**: Tottenham seed data, roster and schedule pages, attendance, snack rotation, public parent view.
- **v2 Game Day + Practice**: tested rotation engine, live Game Day, practice editor + run mode, activity library.
- **v3 AI**: setup wizard with review table, plan generator, comms drafter, no-key fallback, evals passing.

## Current phase

v0 + v1 scaffold with the v2 rotation engine and v3 wizard route stubbed behind the provider interface.
