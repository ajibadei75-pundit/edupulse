import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getPublicEvent, registerForEvent, submitEventFeedback } from "@/lib/events.functions";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle2, Star, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$slug")({
  loader: async ({ params }) => {
    const ev = await getPublicEvent({ data: { slug: params.slug } });
    if (!ev) throw notFound();
    return ev;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — EduPulse` },
          { name: "description", content: loaderData.description?.slice(0, 160) ?? "EduPulse event registration." },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description?.slice(0, 160) ?? "" },
          ...(loaderData.cover_url ? [{ property: "og:image", content: loaderData.cover_url }] : []),
        ]
      : [],
  }),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="p-16 text-center text-muted-foreground">{error.message}</div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="p-16 text-center">
        <h1 className="font-display text-3xl font-black">Event not found</h1>
        <p className="text-muted-foreground mt-2">It may have been unpublished.</p>
        <Link to="/events" className="text-primary font-ui font-semibold mt-4 inline-block">← All events</Link>
      </div>
    </SiteLayout>
  ),
  component: EventPage,
});

function formatDate(s?: string | null) {
  if (!s) return "Date TBA";
  return new Date(s).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
}

function EventPage() {
  const event = Route.useLoaderData() as any;
  const [tab, setTab] = useState<"register" | "feedback">("register");
  const [done, setDone] = useState(false);
  const registerFn = useServerFn(registerForEvent);
  const feedbackFn = useServerFn(submitEventFeedback);

  const [form, setForm] = useState({ full_name: "", email: "", phone: "", school: "", responses: {} as Record<string, any> });
  const [fb, setFb] = useState({ rating: 5, comments: "", full_name: "", email: "" });

  const regM = useMutation({
    mutationFn: () => registerFn({ data: { slug: event.slug, ...form } }),
    onSuccess: () => { setDone(true); toast.success("You're registered!"); },
    onError: (e: any) => toast.error(e.message ?? "Could not register"),
  });
  const fbM = useMutation({
    mutationFn: () => feedbackFn({ data: { slug: event.slug, ...fb } }),
    onSuccess: () => { toast.success("Thanks for the feedback!"); setFb({ rating: 5, comments: "", full_name: "", email: "" }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const customFields: any[] = Array.isArray(event.custom_fields) ? event.custom_fields : [];

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: event.title, url }); return; } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  return (
    <SiteLayout>
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link to="/events" className="text-sm text-muted-foreground hover:text-primary">← All events</Link>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl font-black tracking-tight">{event.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Calendar className="size-4" /> {formatDate(event.starts_at)}</span>
            {event.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {event.location}</span>}
            <button onClick={share} className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline">
              <Share2 className="size-4" /> Share
            </button>
          </div>
          {event.description && <p className="mt-6 text-base leading-relaxed text-foreground/80 max-w-2xl">{event.description}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="inline-flex bg-muted rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("register")}
            className={`px-5 py-2 rounded-lg text-sm font-ui font-semibold transition ${tab === "register" ? "bg-background shadow" : "text-muted-foreground"}`}
          >Register</button>
          {event.feedback_open && (
            <button
              onClick={() => setTab("feedback")}
              className={`px-5 py-2 rounded-lg text-sm font-ui font-semibold transition ${tab === "feedback" ? "bg-background shadow" : "text-muted-foreground"}`}
            >Feedback</button>
          )}
        </div>

        {tab === "register" && (
          done ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <CheckCircle2 className="size-12 text-primary mx-auto mb-3" />
              <h2 className="font-display text-2xl font-black">You're in.</h2>
              <p className="text-muted-foreground mt-2">We sent a confirmation to {form.email}. See you on {formatDate(event.starts_at)}.</p>
              <Button onClick={() => { setDone(false); setForm({ full_name: "", email: "", phone: "", school: "", responses: {} }); }} variant="outline" className="mt-5 rounded-lg">Register another</Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); regM.mutate(); }}
              className="bg-card border border-border rounded-2xl p-6 space-y-4"
            >
              <Field label="Full name" required>
                <input required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Email" required>
                  <input required type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Phone">
                  <input maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <Field label="School">
                <input maxLength={160} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} className={inputCls} />
              </Field>
              {customFields.map((f) => (
                <Field key={f.key} label={f.label} required={f.required}>
                  {f.type === "textarea" ? (
                    <textarea required={f.required} rows={3} value={form.responses[f.key] ?? ""} onChange={(e) => setForm({ ...form, responses: { ...form.responses, [f.key]: e.target.value } })} className={inputCls + " resize-none"} />
                  ) : f.type === "select" ? (
                    <select required={f.required} value={form.responses[f.key] ?? ""} onChange={(e) => setForm({ ...form, responses: { ...form.responses, [f.key]: e.target.value } })} className={inputCls}>
                      <option value="">Choose…</option>
                      {(f.options ?? []).map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!form.responses[f.key]} onChange={(e) => setForm({ ...form, responses: { ...form.responses, [f.key]: e.target.checked } })} />
                      {f.label}
                    </label>
                  ) : (
                    <input required={f.required} value={form.responses[f.key] ?? ""} onChange={(e) => setForm({ ...form, responses: { ...form.responses, [f.key]: e.target.value } })} className={inputCls} />
                  )}
                </Field>
              ))}
              <Button type="submit" size="lg" disabled={regM.isPending} className="rounded-lg w-full">
                {regM.isPending ? "Registering…" : "Reserve my spot"}
              </Button>
            </form>
          )
        )}

        {tab === "feedback" && event.feedback_open && (
          <form
            onSubmit={(e) => { e.preventDefault(); fbM.mutate(); }}
            className="bg-card border border-border rounded-2xl p-6 space-y-5"
          >
            <div>
              <label className="text-sm font-ui font-medium mb-2 block">How would you rate this event?</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setFb({ ...fb, rating: n })}>
                    <Star className={`size-8 ${n <= fb.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <Field label="Comments">
              <textarea rows={4} maxLength={2000} value={fb.comments} onChange={(e) => setFb({ ...fb, comments: e.target.value })} className={inputCls + " resize-none"} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Name (optional)">
                <input maxLength={120} value={fb.full_name} onChange={(e) => setFb({ ...fb, full_name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Email (optional)">
                <input type="email" maxLength={255} value={fb.email} onChange={(e) => setFb({ ...fb, email: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Button type="submit" disabled={fbM.isPending} className="rounded-lg w-full">
              {fbM.isPending ? "Sending…" : "Submit feedback"}
            </Button>
          </form>
        )}
      </div>
    </SiteLayout>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-ui font-medium mb-1.5 block">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
