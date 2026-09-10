# TeamHQ

Youth rec team manager. Sport-agnostic by design: all sport-specific behavior lives in `src/lib/sports/templates.ts`; never branch on sport in components or prompts.

- Start from `docs/MASTER-PROMPT.md` for scope and rules; `docs/recommendations/` has the expert briefs behind it.
- Data: JSON seeds in `data/teams/` behind `src/lib/data/repo.ts`. Private contacts in `data/private/` (gitignored, repo is public). Public pages use `getPublicTeam` only.
- AI: everything goes through `src/lib/ai/provider.ts`; prompts are versioned files in `prompts/`; outputs are reviewed before saving; contacts are never invented (`enforceProvenance`).
- Rotation fairness is deterministic code in `src/lib/rotation/` with tests: `npm test`.
- Checks before pushing: `npm run typecheck && npm run lint && npm test && npm run build`.
