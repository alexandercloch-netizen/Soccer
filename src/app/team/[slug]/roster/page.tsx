import { getCoachTeam } from "@/lib/data/getTeam";
import { hasPrivateOverlay } from "@/lib/data/repo";
import { Avatar, Card, Chip, PageHeader } from "@/components/ui";

export default async function Roster({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getCoachTeam(slug);
  const priv = hasPrivateOverlay(slug);
  return (
    <>
      <PageHeader title="Roster" subtitle={`${d.players.length} players · contacts visible to coaches only`} />
      {!priv && (
        <Card tone="muted" className="mb-4 text-sm">
          <p className="font-display font-bold">Contacts not loaded</p>
          <p className="text-muted">Guardian phone numbers, emails, and birthdays live in <code>data/private/{slug}.contacts.json</code>, which is never committed. Copy the example file there to see them here.</p>
        </Card>
      )}
      <ul className="grid gap-3 md:grid-cols-2">
        {d.players.map((p) => {
          const gs = p.guardianIds.map((id) => d.guardianById.get(id)).filter(Boolean);
          return (
            <li key={p.id}>
              <Card className="h-full">
                <div className="flex items-start gap-3">
                  <Avatar name={`${p.firstName} ${p.lastName}`} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-extrabold">{p.firstName} {p.lastName}{p.lastName.length === 1 ? "." : ""}</p>
                    <p className="text-sm text-muted">{[p.grade, p.school, p.shirtSize].filter(Boolean).join(" · ") || "Details pending"}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.status !== "registered" && <Chip tone="warning">{p.status === "unregistered" ? "Not registered" : "Unclear"}</Chip>}
                      {p.medicalNotes && <Chip tone="danger">⚕️ Medical note</Chip>}
                    </div>
                  </div>
                </div>
                {p.availabilityNotes && <p className="mt-3 text-sm"><span className="text-muted">Availability:</span> {p.availabilityNotes}</p>}
                {p.coachNotes && <p className="mt-1 text-sm"><span className="text-muted">Note:</span> {p.coachNotes}</p>}
                <div className="mt-3 border-t border-line pt-3">
                  {gs.map((g) => (
                    <div key={g!.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-semibold">{g!.name}</span>
                      {g!.phone && <a className="tap inline-flex items-center text-team underline" href={`tel:${g!.phone.replace(/\D/g, "")}`}>{g!.phone}</a>}
                      {g!.email && <a className="tap inline-flex items-center text-team underline" href={`mailto:${g!.email}`}>{g!.email}</a>}
                    </div>
                  ))}
                  {gs.length === 0 && <p className="text-sm text-warning">No guardian linked</p>}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}
