import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";

export default async function More({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/team/${slug}`;
  const items = [
    { href: `${base}/messages`, icon: "✉️", title: "Messages", body: "Draft and send one message per event." },
    { href: `${base}/setup`, icon: "✨", title: "Season setup wizard", body: "Paste the club's email; review; save." },
    { href: `${base}/settings`, icon: "⚙️", title: "Settings", body: "Colors, sport template, sharing, privacy." },
    { href: `/`, icon: "🔁", title: "Switch team", body: "Other seasons and sports." },
    { href: `/api/logout`, icon: "🚪", title: "Sign out", body: "Lock the coach view on this device." },
  ];
  return (
    <>
      <PageHeader title="More" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.href}><Link href={i.href} className="block"><Card className="tap hover:bg-surface-2"><p className="text-2xl" aria-hidden>{i.icon}</p><p className="font-display text-lg font-bold">{i.title}</p><p className="text-sm text-muted">{i.body}</p></Card></Link></li>
        ))}
      </ul>
    </>
  );
}
