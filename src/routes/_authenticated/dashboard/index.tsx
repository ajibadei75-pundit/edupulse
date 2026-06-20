import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { getDashboardOverview } from "@/lib/app.functions";
import { BookOpen, Brain, Award, Flame, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — EduPulse" }] }),
  component: DashboardHome,
});

function DashboardHome() {
  const fn = useServerFn(getDashboardOverview);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard","overview"], queryFn: () => fn() });

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-6xl">
        <PageTitle
          title={`Welcome${data?.profile?.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""}.`}
          subtitle="Your learning pulse at a glance."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: "Active courses", value: data?.enrollments.length ?? 0, color: "text-primary bg-primary/10" },
            { icon: Brain, label: "CBT attempts", value: data?.recentAttempts.length ?? 0, color: "text-secondary bg-secondary/10" },
            { icon: Award, label: "Certificates", value: data?.certificateCount ?? 0, color: "text-accent-foreground bg-accent/20" },
            { icon: Flame, label: "Streak (days)", value: data?.profile?.streak_days ?? 0, color: "text-highlight bg-highlight/10" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
              <div className={`size-10 rounded-xl grid place-items-center ${s.color} mb-3`}><s.icon className="size-5" /></div>
              <div className="font-display text-3xl font-black">{isLoading ? "—" : s.value}</div>
              <div className="text-xs text-muted-foreground font-ui font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-ui font-bold">My courses</h2>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard/courses">All courses <ArrowRight className="size-3.5 ml-1" /></Link></Button>
            </div>
            {(data?.enrollments.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't enrolled in any course yet. <Link to="/dashboard/courses" className="text-primary font-semibold">Browse the catalog</Link>.</p>
            ) : (
              <ul className="space-y-3">
                {data!.enrollments.slice(0, 4).map((e: any) => (
                  <li key={e.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-ui font-semibold text-sm truncate">{e.courses?.title}</p>
                      <Progress value={e.progress} className="mt-1.5 h-1.5" />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{e.progress}%</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-ui font-bold">Recent CBT attempts</h2>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard/cbt">Practice <ArrowRight className="size-3.5 ml-1" /></Link></Button>
            </div>
            {(data?.recentAttempts.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No attempts yet — <Link to="/dashboard/cbt" className="text-secondary font-semibold">start your first drill</Link>.</p>
            ) : (
              <ul className="space-y-3">
                {data!.recentAttempts.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-ui font-semibold text-sm truncate">{a.cbt_subjects?.name}</p>
                      <p className="text-xs text-muted-foreground uppercase">{a.cbt_subjects?.exam_type}</p>
                    </div>
                    <span className="text-sm tabular-nums font-semibold text-primary">{a.score}/{a.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
