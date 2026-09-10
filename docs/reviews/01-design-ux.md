# Review: Design and UX

*Read-only review of the code on the branch by the design/UX reviewer. Findings are ranked by user impact and reference file:line. Feeds the swarm work graph in `docs/swarm/graph.json`.*

## 1. Top 10 findings (ranked by impact)

1. **Parent hero card has no one-tap directions and snack duty isn't self-identifying** — `src/app/t/[code]/page.tsx:20-21` prints location as plain text; the map link only appears in a separate "Game day" card and only for the team-wide `gameVenue`, never for a practice field. Snack reads "Snack: Alicia" — a parent must already know that's them. *Hurts: parents.* Fix: "Directions" button on every event using `event.location`; snack line as "Snack: the Johnston family" with a "That's me / not me" affordance once identity exists (§2b). **S** (map) / **M** (identity).
2. **Bottom nav has no active state and uses emoji icons** — `src/components/AppShell.tsx:44-45`: every tab is `text-muted`, no `aria-current`, 12px labels, emoji render differently per OS. *Hurts: all three.* Fix: `usePathname` + `aria-current="page"`, Lucide icons, team color on active tab. **S**
3. **Coach schedule is read-only and practices aren't tappable** — `src/app/team/[slug]/schedule/page.tsx:29` only games get an `href`; there is no add/edit/cancel anywhere; "Coming up" on Home links practices to the generic schedule. *Hurts: coach.* Fix: event detail sheet with actions (§2c). **L** (needs a write path).
4. **Game Day isn't one-handed** — `GameDay.tsx:59-103`: on a phone the DOM order puts the "Minutes today" ledger *between* the clock and the on-field/bench lists; "Next period" sits at the top, not in a sticky thumb-zone bar; the clock silently clamps at 0 (no vibration/banner); no wake lock; a refresh loses attendance, period and clock. Bench rows carry `.tap` but aren't interactive (tap-to-swap is missing). *Hurts: coach.* Fix: reorder DOM, sticky bottom "Next period · In: Leo / Out: Mateo" button, `navigator.vibrate` + `aria-live` at 0:00, persist state to `localStorage` keyed by event. **M**
5. **Attendance exists only inside Game Day** — `AttendanceRecord` (`types.ts:73`) is never used; practices have no attendance at all. *Hurts: coach.* Fix: attendance on every event detail; default Present; tap cycles Present→Absent→Late. **M**
6. **"Needs attention" chips don't do anything** — `src/app/team/[slug]/page.tsx:42-49`: static spans; "Games without a snack parent" doesn't say which; env warnings (COACH_PASSCODE, AI off) mix admin config into a field-side view. *Hurts: coach.* Fix: chips become links to the offending event/player; move config warnings to Settings. **S**
7. **Parents can't claim an open snack slot** — `src/app/t/[code]/snacks/page.tsx:11-14` shows "Open" with the instruction "tell the coaches" and no way to do so. *Hurts: parents and coach.* Fix: §2b. **M**
8. **Sharing is a relative path in a monospace paragraph** — `settings/page.tsx:39` shows `/t/CODE`, no absolute URL, copy, QR or share. *Hurts: admin/coach.* Fix: §2a. **S–M**
9. **Developer instructions leak into product copy** — `SetupWizard.tsx:105` ("paste the JSON into data/teams/…"), `settings/page.tsx:22`, `roster/page.tsx:15`. The admin is told to edit repo files. *Hurts: admin.* Fix: gate behind a dev flag or reword; long-term a real save. **S** copy / **L** real.
10. **Contrast and tap targets miss the brief's own bar** — `--text-muted` #5C6470 on `--bg` ≈ 5.3:1 (target 7:1); `text-warning` on `bg-warning/15` ≈ 4:1; tone buttons in `PlanGenerator.tsx:64` and `Composer.tsx:32` are ~28px; "Field mode", "Edit attendance", "Exit run mode" are text links; hero-card text at `opacity-80/90` undermines the computed `--team-on-primary`. *Hurts: coach in sunlight, everyone.* Fix: darken muted/warning tokens, `.tap` on every button, a dedicated `--team-on-primary-muted`. **S**

