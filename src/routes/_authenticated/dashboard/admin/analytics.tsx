import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { getAdminAnalytics, listTutorProgramFeedback } from "@/lib/analytics.functions";
import { Users, UserCheck, UserPlus, BookOpen, Brain, Radio, Calendar, Award, MessageCircle, Star, TrendingUp, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
  component: AnalyticsPage,
});

function StatCard({ icon: Icon, label, value, hint }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <Icon className="size-5 text-primary mb-2" />
      <div className="font-display text-2xl font-black">{value ?? "—"}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {hint && <div className="text-[11px] text-muted-foreground/70 mt-1">{hint}</div>}
    </div>
  );
}

function AnalyticsPage() {
  const aFn = useServerFn(getAdminAnalytics);
  const fFn = useServerFn(listTutorProgramFeedback);
  const { data: a, isLoading, isError, error } = useQuery({ queryKey: ["admin", "analytics"], queryFn: () => aFn(), retry: false });
  const { data: fb = [] } = useQuery({ queryKey: ["admin", "tp-feedback"], queryFn: () => fFn(), retry: false });

  if (isError) {
    return (
      <DashboardShell>
        <div className="p-10"><div className="bg-card border rounded-2xl p-10 text-center text-muted-foreground">{(error as any)?.message}</div></div>
      </DashboardShell>
    );
  }

  const trend: any[] = (a?.signups_by_day ?? []) as any[];
  const maxN = Math.max(1, ...trend.map((d: any) => d.n));

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-6xl">
        <PageTitle title="Platform analytics" subtitle="Real-time health of EduPulse — students, learning, engagement, feedback." />

        {isLoading ? <p className="text-muted-foreground">Loading analytics…</p> : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={Users} label="Total users" value={a?.users_total} />
              <StatCard icon={UserCheck} label="Approved" value={a?.users_approved} />
              <StatCard icon={UserPlus} label="Pending approval" value={a?.users_pending} />
              <StatCard icon={TrendingUp} label="New in last 7 days" value={a?.users_new_7d} />
              <StatCard icon={BookOpen} label="Courses" value={a?.courses_total} />
              <StatCard icon={Activity} label="Enrollments" value={a?.enrollments_total} />
              <StatCard icon={Brain} label="CBT attempts" value={a?.cbt_attempts_total} hint={`Avg score ${a?.cbt_avg_score ?? 0}%`} />
              <StatCard icon={Radio} label="Live classes" value={a?.live_classes_total} hint={`${a?.live_classes_upcoming ?? 0} upcoming`} />
              <StatCard icon={Calendar} label="Events" value={a?.events_total} hint={`${a?.event_regs_total ?? 0} registrations`} />
              <StatCard icon={Award} label="Certificates issued" value={a?.certificates} />
              <StatCard icon={MessageCircle} label="Feedback items" value={a?.feedback_total} />
              <StatCard icon={Star} label="Avg rating" value={a?.feedback_avg_rating} />
            </div>

            <section className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h2 className="font-ui font-bold mb-4">Signups — last 30 days</h2>
              {trend.length === 0 ? <p className="text-sm text-muted-foreground">No signups yet.</p> : (
                <div className="flex items-end gap-1 h-32">
                  {trend.map((d: any) => (
                    <div key={d.day} title={`${d.day}: ${d.n}`} className="flex-1 bg-primary/70 rounded-t hover:bg-primary transition"
                      style={{ height: `${(d.n / maxN) * 100}%`, minHeight: 4 }} />
                  ))}
                </div>
              )}
            </section>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <section className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-ui font-bold mb-3">Top tutors (by feedback)</h2>
                {(a?.top_tutor_feedback ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No tutor feedback yet.</p> : (
                  <ul className="space-y-2 text-sm">
                    {(a?.top_tutor_feedback as any[]).map((t: any, i: number) => (
                      <li key={i} className="flex justify-between border-b border-border/50 pb-1.5">
                        <span>{t.target_label ?? "—"}</span>
                        <span className="text-muted-foreground">{t.n} reviews · ★ {t.avg_rating ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-ui font-bold mb-3">Top programs (by feedback)</h2>
                {(a?.top_program_feedback ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No program feedback yet.</p> : (
                  <ul className="space-y-2 text-sm">
                    {(a?.top_program_feedback as any[]).map((t: any, i: number) => (
                      <li key={i} className="flex justify-between border-b border-border/50 pb-1.5">
                        <span>{t.target_label ?? "—"}</span>
                        <span className="text-muted-foreground">{t.n} reviews · ★ {t.avg_rating ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-ui font-bold mb-3">Recent tutor & program feedback</h2>
              {fb.length === 0 ? <p className="text-sm text-muted-foreground">No targeted feedback yet.</p> : (
                <div className="space-y-3">
                  {fb.map((f: any) => (
                    <div key={f.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="uppercase font-bold">{f.target_type} · {f.target_label ?? "—"}</span>
                        <span>{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm">{f.message}</p>
                      {f.rating && <div className="text-xs text-yellow-500 mt-1">{"★".repeat(f.rating)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
