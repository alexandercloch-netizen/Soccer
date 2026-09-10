import type { TeamEvent, EventKind } from "@/lib/types";

export const KIND_LABEL: Record<EventKind, string> = { practice: "Practice", game: "Game", rainDate: "Rain date", pictureDay: "Picture day", party: "Party", other: "Event" };
export const KIND_ICON: Record<EventKind, string> = { practice: "🎯", game: "🏆", rainDate: "🌧️", pictureDay: "📸", party: "🎉", other: "📌" };

export function parseLocalDate(d: string): Date { const [y, m, day] = d.split("-").map(Number); return new Date(y, m - 1, day); }
export function fmtDate(d: string | null, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }): string {
  return d ? parseLocalDate(d).toLocaleDateString("en-US", opts) : "Date TBD";
}
export function fmtTime(t?: string): string {
  if (!t) return "Time TBD";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""} ${ampm}`;
}
export function todayIso(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
export function upcoming<T extends TeamEvent>(events: T[], from = todayIso()): T[] {
  return events.filter((e) => e.date && e.date >= from && e.status !== "cancelled").sort((a, b) => (a.date! + (a.startTime ?? "")).localeCompare(b.date! + (b.startTime ?? "")));
}
export function weekKey(d: string): string {
  const dt = parseLocalDate(d); const day = dt.getDay(); const mon = new Date(dt); mon.setDate(dt.getDate() - ((day + 6) % 7));
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}
