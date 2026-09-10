# Review: Security

*Read-only review by the application security reviewer. Findings are ranked; the "Must" list is the baseline for the swarm PR. Two items (fail-open gate, open redirect) were hotfixed on the branch the same day; the rest are graph nodes.*

## 1. Findings

**HIGH — Coach gate fails open.** `src/lib/auth.ts`, `src/proxy.ts`. If `COACH_PASSCODE` is unset in any Netlify context (deploy previews and branch deploys don't inherit production-scoped vars), `/team/*` (guardian phones, emails, DOBs, medical notes) and `/api/ai/*` are public. Fix: in production deny when unset; require an explicit `COACH_OPEN=1` for local development. *(Hotfixed.)*

**HIGH — Open redirect after login.** `src/app/api/login/route.ts`. The check allowed `/\evil.com`, which `new URL()` resolves to `https://evil.com/`. Fix: resolve against the origin and require same origin plus a `/team/` prefix. *(Hotfixed.)*

**HIGH — Share code is a public, guessable, enumerable constant.** `spurs26` is committed to a public repo and printed in the README; the pattern (club nickname + year) is guessable; `/t/<code>` returns 404 vs 200 with no rate limit. Exposes young children's first names + last initials, exact field, dates/times, picture day, and snack-parent first names. Fix: generate ≥96-bit random codes, store them outside the public seed, keep a history so old codes show "expired", rotate each season, rate-limit 404s.

**HIGH — AI routes: cost abuse and prompt injection.** When the gate is off, anyone can call Opus with large pastes. `{{context}}` and `{{focus}}` (untrusted) are interpolated into the *system* prompt in two prompt files. `sportTemplateId` is unvalidated and the thrown message is echoed. Fix: static system prompts with user text in the user turn wrapped as data; `z.enum` over template ids; lower `max_tokens` per feature; rate limit per session; daily spend cap; `maxDuration`; require a coach session.

**MEDIUM — Passcode scheme.** Cookie is a keyless SHA-256 of a low-entropy shared secret: a leaked cookie is offline-crackable. No rate limiting or lockout on login; non-constant-time compares; `secure` flag derived from the proxied URL; 120-day non-revocable, one secret for all coaches and all teams; logout only clears the client; `GET /api/logout` is CSRF-able. Fix: per-person sessions stored server-side (see access review), HMAC with a server secret in the interim, `timingSafeEqual`, `secure` in production, POST logout.

**MEDIUM — No security headers.** No CSP, HSTS, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`. Fix in `next.config.ts` `headers()`.

**MEDIUM — PII in RSC payloads and caches.** Coach pages are not forced dynamic, so PII-bearing HTML/RSC can be cached by CDN or browser. The Game Day page serializes full `medicalNotes` into a client prop used only as a boolean. The messages page ships every family's email into client props and a `mailto:` URL. Fix: `dynamic = "force-dynamic"` and `Cache-Control: private, no-store` on `/team/*` and `/api/*`; pass `hasMedical: boolean`; build the mailto server-side behind a click.

**MEDIUM — Public projection is a blocklist, not an allowlist.** `getPublicTeam` returns the full `team` (including coach emails and the share code) and spreads events (`notes`, `snackGuardianId`). Coach notes about named children sit in the public seed. Fix: explicit field picks; move `coachNotes` and `org.notes` to the private overlay; add a test that the serialized public DTO contains no `@` and no phone pattern.

**MEDIUM — Secrets handling.** `PRIVATE_CONTACTS_JSON` holds every family's contacts in one env var readable by the build step and any plugin; the helper script prints it to stdout. Fix: scope to Functions runtime, or move contacts to the database; rotate on coach turnover.

**LOW — Supply chain and build.** No CI, no Dependabot, deploys from an unprotected branch. Fix: `npm ci` in `netlify.toml`, GitHub Actions running the repo checks, Dependabot, branch protection.

**LOW — Error leakage.** SDK and template errors are returned verbatim. Return generic messages; log details server-side with a request id.

**Children's data.** No photos today and `photoConsent` is unused; enforce it before any upload. Publish a short privacy notice (what is public, who sees contacts, AI processing, retention); delete or rotate at season end; let a family opt out of the public roster; strip DOB and contacts before AI calls that don't need them.

## 2. Threat model

| Actor | Asset | Entry point | Control |
|---|---|---|---|
| Curious parent | Other families' contacts, medical notes | `/team/*`, `/api/ai/*` | Fail-closed gate; per-person identity; no-store caching |
| Ex-parent or ex-coach | Current roster, coach tools | Old passcode/cookie, old share code | Rotated per-season codes; revocable sessions |
| Random internet user | Kids' names and where/when they are; API spend | `/t/<guess>`, `/api/ai/*`, `POST /api/login` | High-entropy codes; rate limiting; AI auth and quotas |
| Opposing-team coach | Roster/schedule | `/t/<club+year>` | Random codes not derived from team name |
| Malicious link | Coach session; framing | `/login?next=…`, iframes | Same-origin `next` check; `frame-ancestors 'none'`; CSP |
| Compromised dependency | Contacts env var, API key | Build step | Function-scoped secrets; `npm ci`; CI review |

## 3. Before parents can write (snack sign-ups)

- **Identity:** a session tied to a household (family link or verified claim); the share code alone never grants write.
- **Server-side authorization:** every mutation re-checks the session's household owns the row; never trust ids from the body.
- **Input validation:** zod on every body; `eventId` must be a future game of that team; one household per slot; reject unknown keys; SameSite=Lax plus Origin check; POST only.
- **Abuse limits:** rate limit per session and IP; idempotency; compare-and-set on the slot so two parents can't both win.
- **Audit trail:** append-only log with who, team, action, before, after; show "changed by X" on the page.
- **Storage:** a database with per-team scoping so writes don't need redeploys and PII isn't in an env var.

## 4. Single-PR fix list

**Must:** fail closed (done); open redirect (done); server-side sessions with a secret, expiry, `timingSafeEqual`, `secure`; rate limits on login, AI, and `/t/*` 404s; random share codes out of the public seed and README; security headers and `no-store` on `/team/*`; untrusted text out of system prompts, validated template ids, generic errors.

**Should:** `hasMedical` boolean; allowlist projection; move notes to the overlay; function-scoped secrets; `npm ci`; CI, Dependabot, branch protection; lower `max_tokens` and `maxDuration`; POST logout; privacy notice; season-end deletion.
