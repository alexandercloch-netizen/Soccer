import { notFound } from "next/navigation";
import { loadTeam } from "@/lib/data/repo";
import { teamStyle } from "@/lib/theme";
import { AppShell } from "@/components/AppShell";

export default async function TeamLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = loadTeam(slug, { includePrivate: false });
  if (!data) notFound();
  return (
    <div style={teamStyle(data.team.theme)}>
      <AppShell team={data.team} base={`/team/${slug}`} mode="coach">{children}</AppShell>
    </div>
  );
}
