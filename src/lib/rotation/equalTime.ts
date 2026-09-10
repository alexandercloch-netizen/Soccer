/**
 * Deterministic equal-playing-time rotation.
 * Pure function: same inputs → same lineup. No LLM involved (fairness is math).
 *
 * Rules (from the coaching brief):
 *  - Everyone present plays as close to equal time as the period structure allows.
 *  - Nobody sits two consecutive periods when avoidable.
 *  - Ties are broken by season minutes ledger (whoever has played least all season goes first),
 *    then by a stable order so results are reproducible.
 */
export interface RotationInput {
  playerIds: string[];            // players present today, in a stable order
  playersOnField: number;         // from SportTemplate.gameFormat
  periods: number;                // from SportTemplate.gameFormat
  periodMinutes: number;          // from SportTemplate.gameFormat (use 1 for inning-based)
  seasonMinutes?: Record<string, number>; // cumulative minutes before today
}

export interface RotationPeriod { index: number; onField: string[]; bench: string[] }
export interface RotationResult {
  periods: RotationPeriod[];
  minutesToday: Record<string, number>;
  targetMinutes: number;
  maxSpread: number;
  warnings: string[];
}

export function buildRotation(input: RotationInput): RotationResult {
  const { playerIds, playersOnField, periods, periodMinutes } = input;
  const ledger = input.seasonMinutes ?? {};
  const warnings: string[] = [];
  const present = [...playerIds];
  const minutesToday: Record<string, number> = Object.fromEntries(present.map((p) => [p, 0]));
  const satLast = new Set<string>();
  const out: RotationPeriod[] = [];

  if (present.length === 0) return { periods: [], minutesToday, targetMinutes: 0, maxSpread: 0, warnings: ["No players present."] };

  const onCount = Math.min(playersOnField, present.length);
  if (present.length < playersOnField) warnings.push(`Only ${present.length} present for ${playersOnField}-a-side; everyone plays the whole ${periods === 1 ? "game" : "time"}.`);

  for (let i = 0; i < periods; i++) {
    const ranked = [...present].sort((a, b) => {
      // 1. fewest minutes today
      if (minutesToday[a] !== minutesToday[b]) return minutesToday[a] - minutesToday[b];
      // 2. sat last period → plays now
      const aSat = satLast.has(a) ? 0 : 1;
      const bSat = satLast.has(b) ? 0 : 1;
      if (aSat !== bSat) return aSat - bSat;
      // 3. fewest season minutes
      const la = ledger[a] ?? 0;
      const lb = ledger[b] ?? 0;
      if (la !== lb) return la - lb;
      // 4. stable input order
      return present.indexOf(a) - present.indexOf(b);
    });
    const onField = ranked.slice(0, onCount);
    const bench = ranked.slice(onCount);
    onField.forEach((p) => (minutesToday[p] += periodMinutes));
    satLast.clear();
    bench.forEach((p) => satLast.add(p));
    out.push({ index: i + 1, onField, bench });
  }

  const totals = Object.values(minutesToday);
  const maxSpread = Math.max(...totals) - Math.min(...totals);
  const targetMinutes = (periods * onCount * periodMinutes) / present.length;
  if (maxSpread > periodMinutes) warnings.push(`Playing-time spread is ${maxSpread} min; consider a mid-period swap.`);

  // Detect consecutive benching (only possible when bench > on-field).
  for (let i = 1; i < out.length; i++) {
    const twice = out[i].bench.filter((p) => out[i - 1].bench.includes(p));
    if (twice.length) warnings.push(`${twice.join(", ")} sat two ${periods > 1 ? "periods" : "turns"} in a row (${out[i - 1].index}→${out[i].index}).`);
  }
  return { periods: out, minutesToday, targetMinutes, maxSpread, warnings };
}
