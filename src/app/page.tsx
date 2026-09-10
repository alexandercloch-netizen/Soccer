import Link from "next/link";
import { listTeamSlugs, loadTeam } from "@/lib/data/repo";
import { teamStyle } from "@/lib/theme";
import { Card } from "@/components/ui";

export default function Home() {
  const teams = listTeamSlugs().map((s) => loadTeam(s, { includePrivate: false })!).filter(Boolean);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl">GoodSport</h1>
      <p className="mt-1 text-muted">Run a youth rec team from your phone. Any sport, any season.</p>
      <h2 className="mt-8 text-lg">Your teams</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {teams.map(({ team, season, org }) => (
          <li key={team.id} style={teamStyle(team.theme)}>
            <Link href={`/team/${team.slug}`} className="block">
              <Card tone="team" className="hover:opacity-95">
                <p className="text-3xl" aria-hidden>{team.theme.crestEmoji}</p>
                <p className="mt-2 font-display text-xl font-extrabold">{team.name}</p>
                <p className="text-sm opacity-85">{season.name} · {org.name}</p>
              </Card>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/team/new" className="block">
            <Card tone="muted" className="h-full border-dashed hover:bg-surface">
              <p className="text-3xl" aria-hidden>➕</p>
              <p className="mt-2 font-display text-xl font-extrabold">New team or season</p>
              <p className="text-sm text-muted">Paste the club’s roster email and let the setup wizard do the typing.</p>
            </Card>
          </Link>
        </li>
      </ul>
    </main>
  );
}
