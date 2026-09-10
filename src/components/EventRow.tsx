import Link from "next/link";
import type { TeamEvent } from "@/lib/types";
import { KIND_ICON, KIND_LABEL, fmtDate, fmtTime } from "@/lib/format";
import { Chip } from "@/components/ui";

export function EventRow({ e, href, snack }: { e: TeamEvent; href?: string; snack?: string }) {
  const inner = (
    <div className="tap flex items-center gap-3 py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xl" aria-hidden>{KIND_ICON[e.kind]}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold">{e.title}</p>
        <p className="truncate text-sm text-muted">
          {fmtDate(e.date)} · {e.kind === "rainDate" || e.kind === "pictureDay" ? KIND_LABEL[e.kind] : fmtTime(e.startTime)}{e.location ? ` · ${e.location}` : ""}
        </p>
        {snack && <p className="text-sm text-muted">🍊 Snack: {snack}</p>}
      </div>
      {e.status === "tentative" && <Chip tone="warning">Tentative</Chip>}
      {e.status === "cancelled" && <Chip tone="danger">Cancelled</Chip>}
    </div>
  );
  return href ? <Link href={href} className="block border-b border-line last:border-0">{inner}</Link> : <div className="border-b border-line last:border-0">{inner}</div>;
}
