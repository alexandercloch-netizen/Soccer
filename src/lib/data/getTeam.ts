import "server-only";
import { notFound } from "next/navigation";
import { loadTeam } from "./repo";
import { getTemplate, currentAgeBand } from "@/lib/sports/templates";

/** Coach views: private overlay included. Guardian contacts never leave server components. */
export function getCoachTeam(slug: string) {
  const data = loadTeam(slug, { includePrivate: true });
  if (!data) notFound();
  const template = getTemplate(data.team.sportTemplateId);
  return { ...data, template, ageBand: currentAgeBand(template), guardianById: new Map(data.guardians.map((g) => [g.id, g])) };
}