## 2. Missing UX for required features

**(a) Sharing the parent link.** Settings "Sharing" card and a "Share team page" item in More. Screen: big QR (SVG, team color) above the absolute URL `goodsport.team/t/CODE`, then a row of four 48px buttons: **Copy link**, **Text it** (`sms:?body=…` prefilled: "Tottenham Boys schedule, field and snacks: <url>"), **Share** (`navigator.share` when present, hidden otherwise), **Print QR**. Below: "Rotate code" (secondary, undo toast) with a note that old links stop working. Also surface "Share with families" as the hero card's secondary action for the first two weeks of a season.

**(b) Per-game snack sign-up.** Parent Snacks tab becomes a list of games with three row states: *Claimed by the Patels*, *Open — "I'll bring it"*, *Yours — "Need to swap?"*. First claim asks for family name + phone (stored privately, not in the public payload) and drops a cookie so the page recognises "you" thereafter. Claiming an open slot writes immediately with an undo toast. Swap: tap "Need to swap?" → the slot goes back to Open with a "was the Patels" badge and the coaches get a chip. Coach view: Home chip "2 games need a snack family" links to the coach Snacks list, where each gap has **Assign** (picker from guardians) and **Ask families** (prefilled text with the parent link). Allergy note from the roster pinned at the top of both views.

**(c) Editing the schedule on a phone.** Every EventRow opens an **event detail sheet**: title, date, time, location (with Directions), attendance, snack, notes. Coach actions as a 2×2 grid of 56px buttons: **Edit**, **Move** (date/time picker only), **Cancel** (one tap, undo toast, event stays listed struck-through with a "Cancelled" chip), **Message families** (prefilled composer). Schedule page gets a sticky **+ Add** FAB opening a sheet with kind chips (Practice/Game/Other), date, time, location prefilled from the last event of that kind, and "Repeat weekly until" for practices. **Rain-date activation:** cancelling a game that has `rainDateForId` offers "Play the rain date on Sun Oct 4" → the rain-date row flips from Tentative to Scheduled, inherits opponent/location/snack, and the parent hero updates; the composer opens prefilled.

## 3. Design-system gaps

- **Tokens:** no `--text-muted` variant that meets 7:1; no team-on-primary muted; no spacing/type scale tokens; `--team-accent` is defined but never used.
- **Components missing:** Sheet, Toast/undo, StatusPill, Stepper, PlayerRow, Timer, BottomNav as a component with active state, DataTable. `Card` is doing the work of all of them.
- **Empty states:** `EmptyState` exists but is unused; Schedule, Snacks and Roster render empty cards with headers when data is missing.
- **Dark mode:** tokens are wired correctly, but `bg-success/15` etc. on dark surfaces are near-invisible, and `bg-white/15` in the header (`AppShell.tsx:26`) ignores the on-primary color.
- **Accessibility:** focus ring is defined but `Button` uses `active:scale` only; nav lacks `aria-current`; kind icons in `EventRow.tsx:9` have no text alternative; `title=` tooltips carry provenance in the wizard, inaccessible on touch.
- **Consistency:** two nav labels for roster ("Roster"/"Team"); three ways to render a snack line; `tel:` strips formatting but display doesn't; dates hard-coded `en-US`; `PageHeader` subtitle on parent Home duplicates the header band.

## 4. Definition of simple

**Parent (phone, from a text):** opens the link and, without scrolling, sees the next event's day, time, arrive-by, a Directions button, what to bring, and whether snack is theirs, in ≤10s; every tab is one tap; nothing asks for a login; no field names, codes, or file paths appear anywhere.

**Coach (phone at the field):** attendance for the whole team in ≤5 taps; Game Day's only bottom button is always the next thing to do; every destructive action is undoable, never confirmed; state survives a refresh or signal drop; all targets ≥48px and text ≥16px.

**Admin (laptop):** sets up a season, shares the link (copy/QR/text) and sees the parent view in ≤10 minutes; all editing happens in the UI; config warnings live in Settings only; every AI output is an editable table with a Save button.
