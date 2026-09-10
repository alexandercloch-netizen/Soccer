import { getCoachTeam } from "@/lib/data/getTeam";
import { aiEnabled } from "@/lib/ai/provider";
import { SPORT_TEMPLATES } from "@/lib/sports/templates";
import { PageHeader } from "@/components/ui";
import { SetupWizard } from "@/components/SetupWizard";

export default async function Setup({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getCoachTeam(slug);
  return (
    <>
      <PageHeader title="Season setup wizard" subtitle="Paste what the club sent you. The AI proposes; you review every field before anything is saved." />
      <SetupWizard aiOn={aiEnabled()} templates={Object.values(SPORT_TEMPLATES).map((t) => ({ id: t.id, name: t.name }))} defaultTemplate={d.template.id} seasonYear={new Date(d.season.startDate).getFullYear()} />
    </>
  );
}
