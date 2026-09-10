# Test strategy

GoodSport is maintained by one developer and deploys straight from one branch to goodsport.team. The test strategy is built around that: **a push that would break the site must fail before Netlify publishes it**, and every feature must be provable without a human clicking through it.

## Principles

1. **The deploy branch is production.** Netlify runs the checks before the build (`netlify.toml`), so a failing test keeps the previous deploy live. CI runs the same suite on every push for a second record.
2. **Every acceptance item maps to a test.** Each work package in `docs/swarm/graph.json` lists acceptance items; the `tests` verifier fails a node whose items have no automated test. If it can't be tested, it isn't done.
3. **Authorization is tested as a matrix, not a happy path, at two layers.** Every write is exercised as visitor, family, coach of this team, coach of another team, and admin: once at the database with pgTAP against the RLS policies, once through the server action with a minted session. Four of those five must be refused at both layers. The role lattice exists once, in SQL (`has_team_role`); the TypeScript guard only calls it.
4. **Privacy is asserted, not assumed.** Every public and family projection is serialized and checked for phone patterns, `@`, dates of birth, medical text, and full child last names.
5. **Sport-agnostic means tested with two sports.** Rendering and logic tests run against `soccer-u6` and `tball`.
6. **Time is injected.** `GOODSPORT_NOW` sets "today" so "next event" logic is deterministic in tests and demos.
7. **Fast feedback first.** Unit tests run in under two seconds; everything slower is a separate script.

## Layers

| Layer | Tool | Lives in | Runs on | What it proves |
|---|---|---|---|---|
| Unit | Vitest | `src/**/*.test.ts` | every save, CI, Netlify | Pure logic: rotation, weekly repeat, rain-date activation, ICS, snack slots, auth helpers, formatting, projections |
| Schema / seed | Vitest + Zod | `src/lib/**/*.test.ts` | same | Every sport template and every seed file validates; activity library ids are unique and referenced |
| Repository contract | Vitest | `tests/contract/` | CI (Supabase local stack), local after `supabase start` | The same suite passes against the JSON repo and the Supabase repo: load, save event, save signup, compare-and-set, share-code rotation |
| Database policy | pgTAP via `supabase test db` | `supabase/tests/` | CI, local | Row-level security is enabled on every table; for each of the five actors, every table and every write is allowed or denied exactly as the permissions matrix says; `anon` is denied on private tables; `public_team` output is contact-free |
| Request-level | Vitest | `tests/request/` | CI, Netlify | Route handlers and server actions called directly with `Request` objects and a minted JWT for the local stack's secret (`withActor`): the authorization matrix end to end, zod rejection, rate limits, generic errors, redirect guard, locked gate |
| Privacy leak | Vitest | `tests/privacy/` | CI, Netlify | Serialized public/family DTOs and rendered public HTML contain no contact data; a type-level test that `PublicPlayer` has no `lastName` |
| End-to-end | Playwright (Chromium) | `tests/e2e/` | CI, local `npm run test:e2e` | Golden journeys per persona at phone width, see below |
| Accessibility | axe via Playwright | `tests/e2e/a11y.spec.ts` | CI | No serious or critical violations on the main screens in light and dark themes |
| Visual | Playwright screenshots | `tests/e2e/visual.spec.ts` | on demand | Five screens at 400px and 1280px against committed baselines with a small tolerance; refresh baselines deliberately |
| AI evals | Vitest, needs `ANTHROPIC_API_KEY` | `evals/` | on demand, before a prompt version bump | Season-setup parser precision on contacts is 100% across golden cases; no hallucinated source spans |

## Golden journeys (end-to-end)

Run at 400px width unless noted. Each is one spec file.

- **Parent:** opens the team link → sees next event with arrive time and a Directions button without scrolling → opens Snacks → claims an open game → sees "Yours" → releases it with undo.
- **Coach:** signs in → cancels Wednesday's practice → undo toast → cancels again and lets it stand → the parent page shows the Cancelled chip → activates a rain date for a cancelled game → Game Day: marks one player absent, starts, advances a period, refreshes, state survives.
- **Admin (1280px):** creates a T-ball team from the template → invites a coach → the invite link signs the coach in → the new team's parent page renders with inning vocabulary.
- **Sharing:** coach opens Share → copy link → the copied URL opens the parent page → rotate code → the old URL shows the expired message.
- **Security:** production build without a passcode returns 503 on coach routes and 200 on parent routes; login with a hostile `next` lands on `/`.

## Test data

- `tests/factories.ts` builds teams, players, households, events, and signups for any sport template with sensible defaults and deterministic ids.
- The committed seed (`data/teams/*.json`) is the fixture for read-only tests; write tests use a temp directory (fs repo) or truncate tables between tests on the local Supabase stack.
- pgTAP fixtures seed the same five actors (visitor, family, coach, otherCoach, admin) and set `request.jwt.claims` per test so policies are exercised as each role.
- Private contacts in tests are obviously fake (`555-01xx`, `example.com`) so a leak test that finds real-looking data is a real failure.

## Commands

```bash
npm test              # unit + schema + request + privacy (fast)
npm run test:contract # repository contract suite; needs `supabase start` for the Supabase half
supabase test db      # pgTAP policy tests against the local stack
npm run test:e2e      # builds, starts the app, runs Playwright journeys and axe
npm run test:ci       # what CI and Netlify run: typecheck, lint, unit, build
npm run eval          # AI golden cases; needs ANTHROPIC_API_KEY
```

In a sandbox with a preinstalled Chromium that doesn't match Playwright's pinned build, set `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium` (or wherever the binary is) before `npm run test:e2e`. CI installs the matching browser itself.

## Current baseline (what exists today)

| Layer | Files | Count |
|---|---|---|
| Unit | `src/lib/rotation/equalTime.test.ts`, `src/lib/auth.test.ts`, `tests/unit/templates.test.ts`, `tests/unit/format.test.ts` | 20 tests |
| Request | `tests/request/login.test.ts` (redirect guard, wrong passcode, locked gate) | 4 tests |
| Privacy | `tests/privacy/projections.test.ts` (seed files contact-free, public name) | 2 tests |
| End-to-end | `tests/e2e/parent.spec.ts`, `tests/e2e/coach.spec.ts` (sign-in, Game Day) | 5 journeys |
| Accessibility | `tests/e2e/a11y.spec.ts`, five screens × two themes × two widths | 20 checks |

The contract, database-policy, visual, and AI-eval layers are scaffolded by WP00 in the swarm graph. CI gains `supabase start` and `supabase test db` in WP00; Netlify keeps the Docker-free subset (typecheck, lint, unit, build).

## Coverage and gates

- Coverage threshold on `src/lib` and `src/actions`: 85% lines, and 100% of branches in any function that decides authorization.
- A test may not be skipped or focused on the deploy branch; the `tests` verifier and CI grep for `.skip(` and `.only(`.
- Flaky end-to-end tests are fixed or deleted within the node that introduced them, never retried into green.

## What the swarm builders must add per node

Every node's builder adds tests in the layer that matches its acceptance items and lists the test file next to each item in the builder report. The `tests` verifier checks that mapping before anything else.
