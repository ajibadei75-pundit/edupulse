import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { getLeaderboard } from "@/lib/app.functions";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/leaderboard/")({
  head: () => ({ meta: [{ title: "Leaderboard — EduPulse" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const fn = useServerFn(getLeaderboard);
  const { data = [] } = useQuery({ queryKey: ["leaderboard"], queryFn: () => fn() });
  return (
    <DashboardShell>
      <div className="p-4 sm:p-6 lg:p-10 max-w-3xl">
        <PageTitle title="Leaderboard" subtitle="Top performers across all CBT drills this season." />
        <ol className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {(data as any[]).map((r, i) => (
            <li key={r.userId} className="flex items-center gap-4 p-4">
              <span className={`size-9 rounded-full grid place-items-center font-display font-black text-sm ${i === 0 ? "bg-accent text-accent-foreground" : i < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {i < 3 ? <Trophy className="size-4" /> : i+1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-ui font-semibold truncate">{r.profile?.full_name ?? "Student"}</p>
                <p className="text-xs text-muted-foreground truncate">{r.profile?.school ?? "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-black text-lg">{r.avgScore}%</p>
                <p className="text-xs text-muted-foreground">{r.attempts} drill{r.attempts === 1 ? "" : "s"}</p>
              </div>
            </li>
          ))}
          {(data as any[]).length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No attempts yet. Be the first.</li>}
        </ol>
      </div>
    </DashboardShell>
  );
}
