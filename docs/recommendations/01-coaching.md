# Expert Recommendations: Youth Coaching (Pre-K/K Soccer, Cross-Sport)

*Produced by the "expert youth coach" member of the advisory team. Grounds the domain model, the practice-plan library, the game-day rotation logic, and the AI feature ranking.*

## 1. Coaching Domain Model

**Universal (any sport):**
- **Player**: name, nickname, DOB/age band, jersey #, shirt size, photo consent, medical/allergy notes, "what motivates this kid" free text, gear-check status.
- **Guardian** (many-to-many with Player): name, phone, email, relationship, pickup-authorized flag, emergency priority, volunteer roles (snack, assistant, photographer).
- **Household/Sibling link**: siblings on other teams drive carpool and scheduling conflicts; model as `Household` grouping.
- **Attendance**: per event (practice/game), status = present / absent / late / notified-absent. Feeds lineup builder.
- **Events**: practice, game, rain-date (status: tentative/activated/released), picture day, party. Fields: location, arrival time vs start time, opponent, home/away, cancellation state.
- **Snack rotation**: ordered guardian assignments per game, with swap history.
- **Equipment checklist**: coach kit (cones, pinnies, balls, first-aid, roster card) and per-player required gear (sport-specific list).
- **Practice plan**: ordered activities with duration, setup, coaching points, minimum players.
- **Lineup/rotation**: per-game shift chart with minutes-played ledger across season.
- **Communication log**: outbound messages (what, to whom, when), plus parent replies/RSVPs.
- **Volunteer roles**: assistant coach, team parent, end-of-season party.

**Sport-specific:** game format (4v4, no GK), period structure, positions, minutes/innings/quarters unit, gear list, ball size, field terminology, scoring rules (rec at this age: no score kept).

## 2. Age-Appropriate Practice Planning

**Principles (U4–U6):** every kid has a ball; no lines, no laps, no lectures; activities are *games* with a story ("pirates," "sharks"); 4–6 min per activity; change fast; coach plays *with* them; water every 15 min; end with scrimmage every single week; praise effort, not outcome.

**60-minute structure:**
| Block | Min | Purpose |
|---|---|---|
| Arrival free play | 0–8 | Every kid dribbling as they arrive; no formal start |
| Warm-up game | 8–15 | Ball + movement (Red Light/Green Light) |
| Game 1 | 15–22 | Dribbling |
| Water | 2 | |
| Game 2 | 24–31 | Dribbling + stopping/turning |
| Game 3 | 31–38 | Shooting or 1v1 |
| Water | 2 | |
| Scrimmage 3v3/4v4 | 40–55 | No positions, two small goals, no GK |
| Closing | 55–60 | Cheer, sticker/high-fives, reminder to parents |

**Activity library (soccer, U4–U6):**
1. **Red Light / Green Light** — each kid a ball; dribble on green, stop with sole on ball on red. *Coach:* small touches, stop with foot on top.
2. **Sharks & Minnows** — minnows dribble across; 1–2 sharks kick balls out; kicked-out become sharks. *Coach:* head up, change direction.
3. **Pirate Treasure** — balls scattered ("treasure"); kids dribble treasure back to their "ship" (hoop/cone box). *Coach:* keep ball close.
4. **Knock the Castle** — cones stacked as castles; kids shoot to knock over. *Coach:* laces, plant foot beside ball.
5. **Body-Part Ball** — coach calls "knee / elbow / bottom"; kids stop ball with that part. *Coach:* listening + ball familiarity.
6. **Freeze Tag with Ball** — coach as tagger; frozen kid stands with ball; teammates unfreeze by passing through legs.
7. **Egg Hunt** — many balls scattered, coach grabs balls back; kids retrieve into "nest." Pure chaos, pure dribbling.
8. **Animal Dribble** — dribble like elephant (slow, big), cheetah (fast), crab (sideways).
9. **Coach Says (Simon Says)** — with ball: toe taps, sole rolls, pull-backs.
10. **Big Goal Scrimmage** — 3v3, no keepers, two coaches feeding balls in immediately when one goes out. *Coach:* "go score!" Nothing else.

**Scaling by age band:**
- **U4–U6**: 4–6 min activities, storytelling, 1 ball each, 3v3/4v4, no positions.
- **U7–U8**: 8–10 min activities, add 1v1/2v1, passing pairs, 4v4/5v5, introduce GK rotation, simple "spread out" concept.
- **U9–U10**: 12–15 min, small-sided 3v3–5v5 with constraints, 7v7 games, basic positions (rotate everyone), first tactical words.
- **U11+**: 15–20 min, positional roles, 9v9/11v11, functional practices, fitness inside games.

## 3. Game Day

Vernon Hills Pre-K/K plays **4v4, no goalkeepers**, typically 4 × 8–10 min quarters (confirm with club). With 8 players: 4 on, 4 off = perfect two-unit swap each quarter; rotate the *pairing* so friends and the strong/shy kids mix. With 7: rotate 3 off; app tracks who sat most recently. **No positions**—"everybody goes to the ball" is normal at 4; the only instruction is "which goal is ours."

