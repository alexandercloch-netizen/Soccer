import raw from "./activities.json";

export interface Activity {
  id: string; sportId: string; ageBands: string[]; name: string; tags: string[];
  minPlayers: number; minutes: number; equipment: string[]; setup: string; howToPlay: string;
  coachingPoints: string[]; story: string;
}

export const ACTIVITIES: Activity[] = raw as Activity[];

/** Filter in code (RAG-lite) so the AI only ever sees relevant activities. */
export function filterActivities(opts: { sportId: string; ageBandId: string; playerCount?: number; tags?: string[] }): Activity[] {
  return ACTIVITIES.filter((a) =>
    a.sportId === opts.sportId &&
    a.ageBands.includes(opts.ageBandId) &&
    (opts.playerCount == null || a.minPlayers <= opts.playerCount) &&
    (!opts.tags?.length || opts.tags.some((t) => a.tags.includes(t)))
  );
}

/**
 * Manual (no-AI) practice plan: the "practice in 3 clicks" fallback.
 * warm-up → 2–3 skill games → scrimmage → closing, capped by the age band's max block length.
 */
export function defaultPlan(opts: { sportId: string; ageBandId: string; playerCount: number; minutes: number; maxBlockMinutes: number; focusTags?: string[] }) {
  const pool = filterActivities({ sportId: opts.sportId, ageBandId: opts.ageBandId, playerCount: opts.playerCount });
  const scrimmage = pool.find((a) => a.tags.includes("scrimmage"));
  const skills = pool.filter((a) => !a.tags.includes("scrimmage"));
  const preferred = opts.focusTags?.length ? skills.filter((a) => a.tags.some((t) => opts.focusTags!.includes(t))) : [];
  const ordered = [...preferred, ...skills.filter((a) => !preferred.includes(a))];
  const blocks: { activityId: string; name: string; minutes: number }[] = [];
  const ARRIVAL = 6, CLOSING = 4, WATER = 2;
  const scrimMin = Math.min(15, Math.max(10, Math.round(opts.minutes * 0.25)));
  let remaining = opts.minutes - ARRIVAL - CLOSING - scrimMin;
  blocks.push({ activityId: "arrival", name: "Arrival free play (every kid with a ball)", minutes: ARRIVAL });
  // Round-robin through the library until the skill time is filled; a thin library repeats activities.
  const skillBlocks: { activityId: string; name: string; minutes: number }[] = [];
  for (let i = 0; remaining > 0 && ordered.length > 0 && i < 40; i++) {
    const a = ordered[i % ordered.length];
    const m = Math.min(a.minutes, opts.maxBlockMinutes, remaining);
    skillBlocks.push({ activityId: a.id, name: i >= ordered.length ? `${a.name} (again)` : a.name, minutes: m });
    remaining -= m;
    if (skillBlocks.length % 3 === 0 && remaining > WATER + 2) { skillBlocks.push({ activityId: "water", name: "Water break", minutes: WATER }); remaining -= WATER; }
  }
  blocks.push(...skillBlocks);
  const scrimName = scrimmage?.name ?? "Mini game (everyone plays, no score)";
  blocks.push({ activityId: scrimmage?.id ?? "scrimmage", name: scrimName, minutes: scrimMin + Math.max(0, remaining) });
  blocks.push({ activityId: "closing", name: "Closing: cheer, high-fives, 'did every kid smile?'", minutes: CLOSING });
  return blocks;
}
