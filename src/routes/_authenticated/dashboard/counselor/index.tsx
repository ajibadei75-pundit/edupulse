import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { PageFade } from "@/components/dashboard/PageFade";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HeartHandshake, CheckCircle2, Calendar } from "lucide-react";
import { claimCounselingSession, listCounselingQueue, updateCounselingSession } from "@/lib/counselor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/")({
  head: () => ({ meta: [{ title: "Counselor inbox — EduPulse" }] }),
  component: CounselorPage,
});

function CounselorPage() {
  const listFn = useServerFn(listCounselingQueue);
  const claimFn = useServerFn(claimCounselingSession);
  const updateFn = useServerFn(updateCounselingSession);
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey: ["counselor", "queue"], queryFn: () => listFn() });

  const [notes, setNotes] = useState<Record<string, string>>({});

  const claim = useMutation({
    mutationFn: (id: string) => claimFn({ data: { id } }),
    onSuccess: () => { toast.success("Session claimed"); qc.invalidateQueries({ queryKey: ["counselor", "queue"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const save = useMutation({
    mutationFn: (v: { id: string; notes?: string; status?: any }) => updateFn({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["counselor", "queue"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <DashboardShell>
      <PageFade>
        <div className="p-6 sm:p-10 max-w-5xl">
          <PageTitle title="Counselor inbox" subtitle="Claim pending sessions and record outcomes." />

          {(items as any[]).length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <HeartHandshake className="size-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No pending sessions in your queue.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {(items as any[]).map((s) => (
                <li key={s.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-ui font-bold">{s.topic}</p>
                      <p className="text-xs text-muted-foreground capitalize"><Calendar className="size-3 inline mr-1" />{new Date(s.scheduled_at).toLocaleString()} · {s.type} · <span className="text-primary">{s.status}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Student: {s.profiles?.full_name ?? "—"}</p>
                    </div>
                    {!s.counselor_id ? (
                      <Button size="sm" className="rounded-lg" onClick={() => claim.mutate(s.id)}>Claim</Button>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary/15 text-secondary">Assigned to me</span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Session notes…"
                    defaultValue={s.notes ?? ""}
                    onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => save.mutate({ id: s.id, notes: notes[s.id] ?? s.notes ?? "" })}>Save notes</Button>
                    <Button size="sm" variant="ghost" className="rounded-lg text-secondary" onClick={() => save.mutate({ id: s.id, status: "completed", notes: notes[s.id] ?? s.notes ?? "" })}>
                      <CheckCircle2 className="size-4 mr-1.5" />Mark complete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageFade>
    </DashboardShell>
  );
}
