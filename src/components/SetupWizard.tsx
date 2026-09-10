"use client";
import { useState } from "react";
import type { SeasonSetup } from "@/lib/ai/schemas";
import { Button, Card, Chip } from "@/components/ui";

type F = { value: string | number | null; confidence: "high" | "medium" | "low"; source: string | null; note: string | null };
const Cell = ({ f }: { f: F }) => (
  <td className={`px-2 py-1 align-top ${f.confidence === "low" ? "bg-danger/10" : f.confidence === "medium" ? "bg-warning/10" : ""}`} title={f.source ? `Source: “${f.source}”` : f.note ?? "inferred"}>
    {f.value ?? <span className="text-muted">—</span>}
  </td>
);

export function SetupWizard(props: { aiOn: boolean; templates: { id: string; name: string }[]; defaultTemplate: string; seasonYear: number }) {
  const [step, setStep] = useState(0);
  const [tpl, setTpl] = useState(props.defaultTemplate);
  const [roster, setRoster] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<SeasonSetup | null>(null);

  async function run() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/ai/season-setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rosterText: roster, welcomeEmailText: email, sportTemplateId: tpl, seasonYear: props.seasonYear }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json); setStep(2);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }

  const steps = ["Sport", "Paste", "Review", "Save"];
  return (
    <>
      <ol className="mb-4 flex gap-2 text-sm">{steps.map((s, i) => <li key={s}><Chip tone={i === step ? "team" : "neutral"}>{i + 1}. {s}</Chip></li>)}</ol>
      {step === 0 && (
        <Card>
          <label className="block font-semibold">Sport & format
            <select className="mt-1 w-full rounded-lg border border-line bg-surface p-3" value={tpl} onChange={(e) => setTpl(e.target.value)}>
              {props.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <p className="mt-2 text-sm text-muted">The template controls players on the field, period structure, positions, gear, and the words the app uses. Add a new sport by adding a template; no code changes.</p>
          <Button className="mt-4" onClick={() => setStep(1)}>Next →</Button>
        </Card>
      )}
      {step === 1 && (
        <Card>
          {!props.aiOn && <p className="mb-3 rounded-lg bg-warning/15 p-3 text-sm">AI is off (no API key). Paste is still useful as a record; enter players by editing <code>data/teams/&lt;slug&gt;.json</code> for now.</p>}
          <label className="block font-semibold">Registration export (paste rows)
            <textarea className="mt-1 w-full rounded-lg border border-line bg-surface p-3 font-mono text-sm" rows={10} value={roster} onChange={(e) => setRoster(e.target.value)} placeholder="Paste the club's roster export here. Messy is fine." />
          </label>
          <label className="mt-3 block font-semibold">Welcome email / league info
            <textarea className="mt-1 w-full rounded-lg border border-line bg-surface p-3 text-sm" rows={8} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Practice day/time, first practice, gear list, game window, rain dates, picture day…" />
          </label>
          {err && <p className="mt-2 text-sm text-danger">{err}</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
            <Button onClick={run} disabled={busy || !props.aiOn || (!roster && !email)}>{busy ? "Reading…" : "✨ Extract with AI"}</Button>
          </div>
        </Card>
      )}
      {step === 2 && result && (
        <div className="space-y-4">
          {result.warnings.length > 0 && (
            <Card tone="muted">
              <p className="font-display font-bold">Check these first</p>
              <ul className="mt-1 list-disc pl-5 text-sm">{result.warnings.map((w, i) => <li key={i}><Chip tone="warning">{w.code}</Chip> {w.message}</li>)}</ul>
            </Card>
          )}
          <Card>
            <h2 className="text-lg">Players ({result.players.length})</h2>
            <p className="text-xs text-muted">Hover a cell for its source. Red = low confidence or removed, amber = medium. Contacts whose source wasn’t found in your paste were cleared.</p>
            <div className="overflow-x-auto"><table className="mt-2 w-full text-sm"><thead><tr className="text-left text-muted"><th className="px-2">First</th><th className="px-2">Last</th><th className="px-2">Grade</th><th className="px-2">Shirt</th><th className="px-2">Status</th><th className="px-2">Guardians</th></tr></thead>
              <tbody>{result.players.map((p) => (
                <tr key={p.tempId} className="border-t border-line"><Cell f={p.firstName} /><Cell f={p.lastName} /><Cell f={p.grade} /><Cell f={p.shirtSize} />
                  <td className="px-2 py-1">{p.status !== "registered" ? <Chip tone="warning">{p.status}</Chip> : "registered"}</td>
                  <td className="px-2 py-1">{p.guardianTempIds.map((id) => result.guardians.find((g) => g.tempId === id)?.name.value).filter(Boolean).join(", ") || <Chip tone="danger">needs a parent</Chip>}</td></tr>
              ))}</tbody></table></div>
          </Card>
          <Card>
            <h2 className="text-lg">Guardians ({result.guardians.length})</h2>
            <div className="overflow-x-auto"><table className="mt-2 w-full text-sm"><thead><tr className="text-left text-muted"><th className="px-2">Name</th><th className="px-2">Phone</th><th className="px-2">Email</th></tr></thead>
              <tbody>{result.guardians.map((g) => <tr key={g.tempId} className="border-t border-line"><Cell f={g.name} /><Cell f={g.phone} /><Cell f={g.email} /></tr>)}</tbody></table></div>
          </Card>
          <Card>
            <h2 className="text-lg">Events ({result.events.length})</h2>
            <div className="overflow-x-auto"><table className="mt-2 w-full text-sm"><thead><tr className="text-left text-muted"><th className="px-2">Kind</th><th className="px-2">Title</th><th className="px-2">Date</th><th className="px-2">Time</th><th className="px-2">Repeats</th><th className="px-2">Where</th></tr></thead>
              <tbody>{result.events.map((e, i) => <tr key={i} className="border-t border-line"><td className="px-2 py-1">{e.kind}</td><Cell f={e.title} /><Cell f={e.date} /><Cell f={e.startTime} /><Cell f={e.recurrence} /><Cell f={e.location} /></tr>)}</tbody></table></div>
          </Card>
          <Card>
            <h2 className="text-lg">Gear & rules</h2>
            <ul className="mt-1 list-disc pl-5 text-sm">{result.gear.map((g, i) => <li key={i}>{g.item.value} <span className="text-muted">({g.providedBy})</span></li>)}</ul>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted">{result.rules.map((r, i) => <li key={i}>{r.value}</li>)}</ul>
          </Card>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>← Edit paste</Button>
            <Button onClick={() => { navigator.clipboard.writeText(JSON.stringify(result, null, 2)); setStep(3); }}>Copy reviewed JSON →</Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <Card>
          <p className="font-display text-lg font-bold">Reviewed data copied</p>
          <p className="mt-1 text-sm text-muted">Saving straight to the database lands in phase 2 (auth + Postgres). For now, paste the JSON into <code>data/teams/&lt;slug&gt;.json</code> (public-safe fields) and <code>data/private/&lt;slug&gt;.contacts.json</code> (contacts), following the existing files’ shape.</p>
        </Card>
      )}
    </>
  );
}
