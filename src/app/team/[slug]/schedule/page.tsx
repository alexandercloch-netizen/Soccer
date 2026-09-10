import { getCoachTeam } from "@/lib/data/getTeam";
import { weekKey, fmtDate } from "@/lib/format";
import { Card, PageHeader, Chip } from "@/components/ui";
import { EventRow } from "@/components/EventRow";

export default async function Schedule({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getCoachTeam(slug);
  const base = `/team/${slug}`;
  const dated = d.events.filter((e) => e.date).sort((a, b) => a.date!.localeCompare(b.date!));
  const undated = d.events.filter((e) => !e.date);
  const weeks = new Map<string, typeof dated>();
  for (const e of dated) { const k = weekKey(e.date!); weeks.set(k, [...(weeks.get(k) ?? []), e]); }

  return (
    <>
      <PageHeader title="Schedule" subtitle={`${d.season.name} · ${dated.filter((e) => e.kind === "game").length} games, ${dated.filter((e) => e.kind === "practice").length} practices`} />
      {undated.length > 0 && (
        <Card tone="muted" className="mb-4">
          <p className="font-display font-bold">Held by the club, date TBD</p>
          <div className="mt-2 flex flex-wrap gap-2">{undated.map((e) => <Chip key={e.id} tone="warning">{e.title}</Chip>)}</div>
          <p className="mt-2 text-sm text-muted">Rain dates are Sundays and are only used if a game is cancelled. Picture day lands on a game weekend.</p>
        </Card>
      )}
      {[...weeks.entries()].map(([wk, evs]) => (
        <Card key={wk} className="mb-4">
          <h2 className="text-base text-muted">Week of {fmtDate(wk, { month: "long", day: "numeric" })}</h2>
          {evs.map((e) => (
            <EventRow key={e.id} e={e} href={e.kind === "game" ? `${base}/game/${e.id}` : undefined}
              snack={e.snackGuardianId ? d.guardianById.get(e.snackGuardianId)?.name : undefined} />
          ))}
        </Card>
      ))}
    </>
  );
}
