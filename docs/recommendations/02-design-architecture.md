# Expert Recommendations: Product Design & Web Architecture

*Produced by the "senior product designer / front-end architect" member of the advisory team. Grounds the information architecture, screen list, design tokens, mobile field-side UX, privacy defaults, and the phased delivery plan.*

## 1. Information Architecture

**Hierarchy:** `Organization` (Vernon Hills Park District) → `Season` (Fall 2026) → `Team` (Tottenham Boys). Sport is a template attached to the Team, not a level of the hierarchy.

**URL scheme:** `/[org]/[season]/[team]/...` for coach views; `/t/[shareCode]` for the public parent view (short, QR-able, no login).

**Team switcher:** A single pill in the header showing crest + team name; tapping opens a sheet listing teams grouped by season. Persist "current team" in a cookie so the app opens straight into it. Hide the switcher entirely when the user has one team.

**Coach (authenticated) sitemap**
- Home ("This Week")
- Schedule → Event detail → Game Day mode
- Roster → Player detail (guardians, medical notes, availability)
- Practice → Plan list → Plan editor
- Team → Snack rotation, Announcements, Settings (theme, sport template, sharing)
- Season Setup wizard (first-run and reachable from Settings)

**Parent (public, read-only) sitemap:** This Week · Schedule · Roster (first name + last initial only) · Snacks · Announcements. Optional "I'm a guardian" passcode unlocks RSVP.

**Phone-first pages:** This Week, Game Day, Attendance, Snacks, Announcements. **Desktop-first pages:** Season Setup, Practice Plan editor, Roster bulk edit, Settings.

Mobile bottom nav (coach): **Home · Schedule · Roster · Practice · More**. Parent: **Home · Schedule · Roster · Snacks**.

## 2. Key Screens

1. **This Week (Dashboard):** Stacked cards in chronological order: next event hero card (date, location, map link, weather chip, "Snack: the Patels"), then "needs attention" chips (2 unconfirmed RSVPs, no lineup yet). Primary action: **Open next event**.
2. **Roster:** List rows with kid avatar, name, jersey #, attendance % micro-bar. Coach sees guardian phone/email tap-to-call. Primary action: **Add player** (desktop: paste-from-spreadsheet importer).
3. **Schedule:** Grouped-by-week list, never a calendar grid on phone. Row = day chip, type icon (practice/game/picture/rain date), time, location. Filters as chips. Primary action: **Add event**; secondary: **Subscribe (ICS)**.
4. **Game Day (phone-first):** Three vertical zones: (top) running clock + period + "swap in 2:30" countdown; (middle) on-field list vs bench list, each row 56px, tap-to-swap; (bottom) sticky **Next Sub** button showing who comes off/on. Equal-time engine precomputes rotation; coach just confirms. Bench rows show minutes played so far.
5. **Practice Plan:** Timeline of blocks with duration stepper and an activity library sidebar (desktop) / sheet (mobile). "Run mode" turns it into a big-type timer. Primary action: **Generate with AI** from goals + minutes.
6. **Communications:** Announcement composer with audience (all guardians / attending only), channel toggles (email, in-app, copy-as-text for group chat). History below. Primary action: **Send**.
7. **Season Setup Wizard (AI):** Steps: Sport & format → Paste league email/roster → Review extracted schedule → Import roster → Theme. AI output is always shown as an editable table before commit.
8. **Settings / Sport Template:** Team identity (colors, crest upload), sport template picker showing what it controls (players on field, period length, positions), sharing (public code, QR), coaches list.

## 3. Visual Design System

**Typography:** `Nunito` (headings/UI, rounded and friendly) + `Inter` (body/data) via Google Fonts; fallback `system-ui, -apple-system, Segoe UI, sans-serif`. Scale: 12/14/16/18/22/28/36px; body 16px minimum on phone; Game Day clock 56px tabular-nums.

**Spacing scale (Tailwind-aligned):** 4, 8, 12, 16, 24, 32, 48, 64px. Card padding 16 (phone) / 24 (desktop). Radius: 8 chips, 12 cards, 999 avatars.

**Color tokens (CSS variables; team tokens overwrite only the `--team-*` set):**

```css
:root {
  --bg: #F8F7F4;        --surface: #FFFFFF;   --surface-2: #F1EFEA;
  --text: #1B1F24;      --text-muted: #5C6470; --border: #E2DFD8;
  --success: #2E8B57;   --warning: #C77700;    --danger: #C2413B;   --info: #2F6FDB;
  --team-primary: #132257;  --team-on-primary: #FFFFFF;  --team-accent: #FFFFFF;
  --team-primary-soft: color-mix(in oklch, var(--team-primary) 12%, var(--surface));
  --focus: #2F6FDB;
}
:root[data-theme="dark"] {
  --bg: #121417;  --surface: #1B1F24;  --surface-2: #242930;
  --text: #F2F2EF; --text-muted: #A3AAB5; --border: #2F353D;
  --team-primary-soft: color-mix(in oklch, var(--team-primary) 24%, var(--surface));
}
```

