import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { PageFade } from "@/components/dashboard/PageFade";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Trash2, Trophy, BookOpen, Loader2 } from "lucide-react";
import { linkStudent, unlinkStudent, getMyChildren } from "@/lib/parent.functions";

export const Route = createFileRoute("/_authenticated/dashboard/parent/")({
  head: () => ({ meta: [{ title: "Parent dashboard — EduPulse" }] }),
  component: ParentPage,
});

function ParentPage() {
  const qc = useQueryClient();
  const childrenFn = useServerFn(getMyChildren);
  const linkFn = useServerFn(linkStudent);
  const unlinkFn = useServerFn(unlinkStudent);
  const [code, setCode] = useState("");

  const { data: children, isLoading } = useQuery({ queryKey: ["parent","children"], queryFn: () => childrenFn() });

  const link = useMutation({
    mutationFn: (c: string) => linkFn({ data: { code: c } }),
    onSuccess: () => { toast.success("Student linked."); setCode(""); qc.invalidateQueries({ queryKey: ["parent","children"] }); },
    onError: (e: any) => toast.error(e.message ?? "Could not link"),
  });

  const unlink = useMutation({
    mutationFn: (id: string) => unlinkFn({ data: { studentId: id } }),
    onSuccess: () => { toast.success("Unlinked."); qc.invalidateQueries({ queryKey: ["parent","children"] }); },
  });

  return (
    <DashboardShell>
      <PageFade>
      <div className="p-6 sm:p-10 max-w-5xl">
        <PageTitle title="Parent dashboard" subtitle="Monitor your child's progress on EduPulse." />

        <div className="bg-card border border-border rounded-2xl p-5 mb-8">
          <h2 className="font-ui font-bold mb-1">Link a child</h2>
          <p className="text-sm text-muted-foreground mb-4">Ask your child for their EduPulse invite code (Profile → Invite code).</p>
          <form onSubmit={(e) => { e.preventDefault(); if (code) link.mutate(code.toUpperCase()); }} className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} placeholder="ABCD1234"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 font-mono uppercase tracking-widest outline-none focus:border-primary" />
            <Button type="submit" disabled={link.isPending || code.length < 4} className="rounded-lg">
              {link.isPending ? <Loader2 className="size-4 animate-spin" /> : "Link"}
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2].map((i) => <div key={i} className="h-40 rounded-2xl bg-muted/50 animate-pulse" />)}</div>
        ) : !children?.length ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
            <Users className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-ui font-semibold">No children linked yet.</p>
            <p className="text-sm text-muted-foreground">Use the code above to connect a student account.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {children.map((c) => {
              const avg = c.attempts.length ? Math.round(c.attempts.reduce((s, a) => s + (a.score / Math.max(a.total,1)) * 100, 0) / c.attempts.length) : null;
              return (
                <div key={c.profile.id} className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-display text-xl font-bold">{c.profile.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{c.profile.school || "—"} · {c.profile.level || "—"}</p>
                    </div>
                    <button onClick={() => unlink.mutate(c.profile.id)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
                      <Trash2 className="size-3" /> Unlink
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 mb-4">
                    <Stat icon={Trophy} label="Avg CBT score" value={avg !== null ? `${avg}%` : "—"} tone="primary" />
                    <Stat icon={BookOpen} label="Enrollments" value={c.enrollments.length} tone="secondary" />
                    <Stat icon={Users} label="CBT attempts" value={c.attempts.length} tone="accent" />
                  </div>
                  {c.attempts.length > 0 && (
                    <div>
                      <p className="text-xs font-ui font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent attempts</p>
                      <ul className="text-sm space-y-1.5">
                        {c.attempts.slice(0, 5).map((a, i) => (
                          <li key={i} className="flex justify-between border-b border-border/50 pb-1.5">
                            <span>{(a.cbt_subjects as any)?.exam_type} · {(a.cbt_subjects as any)?.name}</span>
                            <span className="font-mono">{a.score}/{a.total}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </PageFade>
    </DashboardShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: any; tone: string }) {
  const tones: Record<string,string> = { primary: "bg-primary/10 text-primary", secondary: "bg-secondary/10 text-secondary", accent: "bg-accent/20 text-accent-foreground" };
  return (
    <div className="rounded-xl border border-border p-4">
      <div className={`size-8 rounded-lg grid place-items-center ${tones[tone]} mb-2`}><Icon className="size-4" /></div>
      <div className="font-display text-2xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
