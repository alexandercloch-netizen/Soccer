import { getPublicTeam } from "@/lib/data/getPublicTeam";
import { Avatar, Card, PageHeader } from "@/components/ui";

export default async function PublicRoster({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const d = getPublicTeam(code);
  return (
    <>
      <PageHeader title="Team" subtitle={`${d.players.length} players · coaches ${d.team.coaches.map((c) => c.name).join(" & ")}`} />
      <Card>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {d.players.map((p) => <li key={p.id} className="flex items-center gap-2"><Avatar name={p.name} /><span className="font-display font-bold">{p.name}</span></li>)}
        </ul>
      </Card>
    </>
  );
}
