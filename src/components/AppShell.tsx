import Link from "next/link";
import type { ReactNode } from "react";
import type { Team } from "@/lib/types";

const COACH_NAV = [
  { href: "", label: "Home", icon: "🏠" },
  { href: "/schedule", label: "Schedule", icon: "📅" },
  { href: "/roster", label: "Roster", icon: "👥" },
  { href: "/practice", label: "Practice", icon: "🎯" },
  { href: "/more", label: "More", icon: "⋯" },
];
const PARENT_NAV = [
  { href: "", label: "Home", icon: "🏠" },
  { href: "/schedule", label: "Schedule", icon: "📅" },
  { href: "/roster", label: "Team", icon: "👥" },
  { href: "/snacks", label: "Snacks", icon: "🍊" },
];

export function AppShell({ team, base, mode, children }: { team: Team; base: string; mode: "coach" | "parent"; children: ReactNode }) {
  const nav = mode === "coach" ? COACH_NAV : PARENT_NAV;
  return (
    <div className="min-h-dvh pb-24 md:pb-8">
      <header className="sticky top-0 z-20 bg-team text-on-team shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href={base} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl" aria-hidden>{team.theme.crestEmoji ?? "🏅"}</span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-extrabold">{team.name}</span>
              <span className="block text-xs opacity-80">{mode === "coach" ? "Coach view" : "Team page"}</span>
            </span>
          </Link>
          <nav className="ml-auto hidden gap-1 md:flex" aria-label="Primary">
            {nav.map((n) => (
              <Link key={n.href} href={`${base}${n.href}`} className="rounded-lg px-3 py-2 font-display font-bold hover:bg-white/10">{n.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}>
          {nav.map((n) => (
            <li key={n.href}>
              <Link href={`${base}${n.href}`} className="flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-muted">
                <span className="text-xl" aria-hidden>{n.icon}</span>{n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
