"use client";
import { useEffect, useMemo, useState } from "react";
import { buildRotation } from "@/lib/rotation/equalTime";
import { Button, Card, Chip } from "@/components/ui";

type P = { id: string; name: string; medical: string | null };

export function GameDay(props: { roster: P[]; playersOnField: number; periods: number; periodMinutes: number; periodUnit: string }) {
  const [present, setPresent] = useState<Set<string>>(new Set(props.roster.map((p) => p.id)));
  const [started, setStarted] = useState(false);
  const [period, setPeriod] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [field, setField] = useState(false);

  const rotation = useMemo(() => buildRotation({ playerIds: props.roster.filter((p) => present.has(p.id)).map((p) => p.id), playersOnField: props.playersOnField, periods: props.periods, periodMinutes: props.periodMinutes }), [present, props]);
  const name = (id: string) => props.roster.find((p) => p.id === id)?.name ?? id;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => { document.documentElement.dataset.fieldMode = field ? "on" : "off"; return () => { delete document.documentElement.dataset.fieldMode; }; }, [field]);

  const periodLen = props.periodMinutes * 60;
  const left = Math.max(0, periodLen - seconds);
  const mm = String(Math.floor(left / 60)).padStart(2, "0"); const ss = String(left % 60).padStart(2, "0");
  const cur = rotation.periods[period]; const nxt = rotation.periods[period + 1];

  if (!started) {
    return (
      <Card>
        <h2 className="text-lg">Who’s here?</h2>
        <p className="text-sm text-muted">Tap to toggle. Everyone defaults to present. The rotation updates as you go.</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {props.roster.map((p) => {
            const on = present.has(p.id);
            return (
              <li key={p.id}>
                <button onClick={() => setPresent((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })}
                  className={`tap w-full rounded-[var(--radius-card)] border px-3 text-left font-display font-bold ${on ? "border-team bg-team-soft" : "border-line bg-surface text-muted line-through"}`} aria-pressed={on}>
                  {on ? "✅" : "▢"} {p.name}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 rounded-lg bg-surface-2 p-3 text-sm">
          <p className="font-semibold">Equal time preview: {present.size} present, {props.playersOnField} on the field, target {Math.round(rotation.targetMinutes)} min each.</p>
          {rotation.warnings.map((w) => <p key={w} className="text-warning">{w}</p>)}
        </div>
        <Button className="mt-4 w-full" onClick={() => setStarted(true)} disabled={present.size === 0}>Start game</Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_300px]">
      <Card tone="team" className="text-center">
        <p className="text-sm uppercase tracking-wide opacity-80">{props.periodUnit} {period + 1} of {props.periods}</p>
        <p className="tabular font-display text-[56px] font-extrabold leading-none md:text-7xl" aria-live="polite">{mm}:{ss}</p>
        <div className="mt-3 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => setRunning((r) => !r)}>{running ? "Pause" : seconds ? "Resume" : "Start clock"}</Button>
          <Button variant="secondary" onClick={() => { setSeconds(0); setRunning(false); setPeriod((p) => Math.min(props.periods - 1, p + 1)); }} disabled={period >= props.periods - 1}>Next {props.periodUnit} →</Button>
        </div>
        <button className="mt-3 text-sm underline opacity-80" onClick={() => setField((f) => !f)}>{field ? "Exit field mode" : "☀️ Field mode (bigger, brighter)"}</button>
      </Card>

      <Card className="md:row-span-2">
        <h2 className="text-lg">Minutes today</h2>
        <ul className="mt-2 divide-y divide-line text-sm">
          {Object.entries(rotation.minutesToday).sort((a, b) => b[1] - a[1]).map(([id, m]) => (
            <li key={id} className="flex justify-between py-1.5"><span>{name(id)}</span><span className="tabular font-semibold">{m}′</span></li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">Planned across all {props.periods} {props.periodUnit}s. Spread: {rotation.maxSpread} min.</p>
      </Card>

      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-base">On the field</h2>
            <ul className="mt-2 space-y-2">{cur?.onField.map((id) => <li key={id} className="tap flex items-center rounded-lg bg-team-soft px-3 font-display font-bold">{name(id)}</li>)}</ul>
          </div>
          <div>
            <h2 className="text-base">Bench</h2>
            <ul className="mt-2 space-y-2">{cur?.bench.map((id) => <li key={id} className="tap flex items-center rounded-lg bg-surface-2 px-3 font-display font-bold text-muted">{name(id)}</li>)}
              {cur?.bench.length === 0 && <li className="text-sm text-muted">Everyone’s playing.</li>}</ul>
          </div>
        </div>
        {nxt && (
          <div className="mt-4 rounded-lg border border-line p-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Next {props.periodUnit}</p>
            <p className="mt-1">
              <Chip tone="success">In: {nxt.onField.filter((id) => !cur.onField.includes(id)).map(name).join(", ") || "—"}</Chip>{" "}
              <Chip tone="warning">Out: {cur.onField.filter((id) => !nxt.onField.includes(id)).map(name).join(", ") || "—"}</Chip>
            </p>
          </div>
        )}
        {rotation.warnings.map((w) => <p key={w} className="mt-2 text-sm text-warning">{w}</p>)}
        <button className="mt-3 text-sm text-muted underline" onClick={() => { setStarted(false); setPeriod(0); setSeconds(0); setRunning(false); }}>Edit attendance</button>
      </Card>
    </div>
  );
}
