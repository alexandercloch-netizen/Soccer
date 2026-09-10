import { Button, Card } from "@/components/ui";
import { gateMode } from "@/lib/auth";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/team/") && !sp.next.startsWith("//") && !sp.next.includes("\\") ? sp.next : "/";
  const mode = gateMode();
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl">Coach sign-in</h1>
      <p className="mt-1 text-muted">Families don&apos;t need this. Their team page link works without a passcode.</p>
      <Card className="mt-6">
        {mode === "open" ? (
          <p className="text-sm">No passcode is configured, so the coach view is open on this development build.</p>
        ) : mode === "locked" ? (
          <p className="text-sm">The coach view is locked because no passcode is configured for this deployment. Ask the site admin to set one.</p>
        ) : (
          <form method="post" action="/api/login" className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <label className="block text-sm font-semibold" htmlFor="passcode">Team passcode</label>
            <input id="passcode" name="passcode" type="password" autoComplete="current-password" required autoFocus className="w-full rounded-lg border border-line bg-surface p-3 text-lg" />
            {sp.error && <p className="text-sm text-danger">That passcode didn&apos;t match. Try again.</p>}
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
        )}
      </Card>
    </main>
  );
}
