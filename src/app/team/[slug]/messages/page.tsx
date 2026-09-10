import { getCoachTeam } from "@/lib/data/getTeam";
import { aiEnabled } from "@/lib/ai/provider";
import { Card, PageHeader } from "@/components/ui";
import { Composer } from "./Composer";

export default async function Messages({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getCoachTeam(slug);
  const emails = d.guardians.map((g) => g.email).filter(Boolean) as string[];
  return (
    <>
      <PageHeader title="Messages" subtitle="One message per event. Drafts are copied to your email app; nothing is sent from here." />
      <Composer teamName={d.team.name} sportTemplateId={d.template.id} coaches={d.team.coaches.map((c) => c.name.split(" ")[0])} aiOn={aiEnabled()} bcc={emails} />
      <h2 className="mt-6 text-lg">Sent</h2>
      {d.announcements.map((a) => (
        <Card key={a.id} className="mt-2">
          <p className="font-display font-bold">{a.subject}</p>
          <p className="text-sm text-muted">{a.sentAt} · {a.channel}</p>
          <details className="mt-2 text-sm"><summary className="cursor-pointer text-link">Show message</summary><pre className="mt-2 whitespace-pre-wrap font-body">{a.body}</pre></details>
        </Card>
      ))}
    </>
  );
}