**Equal-time algorithm:** target minutes = (periods × players-on-field × period length) / players present. Prioritize whoever sat last; never let a kid sit two consecutive periods unless they ask. Season ledger catches cumulative unfairness.

**Parent sideline expectations** (send before Game 1): cheer, don't coach; no "kick it!"; opposite side from bench; kids may wander, cry, pick dandelions—that's fine; no score is kept.

**Coach's game-day card (one printable page):** roster with jersey #s, allergy/medical flags highlighted, emergency contacts, today's rotation chart, snack parent, field/time/opponent, arrival 15 min early, rain-date status.

## 4. Communication

- **Preseason (once):** welcome letter, coach philosophy (fun-first, equal time), full schedule with rain dates, required gear + where to buy, snack rotation sign-up, volunteer asks, medical/photo consent, sideline expectations.
- **Weekly (Mon or Tue):** this week's practice + game details, snack parent, weather outlook, one "practice at home" tip.
- **Game day (morning):** field, time, who brings snack, jersey color, weather/cancellation status. **Keep to one message.**
- **Ad hoc:** cancellations (target ≥2 hrs before), rain-date activation, picture-day logistics.

**Automate:** 24-hr and 2-hr reminders; snack-parent nudge Thursday; weather watch with suggested cancel/decision deadline; rain-date activation that updates the calendar and notifies; RSVP collection so the lineup builder knows headcount; end-of-season thank-yous.

## 5. AI Features (Ranked)

1. **Season Setup Wizard** — *Input:* pasted club email/roster/schedule. *Output:* players, guardians, events, rain dates, gear list populated. *Why:* removes the hour of data entry that kills adoption.
2. **Practice Plan Generator** — *Input:* sport, age band, headcount, minutes, focus, past plans. *Output:* timed plan from the library, avoids repeating last week. *Why:* Wednesday 4:30 PM panic.
3. **Equal-Time Lineup Builder** — *Input:* RSVPs, format, season ledger. *Output:* period-by-period rotation chart, printable. *Why:* fairness is the #1 parent complaint.
4. **Parent Message Drafter** — *Input:* event + intent (reminder/cancel/thank-you). *Output:* short, warm message in coach's voice.
5. **Weather-Aware Decision Assistant** — *Input:* forecast, lightning policy, rain dates. *Output:* recommendation + decision deadline + draft notice.
6. **Snack/Volunteer Scheduler** — *Input:* guardians, games, constraints. *Output:* rotation with swap handling.
7. **Post-Practice Reflection Prompt** — *Input:* 2-sentence voice note. *Output:* per-player notes + next-week suggestions.
8. **End-of-Season Kit** — *Input:* roster, notes. *Output:* personalized certificates with a real specific compliment, thank-you letter, party checklist.

## 6. Cross-Sport Sport Template

```yaml
sport: soccer
terminology: {session: practice, contest: game, field: field, score_unit: goal}
age_bands:
  - {id: U6, ages: [3,6], format: "4v4", periods: {count: 4, length_min: 8, unit: quarter},
     positions: none, goalkeeper: false, ball: "size 3", keep_score: false}
  - {id: U8, ages: [7,8], format: "5v5", periods: {count: 4, length_min: 10, unit: quarter},
     positions: [defender, forward, GK], keep_score: false}
gear: {required: [shin guards, cleats or gym shoes, water, size 3 ball], coach: [cones, pinnies, pump, first-aid]}
rotation_model: time_based   # equal minutes
activity_tags: [dribbling, shooting, 1v1, passing]
```

```yaml
sport: baseball_tball
terminology: {session: practice, contest: game, field: diamond, score_unit: run}
age_bands:
  - {id: TBall, ages: [4,6], format: "all field", periods: {count: 3, length_min: null, unit: inning},
     positions: [P, 1B, 2B, SS, 3B, LF, CF, RF, rover], batting_order: continuous, keep_score: false}
gear: {required: [glove, helmet, cleats, water], coach: [tee, bucket of balls, bases, first-aid]}
rotation_model: position_and_batting   # everyone bats each inning, rotate infield/outfield
activity_tags: [throwing, catching, hitting, base running]
```

**Key abstraction:** `rotation_model` (time-based / position-based / inning-based / possession-based for basketball) drives the lineup builder; `periods.unit` drives the game-day chart; `terminology` drives all UI strings; practice library activities are tagged by sport + age band + skill.

## 7. Pitfalls the App Should Nudge Against

- **Lines and laps** — reject plans where >2 kids wait; warn on "sprint," "lap."
- **Talking too long** — cap instruction blocks at 30 seconds; show a timer.
- **Same 4 kids start every week** — ledger alert.
- **Playing the "good kid" to win** — no score field at U6; rotation locked to equal time.
- **Over-scheduling** — one message per event max; dedupe reminders.
- **Forgetting medical flags** — pin allergies to the game card; require acknowledgment.
- **No rain plan** — force a decision deadline on weather events.
- **Ignoring the shy/crying kid** — per-player notes surface "needs a parent nearby for first 5 min."
- **Coach burnout** — "practice in 3 clicks" default plan; never require a plan to run practice.
- **Forgetting it's for the kids** — closing prompt every session: "Did every kid smile today?"
