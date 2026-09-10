import { getCoachTeam } from "@/lib/data/getTeam";
import { defaultPlan, filterActivities } from "@/lib/data/activities";
import { aiEnabled } from "@/lib/ai/provider";
import { Card, PageHeader } from "@/components/ui";
import { PlanGenerator } from "./PlanGenerator";

export default async function Practice({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ event?: string; focus?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const d = getCoachTeam(slug);
  const present = d.players.filter((p) => p.status === "registered").length;
  const focus = sp.focus?.split(",").filter(Boolean);
  const plan = defaultPlan({ sportId: d.template.sportId, ageBandId: d.ageBand.id, playerCount: present, minutes: 60, maxBlockMinutes: d.ageBand.maxBlockMinutes, focusTags: focus });
  const library = filterActivities({ sportId: d.template.sportId, ageBandId: d.ageBand.id });
  const ev = sp.event ? d.events.find((e) => e.id === sp.event) : undefined;

  return (
    <>
      <PageHeader title={`${d.template.vocabulary.session[0].toUpperCase()}${d.template.vocabulary.session.slice(1)} plan`} subtitle={ev ? `${ev.title} · ${ev.date}` : `${d.ageBand.label} · ${present} players expected`} />
      <Card tone="muted" className="mb-4 text-sm">
        <p className="font-display font-bold">Age-band rules baked in</p>
        <p className="text-muted">{d.ageBand.guidance}</p>
      </Card>
      <PlanGenerator slug={slug} sportTemplateId={d.template.id} playerCount={present} coachCount={d.team.coaches.length} tags={d.template.activityTags} aiOn={aiEnabled()} initialBlocks={plan} library={library} />
    </>
  );
}
