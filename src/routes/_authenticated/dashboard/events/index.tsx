import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { adminListEvents, adminCreateEvent, adminUpdateEvent, adminDeleteEvent } from "@/lib/events.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, ExternalLink, Copy, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/events/")({
  head: () => ({ meta: [{ title: "Events — Admin" }] }),
  component: EventsAdmin,
});

function EventsAdmin() {
  const listFn = useServerFn(adminListEvents);
  const createFn = useServerFn(adminCreateEvent);
  const updateFn = useServerFn(adminUpdateEvent);
  const deleteFn = useServerFn(adminDeleteEvent);
  const qc = useQueryClient();
  const { data: events = [] } = useQuery({ queryKey: ["admin", "events"], queryFn: () => listFn() });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ slug: "", title: "", description: "", location: "", starts_at: "", custom_fields: [] as any[] });
  const [field, setField] = useState({ label: "", type: "text" as "text" | "textarea" | "select" | "checkbox", required: false, options: "" });

  const createM = useMutation({
    mutationFn: () => createFn({ data: { ...form, custom_fields: form.custom_fields } }),
    onSuccess: () => {
      toast.success("Event created.");
      setShowForm(false);
      setForm({ slug: "", title: "", description: "", location: "", starts_at: "", custom_fields: [] });
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const togglePub = useMutation({
    mutationFn: (v: { id: string; is_published: boolean }) => updateFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "events"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Event deleted."); qc.invalidateQueries({ queryKey: ["admin", "events"] }); },
  });

  const addField = () => {
    if (!field.label) return;
    const key = field.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
    setForm({
      ...form,
      custom_fields: [...form.custom_fields, {
        key, label: field.label, type: field.type, required: field.required,
        options: field.type === "select" ? field.options.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      }],
    });
    setField({ label: "", type: "text", required: false, options: "" });
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/events/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-6xl">
        <PageTitle
          title="Events"
          subtitle="Create events with unique shareable links. Track registrations and feedback."
          action={<Button onClick={() => setShowForm(!showForm)} className="rounded-lg"><Plus className="size-4 mr-1" /> New event</Button>}
        />

        {showForm && (
          <form onSubmit={(e) => { e.preventDefault(); createM.mutate(); }} className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
            <h2 className="font-display text-xl font-black">Create event</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Title" required>
                <input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
              </Field>
              <Field label="URL slug" required hint="will be /events/your-slug">
                <input required pattern="[a-z0-9-]+" maxLength={80} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} placeholder="masterclass-2026" />
              </Field>
              <Field label="Location">
                <input maxLength={200} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Starts at">
                <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={3} maxLength={4000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls + " resize-none"} />
            </Field>

            <div className="border-t border-border pt-4">
              <h3 className="font-ui font-bold mb-2 text-sm">Custom form fields (optional)</h3>
              {form.custom_fields.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {form.custom_fields.map((f, i) => (
                    <li key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
                      <span>{f.label} <span className="text-muted-foreground text-xs">({f.type}{f.required ? ", required" : ""})</span></span>
                      <button type="button" onClick={() => setForm({ ...form, custom_fields: form.custom_fields.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="size-3.5" /></button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid sm:grid-cols-[2fr_1fr_auto] gap-2">
                <input placeholder="Field label" value={field.label} onChange={(e) => setField({ ...field, label: e.target.value })} className={inputCls} />
                <select value={field.type} onChange={(e) => setField({ ...field, type: e.target.value as any })} className={inputCls}>
                  <option value="text">Text</option>
                  <option value="textarea">Long text</option>
                  <option value="select">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={field.required} onChange={(e) => setField({ ...field, required: e.target.checked })} /> Required
                </label>
              </div>
              {field.type === "select" && (
                <input placeholder="Options, comma-separated" value={field.options} onChange={(e) => setField({ ...field, options: e.target.value })} className={inputCls + " mt-2"} />
              )}
              <Button type="button" variant="outline" size="sm" onClick={addField} className="mt-2 rounded-lg">Add field</Button>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createM.isPending} className="rounded-lg">{createM.isPending ? "Creating…" : "Create event"}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-lg">Cancel</Button>
            </div>
          </form>
        )}

        {events.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Calendar className="size-10 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">No events yet. Create one to share a registration link.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((e: any) => (
              <div key={e.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link to="/dashboard/events/$slug" params={{ slug: e.slug }} className="font-display text-lg font-black hover:text-primary">{e.title}</Link>
                    <div className="text-xs text-muted-foreground mt-1">
                      /events/{e.slug} {e.starts_at && `· ${new Date(e.starts_at).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => copyLink(e.slug)} className="rounded-lg h-8"><Copy className="size-3.5 mr-1" /> Copy link</Button>
                    <a href={`/events/${e.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 h-8 rounded-lg border border-border text-sm hover:bg-muted"><ExternalLink className="size-3.5" /></a>
                    <Button size="sm" variant="outline" onClick={() => togglePub.mutate({ id: e.id, is_published: !e.is_published })} className="rounded-lg h-8">
                      {e.is_published ? <><Eye className="size-3.5 mr-1" /> Live</> : <><EyeOff className="size-3.5 mr-1" /> Draft</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this event?")) del.mutate(e.id); }} className="rounded-lg h-8 text-destructive"><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-ui font-medium mb-1 block">{label} {required && <span className="text-destructive">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
