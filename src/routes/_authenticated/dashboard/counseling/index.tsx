import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { bookCounseling, getMyCounselingSessions } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/counseling/")({
  head: () => ({ meta: [{ title: "Counseling — EduPulse" }] }),
  component: CounselingDash,
});

function CounselingDash() {
  const listFn = useServerFn(getMyCounselingSessions);
  const bookFn = useServerFn(bookCounseling);
  const qc = useQueryClient();
  const { data: sessions = [] } = useQuery({ queryKey: ["counseling","my"], queryFn: () => listFn() });

  const [type, setType] = useState<"academic"|"career"|"admission"|"personal">("academic");
  const [topic, setTopic] = useState("");
  const [when, setWhen] = useState("");

  const m = useMutation({
    mutationFn: () => bookFn({ data: { type, topic, scheduled_at: new Date(when).toISOString() } }),
    onSuccess: () => { toast.success("Session requested — we'll confirm shortly."); setTopic(""); setWhen(""); qc.invalidateQueries({ queryKey: ["counseling","my"] }); },
    onError: (e: any) => toast.error(e.message ?? "Booking failed"),
  });

  return (
    <DashboardShell>
      <div className="p-4 sm:p-6 lg:p-10 max-w-5xl">
        <PageTitle title="Counseling" subtitle="Book a session with a vetted counselor." />
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <form className="bg-card border border-border rounded-2xl p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); if (!when || !topic) return; m.mutate(); }}>
            <h2 className="font-ui font-bold text-lg">Book a session</h2>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary">
                <option value="academic">Academic</option>
                <option value="career">Career</option>
                <option value="admission">Admission</option>
                <option value="personal">Personal development</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">What would you like to discuss?</label>
              <input required maxLength={200} value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" placeholder="e.g. JAMB strategy and university choice" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Preferred date & time</label>
              <input required type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <Button type="submit" disabled={m.isPending} className="rounded-lg w-full">{m.isPending ? "Booking…" : "Request session"}</Button>
          </form>

          <aside className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-ui font-bold text-lg mb-3">My sessions</h2>
            {(sessions as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            ) : (
              <ul className="space-y-3">
                {(sessions as any[]).slice(0, 5).map((s) => (
                  <li key={s.id} className="border-b border-border pb-2 last:border-0">
                    <p className="text-sm font-ui font-semibold">{s.topic}</p>
                    <p className="text-xs text-muted-foreground capitalize"><Calendar className="size-3 inline mr-1" /> {new Date(s.scheduled_at).toLocaleString()} · {s.type} · <span className="text-primary">{s.status}</span></p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
