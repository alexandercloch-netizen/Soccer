import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { TeamData, Player, Guardian } from "@/lib/types";

/**
 * Repository layer. Today: versioned JSON seeds under data/teams plus a gitignored
 * private overlay under data/private. Swap this file for Prisma later; nothing in
 * the UI imports fs.
 */
const TEAMS_DIR = path.join(process.cwd(), "data", "teams");
const PRIVATE_DIR = path.join(process.cwd(), "data", "private");

interface Overlay { players?: Record<string, Partial<Player>>; guardians?: Record<string, Partial<Guardian>> }

function readJson<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(file, "utf8")) as T; } catch { return null; }
}

/**
 * Private overlay source, in priority order:
 *  1. data/private/<slug>.contacts.json (local development; gitignored)
 *  2. PRIVATE_CONTACTS_JSON env var (hosted deploys such as Netlify): a JSON
 *     object keyed by team slug, each value shaped like the overlay file.
 */
function readOverlay(slug: string): Overlay | null {
  const fromFile = readJson<Overlay>(path.join(PRIVATE_DIR, `${slug}.contacts.json`));
  if (fromFile) return fromFile;
  const env = process.env.PRIVATE_CONTACTS_JSON;
  if (!env) return null;
  try {
    const all = JSON.parse(env) as Record<string, Overlay>;
    return all[slug] ?? null;
  } catch {
    console.warn("PRIVATE_CONTACTS_JSON is not valid JSON; ignoring.");
    return null;
  }
}

export function listTeamSlugs(): string[] {
  if (!fs.existsSync(TEAMS_DIR)) return [];
  return fs.readdirSync(TEAMS_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
}

export function loadTeam(slug: string, opts: { includePrivate: boolean }): TeamData | null {
  const base = readJson<TeamData>(path.join(TEAMS_DIR, `${slug}.json`));
  if (!base) return null;
  if (!opts.includePrivate) return base;
  const overlay = readOverlay(slug);
  if (!overlay) return base;
  return {
    ...base,
    players: base.players.map((p) => ({ ...p, ...(overlay.players?.[p.id] ?? {}) })),
    guardians: base.guardians.map((g) => ({ ...g, ...(overlay.guardians?.[g.id] ?? {}) })),
  };
}

export function loadTeamByShareCode(code: string): TeamData | null {
  for (const slug of listTeamSlugs()) {
    const t = loadTeam(slug, { includePrivate: false });
    if (t && t.team.shareCode.toLowerCase() === code.toLowerCase()) return t;
  }
  return null;
}

export function hasPrivateOverlay(slug: string): boolean {
  return readOverlay(slug) !== null;
}
