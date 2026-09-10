# Review: Access model and roles

*Read-only review by the identity/access reviewer. Designs the roles, identity mechanisms, link sharing, data model, enforcement, and migration.*

**Today:** `src/proxy.ts` gates `/team/*` and `/api/ai/*` on a cookie whose value is `sha256("goodsport:"+COACH_PASSCODE)`: a static bearer token that can't be revoked per device. `team/[slug]/layout.tsx` never checks which team a coach belongs to. `getPublicTeam` is a real contact-free DTO (keep that pattern).

## 1. Roles and permissions

| Capability | Admin (org) | Coach (team) | Parent (household) | Visitor (link) |
|---|---|---|---|---|
| Create seasons/teams, pick sport template, invite/remove coaches, rotate share codes | yes | own team: coaches + share code only | – | – |
| Roster edit, guardian contacts, DOB, medical/coach notes | yes (org teams) | own teams | own household only | – |
| Schedule/events, attendance, lineups, practice plans, messages, AI, wizard | yes | own teams | – | – |
| RSVP, snack claim/swap | yes | yes (on behalf) | own household | – |
| Announcements, schedule, snack rotation, venue | yes | yes | yes | yes |

**Roster by role:** visitor and parent see "Arthur L.", jersey, and snack family label; parent additionally sees their own players' full names and their own guardians' contacts with an edit button; coach/admin see everything, medical behind a "show" toggle. Admin is "coach on every team in the org" plus setup; no fourth level.

## 2. Identity mechanism

**Recommendation: Neon Postgres, a homegrown email-code/magic-link login for admins and coaches, and signed family links (no account) for parents. Email via Resend. Cost $0** at this scale. No SMS infrastructure.

Why not the alternatives: Netlify Identity is deprecated; Clerk/Supabase Auth add a third party holding guardians' emails, and Supabase pauses idle projects every offseason; Auth.js brings adapters and config not needed when there are no passwords and no OAuth. The homegrown surface is one `tokens` table, one `sessions` table, ~150 lines, reused by all three roles.

**Coach invite (under a minute on a phone):** admin types the coach's email → coach gets an email with a button (`/i/<token>`, single use, 7-day expiry) → server verifies the token hash, creates the user, membership, and session, sets an httpOnly cookie, redirects to the team. No form.

**Coach returning / new device:** `/login` → email → 6-digit code by email (the email also carries a link). The code matters on phones because mail apps open links in a different browser. 10-minute expiry, 5 attempts.

**Session:** cookie `gs_session` = random 256-bit id, httpOnly, SameSite=Lax, 180-day sliding expiry, row in `sessions` so "sign out everywhere" and admin revocation work. The cookie never encodes the role; role is looked up per request.

**Parent:** the **family link** (`/f/<token>`, one per household, long-lived, revocable) is the primary path: the coach copies it from the roster row and texts it. Tapping it sets a family cookie and lands on `/t/<code>`. A secondary **claim** flow (pick your player → masked email on file → 6-digit code) covers families the coach hasn't texted.

## 3. Link sharing

- **Team link** `/t/<shareCode>`: visitor only; rotate per season, keep a history so an old code shows "This link expired, ask your coach".
- **Family link** `/f/<token>`: leak blast radius is one family's RSVP/snack; coach taps "Reset link" on the roster row.
- **Attribution without accounts:** every write carries `householdId` plus `via: "family_link" | "claim" | "coach"`. The UI shows "the Lochs", never a contact.

## 4. Data model changes

```ts
export type Role = "admin" | "coach";              // parent is a household session, not a Membership
export interface User { id: string; email: string; name?: string; createdAt: string; lastLoginAt?: string }
export interface Membership { userId: string; role: Role; orgId: string; teamId?: string }
export interface Session { id: string; userId: string; createdAt: string; expiresAt: string; lastSeenAt: string; userAgent?: string; revokedAt?: string }
export interface Household { id: string; teamId: string; label: string; familyLinkTokenId?: string }
export interface Guardian { id: string; householdId: string; name: string; relationship?: string; phone?: string; email?: string; userId?: string }
export interface PlayerGuardian { playerId: string; guardianId: string }
export interface FamilySession { id: string; householdId: string; guardianId?: string; expiresAt: string; revokedAt?: string }
export type TokenKind = "coach_invite" | "login_code" | "family_link" | "family_claim";
export interface Token { id: string; kind: TokenKind; hash: string; email?: string; teamId?: string; householdId?: string; role?: Role; expiresAt: string; usedAt?: string; attempts: number; createdBy: string }
export interface Rsvp { eventId: string; playerId: string; status: "in" | "out" | "maybe"; householdId: string; via: "family_link" | "claim" | "coach"; updatedAt: string }
export interface SnackClaim { eventId: string; householdId: string; claimedAt: string; releasedAt?: string }
export interface AuditLog { id: string; at: string; actor: { userId?: string; householdId?: string; kind: Role | "parent" | "system" }; action: string; teamId?: string; target?: string; meta?: Record<string, unknown> }
```

## 5. Enforcement in App Router

- **Proxy (coarse only):** `/team/*`, `/admin/*`, `/api/ai/*` require a session cookie to exist. It never decides roles.
- **Server-only helpers:** `getSession()`, `requireRole(teamId, "coach" | "admin")` (admin of the org satisfies coach; throws `notFound()` rather than 403 to avoid team enumeration), `getFamilySession(teamId)`, `requireHousehold(teamId, householdId)`.
- **Where checks live:** `getCoachTeam(slug)` calls `requireRole` before loading private data; every route handler and server action calls it first with the teamId from params; the team layout calls it too. UI hides buttons for convenience only.
- **Projections:** keep three DTOs (public, family = public + own household, coach). Add a test that the serialized public DTO contains no `@` and no phone pattern.

## 6. Migration from COACH_PASSCODE (zero downtime)

1. Add the database and a script that imports `data/teams/*.json` plus the contacts overlay. Repo reads DB when `DATABASE_URL` is set, JSON otherwise.
2. Seed users/memberships for the two coaches and the org admin.
3. Ship `/login` with email code (new) and passcode (legacy shim treated as coach on all teams, logged as `legacy`).
4. Send both coaches invite links; once both have signed in, unset `COACH_PASSCODE`. Ship family links to households the same week.
5. At season end, rotate the share code and archive the team; the admin creates the next season.
