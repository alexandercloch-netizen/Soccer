import { SPORT_TEMPLATES } from "@/lib/sports/templates";
import { aiEnabled } from "@/lib/ai/provider";
import { SetupWizard } from "@/components/SetupWizard";

export default function NewTeam() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl">New team or season</h1>
      <p className="mb-4 text-muted">Pick the sport, paste what the club sent, review, save. Works for soccer today and T-ball next spring.</p>
      <SetupWizard aiOn={aiEnabled()} templates={Object.values(SPORT_TEMPLATES).map((t) => ({ id: t.id, name: t.name }))} defaultTemplate="soccer-u6" seasonYear={new Date().getFullYear()} />
    </main>
  );
}
