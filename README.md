# GoodSport (goodsport.team)

Run a youth rec team from your phone. Built first for **Tottenham Boys** (Vernon Hills Park District, Fall 2026 Pre-K/K soccer), designed to be reused for future teams and other sports.

## What's here

| Area | Path | Status |
|---|---|---|
| Master build prompt | `docs/MASTER-PROMPT.md` | Synthesized from three expert briefs |
| Expert recommendations | `docs/recommendations/` | Coaching, design/architecture, AI |
| Sport templates (soccer U6, soccer U8, T-ball) | `src/lib/sports/templates.ts` | Done |
| Equal-playing-time rotation engine | `src/lib/rotation/` | Done, unit-tested |
| Activity library + manual plan builder | `src/lib/data/activities.*` | Done (14 activities) |
| Coach views: This Week, Schedule, Roster, Practice (+ run mode), Game Day (live clock + subs), Messages, Setup Wizard, Settings | `src/app/team/[slug]/` | Done (JSON-backed) |
| Parent view (share code, no contacts) | `src/app/t/[code]/` | Done |
| AI: season setup parser, practice plan generator, message drafter | `src/lib/ai/`, `prompts/`, `src/app/api/ai/` | Done, off without an API key |
| Auth, database, saving from the wizard, ICS feed, email sending | — | Phase 2 |

## Run it

```bash
npm install
cp data/private/tottenham-fall-2026.contacts.example.json data/private/tottenham-fall-2026.contacts.json  # fill in real contacts
cp .env.example .env.local   # add ANTHROPIC_API_KEY to turn on AI features
npm run dev
```

Open http://localhost:3000. Coach view: `/team/tottenham-fall-2026`. Parent view: `/t/spurs26`.

```bash
npm test         # rotation engine tests
npm run typecheck
npm run lint
npm run build
```

## Deploy to Netlify

The repo includes `netlify.toml`, so Netlify builds it with the official Next.js runtime.

1. In Netlify: **Add new site → Import an existing project → GitHub → `alexandercloch-netizen/Soccer`**.
2. Branch to deploy: `claude/soccer-team-management-site-8kh6n9` (or `main` after merging). Build settings are read from `netlify.toml`.
3. Environment variables (Site configuration → Environment variables):
   - `PRIVATE_CONTACTS_JSON`: run `npm run private:env` locally and paste the output. Without it the deployed coach roster shows names but no phone numbers. Mark it as a secret.
   - `COACH_PASSCODE`: a passcode the coaches share. Locks the coach view and AI routes; parent pages stay open. Strongly recommended on a public domain.
   - `ANTHROPIC_API_KEY` (optional): turns on the AI features.
4. Deploy. Parent page: `https://<your-site>.netlify.app/t/spurs26`. Coach view: `/team/tottenham-fall-2026`.

Coaches sign in once at `/login`; the cookie lasts 120 days. Sign out from **More → Sign out**. Real per-coach accounts arrive in phase 2.

## Privacy

This repository is public. Kids' full names, birthdays, guardian phone numbers, emails, and medical notes belong in `data/private/`, which is gitignored. The committed seed uses first names and last initials only. Public parent pages are built from a separate projection that never includes contact data.

## Adding a sport or a season

1. Add a `SportTemplate` in `src/lib/sports/templates.ts` (format, positions, gear, vocabulary, rotation model, age bands).
2. Add activities tagged with that `sportId` to `src/lib/data/activities.json`.
3. Add `data/teams/<new-slug>.json` (or use the setup wizard to extract it from the club's email).

No component or prompt changes are needed; everything reads from the template.
