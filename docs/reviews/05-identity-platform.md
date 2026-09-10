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
