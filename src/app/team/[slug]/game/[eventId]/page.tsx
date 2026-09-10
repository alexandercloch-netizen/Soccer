import { notFound } from "next/navigation";
import { getCoachTeam } from "@/lib/data/getTeam";
import { fmtDate, fmtTime } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { GameDay } from "./GameDay";

export default async function GamePage({ params }: { params: Promise<{ slug: string; eventId: string }> }) {
  const { slug, eventId } = await params;
  const d = getCoachTeam(slug);
  const ev = d.events.find((e) => e.id === eventId);
  if (!ev) notFound();
  const snack = ev.snackGuardianId ? d.guardianById.get(ev.snackGuardianId)?.name : undefined;
  const roster = d.players.filter((p) => p.status !== "unregistered").map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName.charAt(0)}.`, medical: p.medicalNotes ?? null }));
  const gf = d.template.gameFormat;
  return (
    <>
      <PageHeader title={`${ev.title}${ev.homeAway ? ` (${ev.homeAway})` : ""}`} subtitle={`${fmtDate(ev.date, { weekday: "long", month: "long", day: "numeric" })} · ${fmtTime(ev.startTime)}${ev.endTime ? `–${fmtTime(ev.endTime)}` : ""}${ev.arriveTime ? ` · arrive ${fmtTime(ev.arriveTime)}` : ""} · ${ev.location ?? ""}`} />
      {d.team.gameVenue && (
        <Card className="mb-4 text-sm">
          <p className="font-display font-bold">📍 {d.team.gameVenue.name}</p>
          {d.team.gameVenue.address && <a className="text-link underline" href={`https://maps.google.com/?q=${encodeURIComponent(d.team.gameVenue.address)}`}>{d.team.gameVenue.address}</a>}
          {d.team.gameVenue.directions && <p className="mt-1 text-muted">{d.team.gameVenue.directions}</p>}
        </Card>
      )}
      <Card tone="muted" className="mb-4 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>🏟️ {gf.label}</span>
          <span>⏱️ {gf.periods} × {gf.periodMinutes ?? "?"} min {gf.periodUnit}s</span>
          {snack && <span>🍊 Snack: {snack}</span>}
          {!gf.keepScore && <span>🙌 No score kept</span>}
        </div>
        {roster.some((r) => r.medical) && <p className="mt-2 font-semibold text-danger">⚕️ Medical notes on file: {roster.filter((r) => r.medical).map((r) => r.name).join(", ")}</p>}
      </Card>
      <GameDay roster={roster} playersOnField={gf.playersOnField} periods={gf.periods} periodMinutes={gf.periodMinutes ?? 1} periodUnit={gf.periodUnit} />
    </>
  );
}
