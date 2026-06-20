import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { getMyCertificates } from "@/lib/app.functions";
import { Award, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/certificates/")({
  head: () => ({ meta: [{ title: "Certificates — EduPulse" }] }),
  component: CertsPage,
});

function CertsPage() {
  const fn = useServerFn(getMyCertificates);
  const { data = [] } = useQuery({ queryKey: ["certificates"], queryFn: () => fn() });
  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-4xl">
        <PageTitle title="Certificates" subtitle="Your verified accomplishments — every credential has a unique QR-verifiable code." />
        {(data as any[]).length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-10 text-center">
            <Award className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No certificates yet. Complete a course to earn your first.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {(data as any[]).map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-6">
                <BadgeCheck className="size-6 text-secondary mb-2" />
                <h3 className="font-ui font-bold">{c.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">Issued {new Date(c.issued_at).toLocaleDateString()}</p>
                <p className="text-xs font-mono mt-3 px-2 py-1 bg-muted rounded inline-block">Code: {c.verification_code}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
