# Review: Identity platform, user profiles, and roles

*Produced by the review-and-update team from `docs/swarm/REVIEW-IDENTITY-PROMPT.md`. Part 1 (profiles and roles) is platform-neutral; Part 2 (platform comparison and security re-check) follows.*

---

# Part 1: Profiles, roles, onboarding

## 1. Data model

```ts
// id === auth user id (Supabase auth.users.id); works with any IdP that yields a stable subject.
export interface Profile {
  id: string;                     // public
  displayName: string;            // public  ("Coach Alex" derives from firstName)
  firstName: string; lastName?: string;   // public / coach-only
  email: string;                  // owner-only (mirror of auth email, for display)
  phone?: string;                 // owner-only; coach-only when the profile is a coach on that team
  avatarUrl?: string;             // public
  notifPrefs: { email: boolean; digestDay?: "sun" | "mon" };   // owner-only
  createdAt: string; lastSeenAt?: string;  // owner-only (admin sees lastSeenAt)
  deletedAt?: string;             // tombstone, see §5
}
export interface Organization { id: string; name: string; slug: string; contactEmail?: string; createdBy: string }
export interface OrgMembership { orgId: string; profileId: string; role: "org_admin"; createdAt: string; createdBy: string }
export interface Team {
  id: string; orgId: string; seasonId: string; slug: string; sportTemplateId: string; name: string;
  theme: TeamTheme; shareCode: string; archivedAt?: string;   // Team.coaches[] is dropped; derived from TeamMembership
}
export type TeamRole = "head_coach" | "assistant_coach" | "team_parent";
export interface TeamMembership {
  teamId: string; profileId: string; role: TeamRole;
  status: "active" | "removed"; createdAt: string; createdBy: string; removedAt?: string;
}                                 // names+roles public ("Coach Alex, Assistant Sam"); rest coach-only
export interface Household { id: string; teamId: string; label: string; familyLinkTokenId?: string }   // label public
export interface HouseholdMember {  // exists only when a parent has an account; households need none
  householdId: string; profileId: string; guardianId?: string;   // guardianId = the contact row they verified against
  claimedVia: "family_link" | "email_otp" | "coach"; claimedAt: string;
}
export type InviteKind = "org_admin" | TeamRole;
export interface Invite {
  id: string; kind: InviteKind; orgId: string; teamId?: string;
  email: string; tokenHash: string;         // raw token only in the email; 7-day expiry, single use
  expiresAt: string; createdBy: string; acceptedBy?: string; acceptedAt?: string; revokedAt?: string;
}
export interface Actor {          // stored on every audit row; never a contact
  kind: "user" | "household" | "legacy" | "system";
  profileId?: string; householdId?: string; teamId?: string;
  role?: "org_admin" | TeamRole | "parent";
  via: "session" | "family_link" | "email_otp" | "coach" | "cron";
  label: string;                  // snapshot: "Coach Alex" / "the Lochs"; survives deletion
}
```

Who can invite whom: `org_admin` → any kind; `head_coach` → `assistant_coach` and `team_parent` on own team (no admin needed); `assistant_coach` / `team_parent` → nobody. `Guardian` stays the contact record; `HouseholdMember` is the optional bridge to a `Profile`. Family sessions (no account) stay app-owned (`gs_family` cookie); auth sessions are used only for profiles.

## 2. Permissions matrix

| Capability | org_admin | head_coach | assistant_coach | team_parent | parent, no acct | parent + acct | visitor |
|---|---|---|---|---|---|---|---|
| Seasons/teams (create, template, archive, share code) | all in org | rotate share code, edit settings | – | – | – | – | – |
| Coaches (invite/remove, roles) | all | invite/remove assistant + team_parent | – | – | – | – | – |
| Roster + contacts | all | full, medical/notes behind toggle | full, medical/notes behind toggle | names + guardian contacts, no DOB/medical/notes | own household edit | own household edit | public names |
| Schedule | edit | edit | edit | edit | read | read | read |
| Attendance/lineups | yes | yes | yes | – | – | – | – |
| Messages (announcements) | send | send | send | send | read | read | read |
| AI (wizard, drafts) | yes | yes | yes | – | – | – | – |
| Snack/RSVP | assign any | assign any | assign any | assign any | own household | own household (any device) | – |
| Profile | edit own; view lastSeen; change roles via memberships | edit own | edit own | edit own | none | edit own | – |

`org_admin` implies every team role in the org. `team_parent` is the team-manager volunteer: logistics, no private health data, no AI.

## 3. Onboarding on a phone

**(a) First admin creates the org.** `/start` → "Run your team on GoodSport" · *Your email* → *Send me a code* → "Check your email" · 6-digit input, "Or tap the link in the email" → a user with no memberships sees "Name your organization" · *Organization*, *Your first name* → *Create* → `/admin` with "Next: create a season and team". Four taps, one code.

