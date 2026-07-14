import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { adminListSiteFeedback } from "@/lib/feedback.functions";
import { Star, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/feedback/")({
  head: () => ({ meta: [{ title: "Feedback — Admin" }] }),
  component: FeedbackAdmin,
});

function FeedbackAdmin() {
  const fn = useServerFn(adminListSiteFeedback);
  const { data = [], isLoading, isError, error } = useQuery({ queryKey: ["admin", "feedback"], queryFn: () => fn(), retry: false });

  return (
    <DashboardShell>
      <div className="p-4 sm:p-6 lg:p-10 max-w-5xl">
        <PageTitle title="Site feedback" subtitle="What students are telling us." />
        {isError ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">{(error as any)?.message ?? "You don't have admin access."}</div>
        ) : isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <MessageCircle className="size-10 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">No feedback yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((f: any) => (
              <div key={f.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-ui font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">{f.category}</span>
                    {f.rating && (
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-3.5 ${n <= f.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm">{f.message}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {f.page && <span>on {f.page}</span>}
                  {f.email && <span> · {f.email}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
