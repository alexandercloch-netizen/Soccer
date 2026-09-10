/** Deterministic test data for any sport template. Contacts are obviously fake. */
import type { Guardian, Player, TeamData, TeamEvent } from "@/lib/types";
import { getTemplate } from "@/lib/sports/templates";

export function makeTeam(opts: { sportTemplateId?: string; players?: number; games?: number; practices?: number; start?: string } = {}): TeamData {
  const tpl = getTemplate(opts.sportTemplateId ?? "soccer-u6");
  const n = opts.players ?? 8;
  const start = opts.start ?? "2026-09-12";
  const guardians: Guardian[] = Array.from({ length: n }, (_, i) => ({ id: `g${i + 1}`, name: `Parent${i + 1} Family${i + 1}`, phone: `(555) 01${String(i).padStart(2, "0")}`, email: `parent${i + 1}@example.com`, relationship: "parent" }));
  const players: Player[] = Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, teamId: "t1", firstName: `Kid${i + 1}`, lastName: `Family${i + 1}`, dob: `2021-01-${String(i + 1).padStart(2, "0")}`, photoConsent: false, status: "registered", guardianIds: [`g${i + 1}`], medicalNotes: i === 0 ? "Peanut allergy (fake)" : undefined }));
  const day = (offset: number) => { const d = new Date(start + "T12:00:00"); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
  const events: TeamEvent[] = [];
  for (let i = 0; i < (opts.games ?? 4); i++) events.push({ id: `e-g${i + 1}`, teamId: "t1", kind: "game", title: `vs Opp${i + 1}`, date: day(i * 7), startTime: "09:00", endTime: "09:45", arriveTime: "08:45", location: "Test Field 1", opponent: `Opp${i + 1}`, homeAway: i % 2 ? "home" : "away", status: "scheduled", snackGuardianId: i === 0 ? "g1" : undefined });
  for (let i = 0; i < (opts.practices ?? 4); i++) events.push({ id: `e-p${i + 1}`, teamId: "t1", kind: "practice", title: "Practice", date: day(i * 7 - 3), startTime: "17:00", endTime: "18:00", location: "Test Field 2", status: "scheduled" });
  return {
    org: { id: "o1", name: "Test Park District" },
    season: { id: "s1", orgId: "o1", name: "Test Season", startDate: day(-14), endDate: day(60) },
    team: { id: "t1", slug: "test-team", seasonId: "s1", sportTemplateId: tpl.id, name: "Test Team", theme: { primary: "#336699", accent: "#ffffff" }, shareCode: "testcode", coaches: [{ name: "Coach One", role: "owner" }] },
    players, guardians, events, attendance: [], announcements: [],
  };
}