**(b) Admin invites a head coach.** `/admin/teams/<id>/coaches` → *Invite a coach* sheet: *Email*, *Role* (Head coach / Assistant) → *Send invite*. Row shows "Invited · Resend · Cancel". Email: "Alex invited you to coach **Tottenham** (Fall 2026). [Open my team] · This link works for 7 days and signs you in on this phone."

**(c) Head coach accepts.** The button is a magic link with `redirectTo=/i/<invite>`; the email also prints the 6-digit code for the different-browser case. Tap → session → `/i/<invite>` verifies hash + email match, creates Profile if missing and the membership → "Welcome to Tottenham" · *What should families call you?* (first name, prefilled), *Last name*, *Phone (optional, coaches only)* → *Done* → team home with two chips: *Invite an assistant* · *Share the team link*. Inviting an assistant reuses the same sheet at `More › Coaches`; no admin involvement.

**(d) Share the team link.** `More › Share team`: big link, *Copy*, *Text it*, QR, *Preview as a parent*. Copy: "Anyone with this link sees the schedule and first names only."

**(e) Parent claims.** Path 1: coach texts `/f/<token>` → cookie set → `/t/<code>` shows "Hi, Loch family" with a dismissible card "Get reminders on another phone? *Add my email*". Path 2 from `/t/<code>`: *This is my family* → pick player → "We'll send a code to a•••@gmail.com" → 6-digit code to the guardian email on file (server checks the verified email equals that guardian's) → creates Profile + HouseholdMember → same page, now recognised on every device. Families with no email: "Ask Coach Alex for your family link."

**(f) Coach who is also a parent.** One Profile; a TeamMembership on Tottenham and a HouseholdMember on Lions T-ball. `getFamilySession(teamId)` resolves the household from the signed-in profile *or* the family cookie, so the parent page never asks the coach for a second sign-in. The header shows one identity and one switcher; the role is a property of the team entry, not the account.

## 4. Team switcher and current team

- **URL is the source of truth**: `/team/<slug>` (coach) or `/t/<code>` (parent). No "current team" in the DB.
- Cookie `gs_last` = last team slug/code, refreshed by the layouts; used only for post-sign-in redirect and the `/` route.
- **1 team**: header exactly as today. **2+ teams**: the name gets a chevron and opens a bottom sheet "My teams", grouped by season, each row *Tottenham · Head coach*, *Lions T-ball · Parent (the Lochs)*, plus *All teams* → `/home`. Archived seasons collapse under "Past".
- **After sign-in**: `?next=` if it belongs to the user → `gs_last` if still a membership → sole team → `/home`. Invite acceptance always lands on the invited team.
- AppShell takes `viewer: { profile, memberships, households }` instead of `mode`; `mode` becomes derived.

## 5. Profile page (`/me`)

Fields: avatar, first/last name, display name preview ("Families see: Coach Alex"), email (change triggers re-verify), phone, notification prefs, *My teams* (role chips, *Leave team* for parents), *Devices: Sign out everywhere*, *Delete account*. Admins never edit another person's profile; they change roles on `/admin/.../coaches` and can see lastSeenAt. Sign out everywhere revokes all refresh tokens plus the user's family cookies. **Delete account**: refused if the sole `org_admin`; otherwise delete the auth user, tombstone the Profile (PII nulled, `deletedAt` set, id retained), set memberships `removed`, revoke open invites, delete HouseholdMember rows. Households, guardians, players, events and audit rows stay: audit uses `Actor.label` snapshots, so history reads "Coach Alex cancelled practice" after deletion.

## 6. Roster visibility by role

| Roster field | visitor | parent (own hh) | team_parent | assistant / head coach | org_admin |
|---|---|---|---|---|---|
| "Arthur L.", jersey, snack family label | yes | yes | yes | yes | yes |
| Own players' full names + own guardian contacts (editable) | – | yes | – | – | – |
| All full names, guardian names/phones/emails | – | – | yes | yes | yes |
| DOB, medical, coach notes | – | own DOB only | – | behind "show" toggle | behind toggle |
| Family link copy/reset, invite parents | – | – | – | yes | yes |
| Coach list with names/roles | names | names | names | + emails | + emails, lastSeen |

## 7. Graph changes (applied in `docs/swarm/graph.json`)

Profiles warrant a split: WP02 stays the foundation everyone depends on; a new **WP02b** takes the surface area (invites, switcher, profile page) so WP05 isn't blocked on UI. Edges: WP01 → WP02 → WP02b → WP08; WP02 → WP05. Details are in the graph nodes.

---

# Part 2: Platform comparison and security re-check

**Verification note.** Direct fetches to vendor sites were blocked from the sandbox; facts come from web-search snippets (September 2026), installed package docs, and plugin source. Verified: Supabase free projects pause after **7 days** of inactivity (policy tightened 2026-02); Pro is **$25/month** and never pauses; default auth SMTP is 2 emails/hour (dev only), custom SMTP is a config switch; OTP resend cooldown 60 s; phone OTP requires an SMS provider; `supabase start` is a Docker stack with Mailpit and `supabase test db` (pgTAP); Neon Free scales to zero at 5 min; Next 16 `proxy.ts` is Node-only.

## 1. Scored comparison

| Criterion | Supabase | Neon + Drizzle + homegrown + Resend |
|---|---|---|
| 1. Time to secure login (Next 16 + Netlify) | **5** – OTP, magic link, invites, refresh, revocation, JWKS all exist; `@supabase/ssr` pattern documented for `proxy.ts`; the Netlify plugin routes Node middleware into the server function | **2** – the "150 lines" estimate omits attempt counters, code hashing, resend cooldowns, session sliding, CSRF and email templates; one volunteer reviews all of it |
| 2. Parents without passwords | **5** – email OTP/magic link built in; anonymous sign-in lets a family link create a real `auth.uid()` so parents fall under the same RLS model | **3** – family links equally easy; email claim needs a second homegrown code flow |
| 3. Authorization model | **4** – RLS is a second, DB-enforced line; the two-half-models risk is closed by one SQL function | **3** – one model, but a single credential with full access on every request; no defense in depth |
| 4. Offseason / cost | **2** – Free pauses after 7 idle days; parent page 5xx in February unless pinged or Pro | **5** – scales to zero and wakes in ~1 s |
| 5. Ownership / exit | **4** – `pg_dump` works; RLS is plain SQL; `auth.users` exports emails; storage objects need copying | **5** – plain Postgres, no vendor tables |
| 6. Storage (crests, consented photos) | **5** – buckets with RLS keyed on the same memberships; signed URLs | **2** – Netlify Blobs has no per-user auth |
| 7. Email delivery | **4** – built-in SMTP unusable in production; custom SMTP via Resend is a switch | **4** – Resend API directly; you own templates and bounces |
| 8. Local dev and tests | **4** – Docker stack (~90 s in CI) with Mailpit and pgTAP for policy tests | **4** – one `postgres` container; auth emails need a console stub |

**Recommendation: Supabase.** Deciding factors in priority order: criterion 1, criterion 2, and criterion 8. The only criterion Supabase loses badly is offseason behaviour, which is a $25/month or a 10-line cron decision, not an architecture decision.

## 2. Integration design (Next 16 + Netlify)

**Clients.** Two, in two server-only modules:
- `src/lib/supabase/server.ts`: `createServerClient(url, publishableKey, { cookies: { getAll, setAll }, cookieOptions: { httpOnly: true, secure: prod, sameSite: "lax" } })`. Used by server components, route handlers, server actions and `proxy.ts`. Every query runs as the signed-in user under RLS. `httpOnly` is safe because there is no browser Supabase client anywhere in the app.
- `src/lib/supabase/admin.ts` (`import "server-only"`, secret key): used only by the seed import, `inviteCoach`, `deleteAccount`, sign-out-everywhere and the keep-alive route. An ESLint `no-restricted-imports` rule allows it in those files only; a test greps client chunks for the secret key prefix.

**Cookies/session.** `proxy.ts` (Node runtime; matcher `/team/*`, `/admin/*`, `/api/ai/*`, `/me/*`) creates the server client, calls `auth.getClaims()` (JWKS verified locally, cached), redirects to `/login?next=` when absent, and returns the response with refreshed cookies plus `Cache-Control: private, no-store`. Server components read cookies only. Access-token lifetime 15 minutes so revocation is bounded. The legacy `gs_coach` shim stays until both coaches have signed in.

**`requireRole(teamId, minRole)`.** One definition of the role lattice, in SQL:

```sql
create function has_team_role(team uuid, min_role text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m join teams t on t.id = m.team_id
    where m.user_id = auth.uid() and (m.team_id = team or (m.org_id = t.org_id and m.role = 'org_admin'))
    and role_rank(m.role) >= role_rank(min_role)) $$;
```

Every RLS policy calls it. The TypeScript helper is a routing guard, not a second model: it calls the same function via `rpc` and throws `notFound()` on false. Called in `getCoachTeam`, the team layout, every server action and every AI handler; RLS still refuses if a caller forgets it.

**Public projection.** Private data lives in separate tables (`guardians`, `player_private`: DOB, medical, coach notes; `households.family_link_hash`) with grants revoked from `anon` and `authenticated` and RLS on. `/t/<code>` uses the server client with no session and calls `rpc("public_team", {code})`, a `security definer` function returning an allowlisted JSON built in SQL. `getPublicTeam` re-picks fields in TypeScript and the privacy test serializes the result. Three layers must all fail for a contact to leak.

**Seed import.** `npm run db:import` uses the admin client: upserts org → season → team → players → households → guardians from `data/teams/*.json` plus the private overlay, idempotent on stable ids, generates a random share code, prints it once. `data/teams` remains the fixture for the fs repo in unit tests.

## 3. Parent identity

- **Primary: coach-texted family link** `/f/<token>`. The route verifies the hash, calls `auth.signInAnonymously()`, then `rpc("claim_family_link", {token})` inserts a household membership. The parent now has an `auth.uid()`; RSVP and snack writes are ordinary RLS-protected inserts.
- **Secondary: email OTP** from `/t/<code>` → pick player → masked email on file → `signInWithOtp` (6-digit code and link in one template). If the browser already holds an anonymous family session, `updateUser({email})` upgrades it in place, so memberships persist and one person can be parent here and head coach elsewhere under one profile.
- **Phone-only families** get the family link only. That covers the case fully, so **no SMS provider**. Do not enable phone auth.

## 4. Offseason and cost

Free pauses after 7 idle days. Options: (a) **Free + keep-alive**: a GitHub Actions cron hits `/api/keepalive?token=…` every 3 days; cost $0. (b) **Pro at $25/month**: no tricks, also needed before photo storage grows. Recommend (a) now, (b) the month a second org or photos arrive.

## 5. Local dev and CI

- `supabase init`; migrations in `supabase/migrations/*.sql` (schema, RLS, functions); `supabase/seed.sql` for roles; `npm run db:import` for team data. `supabase start` runs the Docker stack; Mailpit shows OTP emails.
- **Contract suite**: `describeRepoContract("supabase", …)` against the local stack, tables truncated per test.
- **Five-role matrix**, two layers with one fixture: (1) `supabase/tests/rls_*.sql` (pgTAP): for visitor/family/coach/otherCoach/admin, set the JWT claims and assert per table and per write; plus one test asserting RLS is enabled on every public table. (2) `tests/request/authz.ts` `withActor` mints a JWT with the local stack's secret and injects a client, so server actions are exercised end-to-end.
- CI: `supabase/setup-cli` → `supabase start` → `supabase test db` → `npm run test:contract` → existing checks. Netlify build stays `npm ci && typecheck && lint && npm test && build` (no Docker on Netlify).

## 6. Security re-check

| Risk | Control |
|---|---|
| Session cookies on Netlify; CDN caching of PII | Refresh in `proxy.ts`; server components read-only; `private, no-store` on `/team/*`, `/admin/*`, `/api/*`; `httpOnly`; 15-min access tokens |
| Secret key exposure | Never `NEXT_PUBLIC_`; Netlify scope Functions only; single admin module with lint rule and bundle grep; rotate on coach turnover |
| A table without RLS is public through the publishable key | pgTAP test that every table has RLS and that `anon` is denied on private tables; `supabase db lint` in CI |
| Two half-implemented authz models | Role lattice exists once (`has_team_role`); TS helper only calls it; matrix tests at both layers |
| OTP abuse | Custom SMTP; resend cooldown and email caps; app rate limit per IP on `/login` and `/f/*`; anonymous sign-in has its own per-IP limit |
| PII split | Email in `auth.users` only; `profiles` holds name, optional phone, avatar, prefs; non-account parents' contacts stay in `guardians`; claim sets `guardians.user_id`, never copies |
| Revocation | Membership removal is instant (looked up per request); sign-out-everywhere via admin API; family link reset deletes the household membership and anonymous user |
| Public projection through Supabase clients | No session on `/t/*`; `public_team` RPC is the only anon-callable read; TS allowlist; privacy test |
| Account deletion | Admin delete cascades `profiles` and `memberships`; audit rows keep a display-name snapshot |

## 7. Accounts and environment variables

**Accounts:** Supabase project (US East); Resend with `goodsport.team` verified (API key plus SMTP credentials pasted into Supabase Auth → SMTP); GitHub Actions secrets; Netlify env.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | build + functions | project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | build + functions | RLS client |
| `SUPABASE_SECRET_KEY` | **functions only** | admin module |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` | GitHub only | `supabase db push` on deploy |
| `RESEND_API_KEY` | functions | app mail (announcements) |
| `KEEPALIVE_TOKEN` | functions + GitHub | offseason ping |
| `ANTHROPIC_API_KEY`, `GOODSPORT_NOW` | unchanged | |
| `COACH_PASSCODE`, `PRIVATE_CONTACTS_JSON` | delete after migration | |
