import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "", tone }: { children: ReactNode; className?: string; tone?: "team" | "muted" }) {
  const bg = tone === "team" ? "bg-team text-on-team" : tone === "muted" ? "bg-surface-2" : "bg-surface";
  return <section className={`rounded-[var(--radius-card)] border border-line ${bg} p-4 md:p-6 ${className}`}>{children}</section>;
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "team" | "success" | "warning" | "danger" | "info" }) {
  const map = {
    neutral: "bg-surface-2 text-ink", team: "bg-team-soft text-ink", success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning", danger: "bg-danger/15 text-danger", info: "bg-info/15 text-info",
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-[var(--radius-chip)] px-2 py-0.5 text-sm font-semibold ${map[tone]}`}>{children}</span>;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full bg-team-soft font-display font-extrabold text-link"
      style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials}</span>
  );
}

export function Button({ href, children, variant = "primary", className = "", ...rest }: { href?: string; children: ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "tap inline-flex items-center justify-center gap-2 rounded-[var(--radius-card)] px-4 font-display text-base font-bold transition active:scale-[0.98] disabled:opacity-50";
  const v = { primary: "bg-team text-on-team", secondary: "border border-line bg-surface text-ink", ghost: "text-link" }[variant];
  if (href) return <Link href={href} className={`${base} ${v} ${className}`}>{children}</Link>;
  return <button className={`${base} ${v} ${className}`} {...rest}>{children}</button>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl md:text-3xl">{title}</h1>{subtitle && <p className="text-muted">{subtitle}</p>}</div>
      {action}
    </header>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card tone="muted" className="text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-prose text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
