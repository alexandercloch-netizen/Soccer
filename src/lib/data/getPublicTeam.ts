import "server-only";
import { notFound } from "next/navigation";
import { loadTeamByShareCode } from "./repo";
import { getTemplate } from "@/lib/sports/templates";
import { publicName } from "@/lib/types";

/** Public projection: no guardians, no DOB, no medical or coach notes. */
export function getPublicTeam(code: string) {
  const d = loadTeamByShareCode(code);
  if (!d) notFound();
  const firstNames = new Map(d.guardians.map((g) => [g.id, g.name.split(" ")[0]]));
  return {
    org: d.org, season: d.season, team: d.team, template: getTemplate(d.team.sportTemplateId),
    events: d.events.map((e) => ({ ...e, snack: e.snackGuardianId ? firstNames.get(e.snackGuardianId) : undefined })),
    players: d.players.filter((p) => p.status === "registered").map((p) => ({ id: p.id, name: publicName(p) })),
    announcements: d.announcements,
  };
}
