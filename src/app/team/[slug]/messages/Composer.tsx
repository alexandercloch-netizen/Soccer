"use client";
import { useState } from "react";
import { Button, Card } from "@/components/ui";

const TONES = ["warm", "brief", "urgent", "celebratory"] as const;

export function Composer(props: { teamName: string; sportTemplateId: string; coaches: string[]; aiOn: boolean; bcc: string[] }) {
  const [tone, setTone] = useState<(typeof TONES)[number]>("warm");
  const [context, setContext] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function draft() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/ai/message-draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...props, tone, context }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSubject(json.subject); setBody(json.body);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }
  const mailto = `mailto:?bcc=${encodeURIComponent(props.bcc.join(","))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Card>
      <label className="block text-sm font-semibold">What’s this about?
        <textarea className="mt-1 w-full rounded-lg border border-line bg-surface p-3" rows={3} value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. Practice cancelled Wednesday for lightning; make-up is Sunday 3pm at Stone Fence Farm." />
      </label>
      <div className="mt-2 flex flex-wrap gap-1">
        {TONES.map((t) => <button key={t} onClick={() => setTone(t)} className={`rounded-lg px-3 py-1 text-sm font-semibold ${tone === t ? "bg-team text-on-team" : "bg-surface-2"}`}>{t}</button>)}
        {props.aiOn && <Button className="ml-auto" onClick={draft} disabled={busy || !context}>{busy ? "Drafting…" : "✨ Draft it"}</Button>}
      </div>
      {err && <p className="mt-2 text-sm text-danger">{err}</p>}
      <input className="mt-3 w-full rounded-lg border border-line bg-surface p-3 font-semibold" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject" />
      <textarea className="mt-2 w-full rounded-lg border border-line bg-surface p-3" rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" aria-label="Message" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button href={mailto}>Open in email (BCC {props.bcc.length} families)</Button>
        <Button variant="secondary" onClick={() => navigator.clipboard.writeText(`${subject}\n\n${body}`)}>Copy as text</Button>
      </div>
    </Card>
  );
}
