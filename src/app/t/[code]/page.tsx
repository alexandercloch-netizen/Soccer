import { getPublicTeam } from "@/lib/data/getPublicTeam";
import { upcoming, fmtDate, fmtTime, KIND_ICON } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { EventRow } from "@/components/EventRow";

export default async function PublicHome({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const d = getPublicTeam(code);
  const next = upcoming(d.events);
  const hero = next[0];
  return (
    <>
      <PageHeader title="This week" subtitle={`${d.team.name} · ${d.season.name}`} />
      {hero && (
        <Card tone="team">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Next up</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{KIND_ICON[hero.kind]} {hero.title}</p>
          <p className="mt-1 text-lg">{fmtDate(hero.date, { weekday: "long", month: "long", day: "numeric" })} · {fmtTime(hero.startTime)}{hero.endTime ? `–${fmtTime(hero.endTime)}` : ""}</p>
          {hero.arriveTime && <p className="opacity-90">⏰ Arrive {fmtTime(hero.arriveTime)}{hero.homeAway ? ` · ${hero.homeAway === "home" ? "Home" : "Away"}` : ""}</p>}
          {hero.location && <p className="opacity-90">📍 {hero.location}</p>}
          {hero.snack && <p className="opacity-90">🍊 Snack: {hero.snack}</p>}
        </Card>
      )}
      {d.team.gameVenue && (
        <Card className="mt-4">
          <h2 className="text-lg">Game day: where to go</h2>
          <p className="font-semibold">{d.team.gameVenue.name}</p>
          {d.team.gameVenue.address && <a className="text-link underline" href={`https://maps.google.com/?q=${encodeURIComponent(d.team.gameVenue.address)}`}>{d.team.gameVenue.address}</a>}
          {d.team.gameVenue.directions && <p className="mt-1 text-sm text-muted">{d.team.gameVenue.directions}</p>}
          {d.team.scheduleImage && (
            <a href={d.team.scheduleImage} className="mt-3 block overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.team.scheduleImage} alt={`${d.team.name} ${d.season.name} game schedule and field map`} className="w-full" loading="lazy" />
            </a>
          )}
        </Card>
      )}
      <Card className="mt-4">
        <h2 className="text-lg">Bring every week</h2>
        <ul className="mt-1 list-disc pl-5">{d.template.gear.player.map((g) => <li key={g}>{g}</li>)}</ul>
      </Card>
      <Card className="mt-4">
        <h2 className="text-lg">Coming up</h2>
        {next.slice(1, 5).map((e) => <EventRow key={e.id} e={e} snack={e.snack} />)}
      </Card>
      {d.announcements[0] && (
        <Card className="mt-4">
          <h2 className="text-lg">Latest from the coaches</h2>
          <p className="font-semibold">{d.announcements[0].subject}</p>
          <details className="mt-1 text-sm"><summary className="cursor-pointer text-link">Read</summary><pre className="mt-2 whitespace-pre-wrap font-body">{d.announcements[0].body}</pre></details>
        </Card>
      )}
    </>
  );
}
