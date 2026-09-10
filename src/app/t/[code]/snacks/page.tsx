import { getPublicTeam } from "@/lib/data/getPublicTeam";
import { fmtDate } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";

export default async function PublicSnacks({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const d = getPublicTeam(code);
  const games = d.events.filter((e) => e.kind === "game" && e.date).sort((a, b) => a.date!.localeCompare(b.date!));
  return (
    <>
      <PageHeader title="Snack rotation" subtitle="Swap with another family? Just tell the coaches." />
      <Card>
        <ul className="divide-y divide-line">
          {games.map((g) => <li key={g.id} className="flex items-center justify-between py-3"><span><span className="font-display font-bold">{g.title}</span><span className="block text-sm text-muted">{fmtDate(g.date)}</span></span><span className="font-semibold">🍊 {g.snack ?? "Open"}</span></li>)}
        </ul>
      </Card>
    </>
  );
}
