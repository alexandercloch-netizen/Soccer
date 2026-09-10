import { getCoachTeam } from "@/lib/data/getTeam";
import { upcoming, fmtDate, fmtTime, KIND_ICON } from "@/lib/format";
import { Button, Card, Chip, PageHeader } from "@/components/ui";
import { EventRow } from "@/components/EventRow";
import { aiEnabled } from "@/lib/ai/provider";

export default async function ThisWeek({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getCoachTeam(slug);
  const base = `/team/${slug}`;
  const next = upcoming(d.events);
  const hero = next[0];
  const snack = hero?.snackGuardianId ? d.guardianById.get(hero.snackGuardianId)?.name : undefined;
  const unregistered = d.players.filter((p) => p.status !== "registered");
  const tbd = d.events.filter((e) => e.kind === "game" && !e.startTime);
  const undated = d.events.filter((e) => !e.date && e.status !== "cancelled");
  const registered = d.players.filter((p) => p.status === "registered").length;

  return (
    <>
      <PageHeader title="This week" subtitle={`${d.season.name} · ${d.template.name}`} />
      {hero ? (
        <Card tone="team">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Next up</p>
          <p className="mt-1 font-display text-2xl font-extrabold md:text-3xl">{KIND_ICON[hero.kind]} {hero.title}</p>
          <p className="mt-1 text-lg">{fmtDate(hero.date, { weekday: "long", month: "long", day: "numeric" })} · {fmtTime(hero.startTime)}{hero.endTime ? `–${fmtTime(hero.endTime)}` : ""}</p>
          {hero.arriveTime && <p className="opacity-90">⏰ Arrive {fmtTime(hero.arriveTime)}{hero.homeAway ? ` · ${hero.homeAway === "home" ? "Home" : "Away"}` : ""}</p>}
          {hero.location && <p className="opacity-90">📍 {hero.location}</p>}
          {snack && <p className="opacity-90">🍊 Snack: {snack}</p>}
          {hero.notes && <p className="mt-2 text-sm opacity-90">{hero.notes}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {hero.kind === "game" && <Button href={`${base}/game/${hero.id}`} variant="secondary">Open Game Day</Button>}
            {hero.kind === "practice" && <Button href={`${base}/practice?event=${hero.id}`} variant="secondary">Plan this practice</Button>}
          </div>
        </Card>
      ) : (
        <Card tone="muted"><p className="font-display font-bold">Season complete.</p><p className="text-muted">Time for certificates and a thank-you note.</p></Card>
      )}

      <h2 className="mt-6 text-lg">Needs attention</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {unregistered.map((p) => <Chip key={p.id} tone="warning">⚠️ {p.firstName} not registered</Chip>)}
        {tbd.length > 0 && <Chip tone="info">🕒 {tbd.length} game times still TBD</Chip>}
        {undated.map((e) => <Chip key={e.id} tone="neutral">📌 {e.title}: date TBD</Chip>)}
        {d.events.filter((e) => e.kind === "game" && !e.snackGuardianId).length > 0 && <Chip tone="warning">🍊 Games without a snack parent</Chip>}
        {!aiEnabled() && <Chip tone="neutral">✨ AI off (no API key). Manual tools still work.</Chip>}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg">Coming up</h2>
          <div className="mt-2">{next.slice(1, 5).map((e) => <EventRow key={e.id} e={e} href={e.kind === "game" ? `${base}/game/${e.id}` : `${base}/schedule`} />)}</div>
          <Button href={`${base}/schedule`} variant="ghost" className="mt-2">Full schedule →</Button>
        </Card>
        <Card>
          <h2 className="text-lg">Team at a glance</h2>
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted">Players</dt><dd className="font-display text-2xl font-extrabold">{registered}<span className="text-base text-muted"> / {d.players.length}</span></dd></div>
            <div><dt className="text-muted">Format</dt><dd className="font-display text-xl font-extrabold">{d.template.gameFormat.label}</dd></div>
            <div><dt className="text-muted">Coaches</dt><dd>{d.team.coaches.map((c) => c.name).join(", ")}</dd></div>
            <div><dt className="text-muted">Home {d.template.vocabulary.venue}</dt><dd>{d.team.homeVenue}</dd></div>
          </dl>
          {d.team.gameVenue && (<><h3 className="mt-4 font-display font-bold">Game {d.template.vocabulary.venue}</h3><p className="text-sm">{d.team.gameVenue.name}</p><p className="text-sm text-muted">{d.team.gameVenue.directions}</p></>)}
          {d.team.scheduleImage && <Button href={d.team.scheduleImage} variant="ghost" className="mt-2 px-0">Parent schedule graphic →</Button>}
          <h3 className="mt-4 font-display font-bold">Every-week gear</h3>
          <ul className="mt-1 list-disc pl-5 text-sm">{d.template.gear.player.map((g) => <li key={g}>{g}</li>)}</ul>
        </Card>
      </div>
    </>
  );
}
