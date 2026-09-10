import { notFound } from "next/navigation";
import { loadTeamByShareCode } from "@/lib/data/repo";
import { teamStyle } from "@/lib/theme";
import { AppShell } from "@/components/AppShell";

/** Public parent view. Loaded WITHOUT the private overlay; contacts never reach this tree. */
export default async function PublicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ code: string }> }) {
  const { code } = await params;
  const data = loadTeamByShareCode(code);
  if (!data) notFound();
  return (
    <div style={teamStyle(data.team.theme)}>
      <AppShell team={data.team} base={`/t/${code}`} mode="parent">{children}</AppShell>
    </div>
  );
}
