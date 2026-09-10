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
  let remaining = opts.minutes;
  blocks.push({ activityId: "arrival", name: "Arrival free play (every kid dribbling)", minutes: 6 }); remaining -= 6;
  const scrimMin = scrimmage ? Math.min(15, Math.max(10, Math.round(opts.minutes * 0.25))) : 0;
  remaining -= scrimMin + 4; // closing huddle
  for (const a of ordered) {
    if (remaining <= 0) break;
    const m = Math.min(a.minutes, opts.maxBlockMinutes, remaining);
    blocks.push({ activityId: a.id, name: a.name, minutes: m });
    remaining -= m;
    if (blocks.length % 3 === 0 && remaining > 2) { blocks.push({ activityId: "water", name: "Water break", minutes: 2 }); remaining -= 2; }
  }
  if (scrimmage) blocks.push({ activityId: scrimmage.id, name: scrimmage.name, minutes: scrimMin + Math.max(0, remaining) });
  blocks.push({ activityId: "closing", name: "Closing: cheer, high-fives, 'did every kid smile?'", minutes: 4 });
  return blocks;
}
