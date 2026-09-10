# Review: Product features, persistence, roles

*Read-only review by the product reviewer. Headline: the read side is in good shape (public projection, template abstraction, phone nav). There is no write path anywhere, and every must-have except "send a link" is blocked on the same missing piece: a writable repository.*

## 1. Feature gaps

| Must-have | Today | Missing | MVP a coach calls "done" |
|---|---|---|---|
| **Simple for admin/coach/parent** | Parent view is genuinely simple (4 tabs, no login). Coach view is clean but read-only; Settings says "Edit in `data/teams/<slug>.json`", the wizard's Save step says "paste the JSON into the file". | Any in-app editing. | Every "edit the file" hint replaced with a form or removed. No coach should see a filename. |
| **Coaches send parents a link** | `/t/spurs26` exists; Settings shows the path only. | Absolute URL, copy button, QR, a "Share" tile on More, share-code rotation. | Settings + More show `https://goodsport.team/t/spurs26` with Copy and a QR. Cheapest item on the list. |
| **Per-game snack sign-up** | `TeamEvent.snackGuardianId`, coach-assigned in the seed; parent page says "Open" and "tell the coaches". | Parents cannot claim, release, or swap. No allergy guidance. | Parent taps "I'll bring snack" on an open game, picks their family, done. Same device can release; coach can clear/reassign any game. Team-level `snackGuidelines` shown on the snack page. **Needs persistence.** |
| **Coaches edit practice and game schedule** | `TeamEvent` model is adequate. Schedule page is a list. | Add / edit / cancel / delete. Weekly repeat for practices. | "Add event" button, tap a row to edit (kind from `template.eventKinds`, title, date, times, location, opponent, home/away, status, notes), Cancel sets `status: cancelled` with undo toast. "Repeat weekly until <date>" for practices. **Needs persistence.** |
| **Reusable for teams/sports** | Templates and `data/teams/*.json` do this; `team/new` wizard cannot save. | Wizard save. | Stretch; fine to defer. |

**Data-model changes:**
- `TeamEvent`: add `updatedAt`, `updatedBy`, `cancelReason?`.
- New generic `Signup { id; teamId; eventId?; role: "snack" | "volunteer" | string; label; claimedByHouseholdId?; claimedByLabel?; claimedAt?; source: "parent" | "coach" }`. Snack is `role: "snack"`, one slot per game. Makes team-parent / party sign-ups free later and stays sport-agnostic.
- `Team`: add `snackGuidelines?`, `notice?: { text; until? }`.
- `TeamData`: add `signups`, `version` for optimistic concurrency.

## 2. Persistence options

| Option | Setup | Cost | Fit | Verdict |
|---|---|---|---|---|
| Git-as-DB (GitHub API commits) | Small | Free | Every write triggers a rebuild; races; parent claims land in a public repo's history; a leaked coach cookie becomes a repo write token. | Reject. |
| Netlify Blobs | ~1 hour | Included | Auto-configured on Netlify, JSON docs map 1:1 to `TeamData`, etag-conditional writes. No queries. | Good for a fast first write path. |
| Netlify DB (Neon Postgres) + Drizzle | Half a day | Free tier | Right answer once there are auth users, multiple teams, or queries. | Recommended once identity is in scope. |
| Supabase | Half a day | Free, but idle projects pause (offseason problem) | Brings auth/storage not needed yet. | Not now. |
| Turso/libSQL | Hours | Free | Extra vendor for no advantage at this scale. | Not now. |

Whichever backend: a `TeamRepo` interface (`listTeamSlugs`, `loadTeam`, `loadTeamByShareCode`, `saveTeam` with `ifMatch`) with the JSON file implementation kept for dev, tests, and seeding. Writes are server actions ending in `revalidatePath` for both the coach and parent routes, or parents see stale snacks.

## 3. Roles, flows, identity (product view)

- **Admin** = the `owner` in `team.coaches`. Creates team/season, rotates share code, manages coaches.
- **Coach**: edit schedule, assign/clear snacks, roster notes, Game Day, messages.
- **Parent**: read everything on `/t/<code>`, claim/release own snack slot; later RSVP.

Where the current `COACH_PASSCODE` falls short: one passcode unlocks every `/team/*` on the site, so next spring's T-ball team shares credentials with Tottenham; the cookie is a deterministic SHA-256 of the passcode, so a leaked cookie is valid for 120 days with no revocation; `/api/login` has no rate limit; no identity, so "who cancelled practice?" is unanswerable.

## 4. Week-1 asks, ranked

1. **ICS feed** (`/t/[code]/calendar.ics` + per-event "Add to calendar"): cheap, read-only, highest value per hour.
2. **Cancellation / notice banner**: `team.notice` shown on both home pages. A coach typing "Field closed, see you Wednesday" is the product.
3. **RSVP**: medium; reuses the family mechanism from snacks and feeds Game Day attendance. Next PR.
4. **Volunteer sign-ups**: free if snack is a generic `Signup`.
5. **Reminders**: needs email/SMS plus scheduled functions. Defer; ICS covers most of it.
6. **Photo sharing**: expensive; every player has `photoConsent: false`. Link out via `team.photoAlbumUrl`.
7. **Carpool**: low demand at Pre-K. Skip.

## 5. Non-goals for this PR

Sending SMS; RSVP; weather integration; photo uploads; roster/contact editing UI; wizard save; multi-org admin UI; PWA/offline; AI schedule-diff.