Store team colors in the DB; inject as inline `style` on `<html>`. Compute `--team-on-primary` server-side (WCAG contrast check) so a yellow team never gets white text. Team color is used for the header band, primary buttons, crest ring, and active nav only; semantic colors (success/warning) are never overridden.

**Component inventory:** Card, EventRow, PlayerRow, KidAvatar (initials on `--team-primary-soft`, optional photo when consented), Chip, StatusPill (Attending/Maybe/Out), BottomNav (sticky, 64px, safe-area padded), Sheet (mobile modal), Timer, Stepper, EmptyState, Toast, DataTable (desktop only).

**Iconography:** Lucide icons (MIT, consistent stroke, tree-shakeable); 24px in nav, 20px inline. Sport-specific glyphs as a tiny custom SVG set keyed by sport template.

**Illustration/empty-state tone:** Flat, two-tone line illustrations using `--team-primary` + `--surface-2`. Copy is warm and direct: "No practices yet — add one or let AI draft the season." Avoid cartoon kids, clip-art mascots, and stock-corporate vectors.

## 4. Mobile / Field-Side UX

- Tap targets ≥ 48×48; Game Day rows 56px; primary actions full-width in the thumb zone.
- Sunlight: body contrast ≥ 7:1 in light mode; a "Field Mode" (bigger type, higher contrast) available with one tap in Game Day.
- One-hand: destructive actions require a second tap (undo toast, not a confirm dialog).
- **Attendance:** tap a row to cycle Present → Absent → Late; long-press for note. Whole team defaults to Present.
- **Sub timer:** vibrates + banner 30s before a planned swap; "Next up: Leo ↔ Mateo" always visible; a "Skip" and "Now" pair.
- **Offline:** PWA with service worker; roster, schedule, and today's lineup cached; Game Day writes queue in IndexedDB and sync on reconnect.
- Wake lock during Game Day; auto-save every state change.

## 5. Accessibility & Privacy

- Semantic HTML, visible focus rings, `aria-live="polite"` for timer and sub announcements, reduced-motion respect, all color states paired with icon/text.
- Kids shown as "Leo P." everywhere public; full names only in coach views. Photos off by default; a per-player `photoConsent` flag gates display.
- Guardian contacts render only when session role ≥ coach; never in the public JSON payload (separate DTO, not just hidden UI).
- Medical/allergy notes: coach-only, hidden behind a "show" toggle, never in exports or AI prompts unless the coach explicitly includes them.
- Public share codes are revocable and rotate per season.

## 6. Tech Architecture

```
app/
  (public)/t/[code]/...        # parent read-only routes
  (coach)/[org]/[season]/[team]/{page,schedule,roster,practice,game/[eventId],settings}
  (auth)/login, api/auth/...
  setup/                       # wizard
components/{ui,team,schedule,gameday,practice}
lib/{db.ts, auth.ts, theme.ts, sports/ (templates), ai/ (prompts, schemas), rotation/ (equal-time engine)}
prisma/schema.prisma
```

**Data model:** Organization · Season · Sport(key, config JSON) · Team(seasonId, sportId, name, colors, crestUrl, shareCode) · Player · Guardian + PlayerGuardian(relationship) · Membership(userId, teamId, role) · Event(type, start, end, location, isRainDate, rainDateForId?) · Attendance · Lineup(config JSON) · PracticePlan(blocks JSON) · Announcement · SnackAssignment.

**Auth:** Auth.js with email magic link for coaches; parents use share code (read) plus optional 6-digit team passcode (RSVP). No passwords. Roles: owner, coach, guardian.

**Sport-agnostic abstraction:** A `SportTemplate` TypeScript object stored as JSON with a Zod schema. The rotation engine and Game Day UI read only from the template — no `if (sport === 'soccer')` in components. Ship `soccer-u6`, `soccer-u8`, `tball` templates first.

**Defer:** payments, photo galleries, multi-org admin, native apps, SMS, real-time multi-coach sync, stats beyond minutes played.

**DB:** Start with Postgres (Neon/Vercel Postgres) via Prisma; SQLite on Vercel is painful and the switch later costs more than starting right.

## 7. Delivery Plan

- **v0 — Shell:** Next.js + Tailwind + tokens + theme injection, bottom nav, teams seeded with different colors, deployed. *Done:* switching team recolors the app; all routes render empty states on phone and desktop.
- **v1 — Roster + Schedule:** Prisma models, magic-link auth, roster CRUD with guardians, schedule CRUD, public parent view with share code, ICS feed, snack rotation, attendance. *Done:* parents can open a link and see this week; coach can take attendance on phone at practice.
- **v2 — Game Day + Practice:** SportTemplate, equal-time rotation engine (unit-tested), Game Day live mode with timer and offline queue, practice plan editor + run mode, announcements via email. *Done:* a full game managed from a phone with zero data loss on signal drop.
- **v3 — AI:** Season Setup wizard (paste league email → structured events/roster via Claude with structured output), AI practice plan generation, announcement drafting. *Done:* a new season for a new sport can be set up in under 10 minutes from a league email, with every AI output reviewed in an editable table before saving.
