import { getCoachTeam } from "@/lib/data/getTeam";
import { SPORT_TEMPLATES } from "@/lib/sports/templates";
import { onColor } from "@/lib/theme";
import { Card, Chip, PageHeader } from "@/components/ui";

export default async function Settings({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getCoachTeam(slug);
  return (
    <>
      <PageHeader title="Team settings" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg">Identity</h2>
          <dl className="mt-2 space-y-2 text-sm">
            <div><dt className="text-muted">Name</dt><dd className="font-semibold">{d.team.name}</dd></div>
            <div><dt className="text-muted">League</dt><dd>{d.team.league}</dd></div>
            <div><dt className="text-muted">Organization</dt><dd>{d.org.name} · {d.org.contactEmail}</dd></div>
            <div><dt className="text-muted">Colors</dt><dd className="flex items-center gap-2"><span className="inline-block h-6 w-6 rounded-full border border-line" style={{ background: d.team.theme.primary }} />{d.team.theme.primary} · text {onColor(d.team.theme.primary)} (auto-contrast)</dd></div>
            <div><dt className="text-muted">Coaches</dt><dd>{d.team.coaches.map((c) => `${c.name} (${c.role})`).join(", ")}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted">Edit in <code>data/teams/{slug}.json</code>. Colors and crest are the only team-specific styling; everything else is the neutral base.</p>
        </Card>
        <Card>
          <h2 className="text-lg">Sport template</h2>
          <p className="font-semibold">{d.template.name}</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>👥 {d.template.gameFormat.playersOnField} on the {d.template.vocabulary.venue} · {d.template.gameFormat.periods} {d.template.gameFormat.periodUnit}s{d.template.gameFormat.periodMinutes ? ` × ${d.template.gameFormat.periodMinutes} min` : ""}</li>
            <li>🔁 Rotation: {d.template.rotationModel.replace("_", " ")}</li>
            <li>📍 Positions: {d.template.positions.length ? d.template.positions.map((p) => p.label).join(", ") : "none at this age"}</li>
            <li>🏷️ Words: {d.template.vocabulary.session} / {d.template.vocabulary.contest} / {d.template.vocabulary.scoreUnit}</li>
          </ul>
          <h3 className="mt-3 font-display font-bold">Available templates</h3>
          <div className="mt-1 flex flex-wrap gap-1">{Object.values(SPORT_TEMPLATES).map((t) => <Chip key={t.id} tone={t.id === d.template.id ? "team" : "neutral"}>{t.name}</Chip>)}</div>
        </Card>
        <Card>
          <h2 className="text-lg">Sharing</h2>
          <p className="text-sm">Parents’ read-only page (first names + last initials, no contacts):</p>
          <p className="mt-1 font-mono text-sm">/t/{d.team.shareCode}</p>
          <p className="mt-2 text-xs text-muted">Rotate the share code each season by editing the team file.</p>
        </Card>
        <Card>
          <h2 className="text-lg">Privacy</h2>
          <ul className="list-disc pl-5 text-sm">
            <li>Guardian contacts, birthdays, and medical notes are read from a gitignored private file and rendered only in coach views.</li>
            <li>Public pages never receive contact data (separate projection, not hidden UI).</li>
            <li>AI never invents contacts: fields whose source text isn’t in your paste are cleared.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
