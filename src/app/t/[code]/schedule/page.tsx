import { getPublicTeam } from "@/lib/data/getPublicTeam";
import { weekKey, fmtDate } from "@/lib/format";
import { Card, Chip, PageHeader } from "@/components/ui";
import { EventRow } from "@/components/EventRow";

export default async function PublicSchedule({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const d = getPublicTeam(code);
  const dated = d.events.filter((e) => e.date).sort((a, b) => a.date!.localeCompare(b.date!));
  const undated = d.events.filter((e) => !e.date);
  const weeks = new Map<string, typeof dated>();
  for (const e of dated) { const k = weekKey(e.date!); weeks.set(k, [...(weeks.get(k) ?? []), e]); }
  return (
    <>
      <PageHeader title="Schedule" subtitle={d.season.name} />
      {undated.length > 0 && <Card tone="muted" className="mb-4"><p className="font-display font-bold">Date TBD</p><div className="mt-2 flex flex-wrap gap-2">{undated.map((e) => <Chip key={e.id} tone="warning">{e.title}</Chip>)}</div></Card>}
      {[...weeks.entries()].map(([wk, evs]) => (
        <Card key={wk} className="mb-4"><h2 className="text-base text-muted">Week of {fmtDate(wk, { month: "long", day: "numeric" })}</h2>{evs.map((e) => <EventRow key={e.id} e={e} snack={e.snack} />)}</Card>
      ))}
    </>
  );
}
