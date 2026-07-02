import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { listActivity } from "@/lib/superadmin.functions";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/activity")({
  head: () => ({ meta: [{ title: "Activity log — EduPulse" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  const fn = useServerFn(listActivity);
  const { data = [] } = useQuery({ queryKey: ["activity"], queryFn: () => fn(), refetchInterval: 30_000 });

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-4xl">
        <PageTitle title="Activity log" subtitle="Recent oversight events across the platform." />
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {data.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">No activity yet.</div>
          ) : data.map((a: any) => (
            <div key={a.id} className="p-4 flex items-start gap-3">
              <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center"><Activity className="size-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-ui font-semibold text-sm">{a.action}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {a.meta && Object.keys(a.meta).length > 0 ? JSON.stringify(a.meta) : "—"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
