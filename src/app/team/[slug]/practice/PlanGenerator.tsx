"use client";
import { useState } from "react";
import type { Activity } from "@/lib/data/activities";
import type { PracticePlan } from "@/lib/ai/schemas";
import { Button, Card, Chip } from "@/components/ui";

type Block = { activityId: string; name: string; minutes: number; coachingPoints?: string[]; setup?: string };

export function PlanGenerator(props: { slug: string; sportTemplateId: string; playerCount: number; coachCount: number; tags: string[]; aiOn: boolean; initialBlocks: Block[]; library: Activity[] }) {
  const [blocks, setBlocks] = useState<Block[]>(props.initialBlocks);
  const [focus, setFocus] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [runIdx, setRunIdx] = useState<number | null>(null);
  const total = blocks.reduce((s, b) => s + b.minutes, 0);
  const byId = new Map(props.library.map((a) => [a.id, a]));

  async function generate() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/ai/practice-plan", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sportTemplateId: props.sportTemplateId, playerCount: props.playerCount, coachCount: props.coachCount, minutes: 60, focus: focus.join(", ") || "fun and touches on the ball" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      const plan = json as PracticePlan;
      setBlocks(plan.blocks.map((b) => ({ activityId: b.activityId, name: b.name, minutes: b.minutes, coachingPoints: b.coachingPoints, setup: b.setup })));
      setWarnings(plan.warnings);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }
  function toggle(t: string) { setFocus((f) => (f.includes(t) ? f.filter((x) => x !== t) : [...f, t])); }
  function adjust(i: number, delta: number) { setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, minutes: Math.max(2, b.minutes + delta) } : b))); }
  function move(i: number, dir: -1 | 1) { setBlocks((bs) => { const n = [...bs]; const j = i + dir; if (j < 0 || j >= n.length) return bs; [n[i], n[j]] = [n[j], n[i]]; return n; }); }

  if (runIdx !== null) {
    const b = blocks[runIdx]; const a = byId.get(b.activityId);
    return (
      <Card tone="team" className="text-center">
        <p className="text-sm uppercase tracking-wide opacity-80">Block {runIdx + 1} of {blocks.length}</p>
        <p className="mt-2 font-display text-3xl font-extrabold">{b.name}</p>
        <p className="tabular mt-2 text-6xl font-extrabold">{b.minutes} min</p>
        {a && <p className="mx-auto mt-3 max-w-prose text-left text-sm opacity-90">{a.howToPlay}</p>}
        {(b.coachingPoints ?? a?.coachingPoints)?.length ? <ul className="mx-auto mt-3 max-w-prose list-disc pl-5 text-left text-sm opacity-90">{(b.coachingPoints ?? a?.coachingPoints)!.map((c) => <li key={c}>{c}</li>)}</ul> : null}
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => setRunIdx(Math.max(0, runIdx - 1))} disabled={runIdx === 0}>← Back</Button>
          {runIdx < blocks.length - 1 ? <Button variant="secondary" onClick={() => setRunIdx(runIdx + 1)}>Next →</Button> : <Button variant="secondary" onClick={() => setRunIdx(null)}>Did every kid smile? ✔</Button>}
        </div>
        <button className="mt-4 text-sm underline opacity-80" onClick={() => setRunIdx(null)}>Exit run mode</button>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg">Today’s plan <span className="text-muted">· {total} min</span></h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setRunIdx(0)}>▶ Run mode</Button>
            {props.aiOn && <Button onClick={generate} disabled={busy}>{busy ? "Thinking…" : "✨ Generate with AI"}</Button>}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {props.tags.map((t) => <button key={t} onClick={() => toggle(t)} className={`rounded-lg px-2 py-1 text-sm font-semibold ${focus.includes(t) ? "bg-team text-on-team" : "bg-surface-2"}`}>{t}</button>)}
          {!props.aiOn && <a className="self-center text-sm text-muted underline" href={`?focus=${focus.join(",")}`}>Rebuild default plan with focus</a>}
        </div>
        {err && <p className="mt-2 text-sm text-danger">{err}</p>}
        {warnings.map((w) => <p key={w} className="mt-2 text-sm text-warning">{w}</p>)}
        <ol className="mt-3 divide-y divide-line">
          {blocks.map((b, i) => (
            <li key={`${b.activityId}-${i}`} className="flex items-center gap-3 py-3">
              <span className="tabular w-14 shrink-0 font-display text-xl font-extrabold text-team">{b.minutes}′</span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold">{b.name}</p>
                {byId.get(b.activityId)?.story && <p className="text-sm text-muted">“{byId.get(b.activityId)!.story}”</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button className="tap w-10 rounded-lg bg-surface-2" aria-label="One minute less" onClick={() => adjust(i, -1)}>−</button>
                <button className="tap w-10 rounded-lg bg-surface-2" aria-label="One minute more" onClick={() => adjust(i, 1)}>+</button>
                <button className="tap w-10 rounded-lg bg-surface-2" aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
                <button className="tap w-10 rounded-lg bg-surface-2" aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <h2 className="text-lg">Activity library</h2>
        <p className="text-sm text-muted">Tap to add to the plan.</p>
        <ul className="mt-2 divide-y divide-line">
          {props.library.map((a) => (
            <li key={a.id}>
              <button className="tap w-full py-2 text-left" onClick={() => setBlocks((bs) => [...bs.slice(0, -1), { activityId: a.id, name: a.name, minutes: a.minutes }, bs[bs.length - 1]])}>
                <p className="font-semibold">{a.name} <span className="text-muted">· {a.minutes}′</span></p>
                <div className="mt-0.5 flex flex-wrap gap-1">{a.tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
