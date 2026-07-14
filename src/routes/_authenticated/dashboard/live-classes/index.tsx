import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { listLiveClasses, createLiveClass, deleteLiveClass } from "@/lib/live-classes.functions";
import { getMyRoles } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Radio, Trash2, ExternalLink, Calendar, Clock, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/live-classes/")({
  head: () => ({ meta: [{ title: "Live classes — EduPulse" }] }),
  component: LiveClassesPage,
});

function LiveClassesPage() {
  const listFn = useServerFn(listLiveClasses);
  const rolesFn = useServerFn(getMyRoles);
  const createFn = useServerFn(createLiveClass);
  const delFn = useServerFn(deleteLiveClass);
  const qc = useQueryClient();
  const { data: classes = [], isLoading } = useQuery({ queryKey: ["live-classes"], queryFn: () => listFn(), refetchInterval: 60_000 });
  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: () => rolesFn() });
  const canCreate = (roles as string[]).some((r) => ["tutor","admin","super_admin","content_admin"].includes(r));

  useEffect(() => {
    const ch = supabase.channel("live-classes-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_classes" }, () => qc.invalidateQueries({ queryKey: ["live-classes"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", meeting_url: "", starts_at: "", duration_minutes: 60, description: "" });

  const m = useMutation({
    mutationFn: () => createFn({ data: { ...form, starts_at: new Date(form.starts_at).toISOString() } }),
    onSuccess: () => { toast.success("Live class scheduled."); setShowForm(false); setForm({ title:"", subject:"", meeting_url:"", starts_at:"", duration_minutes:60, description:"" }); qc.invalidateQueries({ queryKey: ["live-classes"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const now = Date.now();
  const grouped = useMemo(() => {
    const live: any[] = [], upcoming: any[] = [], past: any[] = [];
    for (const c of classes as any[]) {
      const start = new Date(c.starts_at).getTime();
      const end = start + (c.duration_minutes ?? 60) * 60_000;
      if (now >= start && now <= end) live.push(c);
      else if (start > now) upcoming.push(c);
      else past.push(c);
    }
    return { live, upcoming, past: past.slice(0, 8) };
  }, [classes, now]);

  return (
    <DashboardShell>
      <div className="p-4 sm:p-6 lg:p-10 max-w-5xl">
        <PageTitle
          title="Live classes"
          subtitle="External sessions hosted on Zoom, Meet, or Teams — joined with one click."
          action={canCreate && (
            <Button onClick={() => setShowForm((v) => !v)} className="rounded-lg gap-2"><Plus className="size-4" /> Schedule class</Button>
          )}
        />

        {showForm && canCreate && (
          <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="bg-card border border-border rounded-2xl p-5 mb-8 grid sm:grid-cols-2 gap-4 animate-fade-in">
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Duration (min)</label>
              <input type="number" min={5} max={480} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Meeting URL * (Zoom / Meet / Teams / any)</label>
              <input required type="url" placeholder="https://meet.google.com/..." value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Start time *</label>
              <input required type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary resize-none" />
            </div>
            <div className="sm:col-span-2"><Button type="submit" disabled={m.isPending}>{m.isPending ? "Saving…" : "Schedule"}</Button></div>
          </form>
        )}

        {grouped.live.length > 0 && (
          <section className="mb-10">
            <h2 className="font-ui font-bold text-sm uppercase tracking-wider text-highlight mb-3 flex items-center gap-2">
              <span className="relative flex size-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-highlight opacity-75 animate-ping" /><span className="relative inline-flex rounded-full size-2.5 bg-highlight" /></span>
              Live now
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {grouped.live.map((c) => <LiveCard key={c.id} c={c} live canDelete={canCreate} onDelete={() => delFn({ data: { id: c.id } }).then(() => qc.invalidateQueries({ queryKey: ["live-classes"] }))} />)}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="font-ui font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Upcoming</h2>
          {isLoading ? <SkeletonList /> : grouped.upcoming.length === 0 ? <Empty label="No upcoming classes yet." /> : (
            <div className="grid sm:grid-cols-2 gap-3">
              {grouped.upcoming.map((c) => <LiveCard key={c.id} c={c} canDelete={canCreate} onDelete={() => delFn({ data: { id: c.id } }).then(() => qc.invalidateQueries({ queryKey: ["live-classes"] }))} />)}
            </div>
          )}
        </section>

        {grouped.past.length > 0 && (
          <section>
            <h2 className="font-ui font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Past</h2>
            <div className="grid sm:grid-cols-2 gap-3 opacity-70">
              {grouped.past.map((c) => <LiveCard key={c.id} c={c} canDelete={canCreate} onDelete={() => delFn({ data: { id: c.id } }).then(() => qc.invalidateQueries({ queryKey: ["live-classes"] }))} />)}
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}

function LiveCard({ c, live, canDelete, onDelete }: { c: any; live?: boolean; canDelete?: boolean; onDelete: () => void }) {
  const start = new Date(c.starts_at);
  return (
    <div className={`bg-card border rounded-2xl p-5 ${live ? "border-highlight shadow-glow" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-ui font-bold truncate">{c.title}</h3>
          {c.subject && <p className="text-xs text-muted-foreground mt-0.5">{c.subject}</p>}
        </div>
        {live && <span className="inline-flex items-center gap-1.5 text-xs font-ui font-bold uppercase tracking-wider text-highlight"><Radio className="size-3" /> Live</span>}
      </div>
      {c.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.description}</p>}
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" />{start.toLocaleDateString()}</span>
        <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {c.duration_minutes}m</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <a href={c.meeting_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-ui font-bold transition ${live ? "bg-highlight text-highlight-foreground hover:brightness-110" : "bg-primary text-primary-foreground hover:brightness-110"}`}>
          <ExternalLink className="size-3.5" /> {live ? "Join now" : "Open link"}
        </a>
        {canDelete && (
          <button onClick={onDelete} className="ml-auto p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="size-4" /></button>
        )}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">{label}</div>;
}

function SkeletonList() {
  return <div className="grid sm:grid-cols-2 gap-3">{[0,1,2,3].map((i) => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}</div>;
}
