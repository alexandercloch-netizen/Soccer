# Review-and-update prompt: user profiles and Supabase

> Hand this to a review team before the swarm runs WP01. It re-opens two decisions in `docs/swarm/graph.json`: persistence (Neon + Drizzle) and identity (homegrown email-code sessions). The team reviews, decides, and **updates the plan files**, not just reports.

## Context the reviewers must read first

- `docs/swarm/graph.json` (`decisions`, WP01, WP02, WP05, WP08) and `docs/swarm/PROMPT.md`
- `docs/reviews/02-product-features.md` §2–3 and `docs/reviews/04-access-roles.md` (the current identity design)
- `docs/reviews/03-security.md` §3 (requirements before parents can write)
- `src/lib/auth.ts`, `src/proxy.ts`, `src/lib/data/repo.ts`, `src/lib/types.ts`, `netlify.toml`

## What changed in the requirements

1. **Many coaches across many teams, across seasons and sports.** The same person may be head coach of one team, assistant on another, and a parent on a third, in the same season. Next spring the roster of coaches is different. Identity must be a **person**, not a team credential.
2. **A user profile is a first-class object**: display name, email, phone (optional), avatar, notification preferences, the teams they belong to with a role on each, and a team switcher. Onboarding must take a volunteer under a minute on a phone.
3. **Supabase is the default hypothesis** for auth + Postgres + storage. The review either confirms it or gives a concrete reason it fails a criterion below.

## Questions to answer (with evidence, not preference)

### A. Platform: Supabase vs the current plan (Neon + Drizzle + homegrown sessions + Resend)

Score each on the criteria, then recommend one. Criteria, in priority order for a single volunteer maintainer:

1. **Time to a working, secure login** for coaches and admins on Next.js 16 App Router deployed to Netlify (`@supabase/ssr` cookie handling in server components, route handlers, and `proxy.ts`).
2. **Parent experience without passwords**: email OTP / magic link for parents who have email on file; the fallback for phone-only families (Supabase phone OTP needs an SMS provider; coach-texted family links need none). Recommend the combination.
3. **Authorization model**: row-level security policies in Postgres vs application-level `requireRole`. Decide where the source of truth lives and how the app avoids two half-implemented models. Concretely: does the app use the service-role key server-side with app-level checks, the anon key with RLS, or both, and why.
4. **Offseason behavior and cost**: Supabase free projects pause after inactivity; Pro is $25/month. Neon free scales to zero without pausing. Say which plan the site needs and what the parents see in February.
5. **Data ownership and exit**: it's Postgres either way; note the migration cost in each direction.
6. **Storage**: team crests and (later, consented) photos. Supabase Storage vs Netlify Blobs vs none.
7. **Email delivery**: Supabase Auth's built-in email (rate limits, deliverability) vs custom SMTP via Resend.
8. **Local development and tests**: Supabase CLI local stack (Docker) vs a plain Postgres; how the repository contract suite and the request-level authorization matrix run in CI.

### B. Profiles and roles

Design the user profile and membership model for many coaches across many teams:

- `profiles` (one per auth user): display name, first name for kids' pages ("Coach Alex"), phone, avatar, notification prefs, created/last seen.
- `memberships`: user × team × role, with roles **org_admin**, **head_coach**, **assistant_coach**, **team_parent**(volunteer), and how a household session (parent) relates to a profile when the parent also has an account.
- Org level: who can create seasons and teams, who can invite whom. Can a head coach invite an assistant without the admin?
- Onboarding flows on a phone, step by step: admin creates org → invites head coach → head coach completes profile (name, phone optional) → invites assistant → shares team link → parents claim via family link or email OTP.
- Team switcher: what the header shows for a user with three teams; what "current team" persists in.
- Profile page: what a user can edit, what only an admin can (role changes), sign out everywhere, delete account (what happens to their memberships and audit rows).
- Roster visibility by role, updated from `docs/reviews/04-access-roles.md` §1 for the new roles.

### C. Security re-check for the chosen platform

Re-run `docs/reviews/03-security.md` §3 against the recommendation: session cookie handling on Netlify, service-role key exposure risk, RLS policy tests, rate limits on OTP, PII in `auth.users` vs `profiles`, and how the public projection stays contact-free when data is read through Supabase clients.

## Updates the team must make (deliverable is the diff, not the memo)

1. `docs/swarm/graph.json`: rewrite `decisions.persistence` and `decisions.identity`; rewrite WP01 (foundation), WP02 (identity: profiles, memberships, invites, switcher), WP05 (parents: household sessions and their link to profiles), WP08 (admin: org, seasons, teams, coach management); add or split nodes if profiles warrant their own; keep every node's `owns`, `exports`, `acceptance` concrete; keep the graph acyclic and re-run the topological order and critical path.
2. `docs/swarm/PROMPT.md`: update the decisions block, the work-package table, the Mermaid graph, and the "How to run it" prerequisites.
3. `docs/reviews/05-identity-platform.md` (new): the scored comparison, the profile/role design, the onboarding flows, the RLS-vs-app decision, and the security re-check.
4. `docs/TESTING.md`: how the authorization matrix and contract suite run against the chosen platform locally and in CI.
5. `.env.example` and the user's task list in `README.md`: the accounts and keys the owner must create.

## Rules

- Read the code; do not restate the old reviews.
- Prefer the simpler system when two options are close. Every extra moving part needs a sentence justifying it.
- No passwords for anyone. No SMS provider unless the review shows family links are insufficient.
- The public parent page stays open by share link; identity is for writing and for private data.
- Keep the app sport-agnostic and multi-tenant: org → season → team; a person can hold different roles on different teams.
