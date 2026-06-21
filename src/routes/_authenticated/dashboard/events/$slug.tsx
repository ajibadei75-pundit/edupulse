import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { adminEventDetail } from "@/lib/events.functions";
import { Star, Users, MessageSquare, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/events/$slug")({
  head: () => ({ meta: [{ title: "Event analytics — Admin" }] }),
  component: EventDetail,
});

function csvDownload(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function EventDetail() {
  const { slug } = Route.useParams();
  const fn = useServerFn(adminEventDetail);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "event", slug], queryFn: () => fn({ data: { slug } }) });

  if (isLoading || !data) return <DashboardShell><div className="p-10 text-muted-foreground">Loading…</div></DashboardShell>;
  const { event, registrations, feedback, stats } = data as any;

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-6xl">
        <Link to="/dashboard/events" className="text-sm text-muted-foreground hover:text-primary">← All events</Link>
        <PageTitle title={event.title} subtitle={`/events/${event.slug}`} />

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Stat icon={Users} label="Registrations" value={stats.registrationCount} />
          <Stat icon={MessageSquare} label="Feedback responses" value={stats.feedbackCount} />
          <Stat icon={Star} label="Avg rating" value={stats.averageRating ? `${stats.averageRating} / 5` : "—"} />
        </div>

        <section className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-ui font-bold">Registrations ({registrations.length})</h2>
            <button onClick={() => csvDownload(registrations.map((r: any) => ({ ...r, responses: JSON.stringify(r.responses) })), `${slug}-registrations.csv`)} className="text-xs inline-flex items-center gap-1 text-primary font-semibold">
              <Download className="size-3.5" /> CSV
            </button>
          </div>
          {registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                  <tr><th className="text-left py-2 px-2">Name</th><th className="text-left py-2 px-2">Email</th><th className="text-left py-2 px-2">Phone</th><th className="text-left py-2 px-2">School</th><th className="text-left py-2 px-2">Registered</th></tr>
                </thead>
                <tbody>
                  {registrations.map((r: any) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 px-2 font-medium">{r.full_name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{r.email}</td>
                      <td className="py-2 px-2 text-muted-foreground">{r.phone ?? "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground">{r.school ?? "—"}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-ui font-bold mb-3">Feedback ({feedback.length})</h2>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback yet.</p>
          ) : (
            <div className="space-y-3">
              {feedback.map((f: any) => (
                <div key={f.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`size-4 ${n <= f.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">{f.full_name ?? "Anonymous"} · {new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                  {f.comments && <p className="text-sm">{f.comments}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <Icon className="size-5 text-primary mb-2" />
      <div className="font-display text-2xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
