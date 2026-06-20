import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { getMyRoles } from "@/lib/app.functions";
import { ShieldOff, ShieldCheck, BookOpen, Brain, Newspaper, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { toast } from "sonner";

const isAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    return (data ?? []).map((r) => r.role);
  });

const addCbtQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    subjectSlug: z.string(),
    question: z.string().min(5),
    option_a: z.string().min(1), option_b: z.string().min(1), option_c: z.string().min(1), option_d: z.string().min(1),
    correct_option: z.enum(["A","B","C","D"]),
    explanation: z.string().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const roles = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const list = (roles.data ?? []).map((r) => r.role);
    const allowed = list.some((r) => ["admin","super_admin","cbt_admin"].includes(r));
    if (!allowed) throw new Error("Forbidden");
    const { data: sub } = await context.supabase.from("cbt_subjects").select("id").eq("slug", data.subjectSlug).maybeSingle();
    if (!sub) throw new Error("Subject not found");
    const { error } = await context.supabase.from("cbt_questions").insert({
      subject_id: sub.id,
      question: data.question, option_a: data.option_a, option_b: data.option_b, option_c: data.option_c, option_d: data.option_d,
      correct_option: data.correct_option, explanation: data.explanation,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const listSubjectsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("cbt_subjects").select("slug,name,exam_type,question_count").order("name");
    return data ?? [];
  });

export const Route = createFileRoute("/_authenticated/dashboard/admin/")({
  head: () => ({ meta: [{ title: "Admin — EduPulse" }] }),
  component: AdminPage,
});

function AdminPage() {
  const rolesFn = useServerFn(getMyRoles);
  const subjFn = useServerFn(listSubjectsForAdmin);
  const addFn = useServerFn(addCbtQuestion);
  const qc = useQueryClient();
  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: () => rolesFn() });
  const { data: subjects = [] } = useQuery({ queryKey: ["admin","subjects"], queryFn: () => subjFn() });
  const isAdmin = (roles as string[]).some((r) => ["admin","super_admin","cbt_admin","content_admin","finance_admin","islamic_admin"].includes(r));

  const [form, setForm] = useState({ subjectSlug: "", question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A" as "A"|"B"|"C"|"D", explanation: "" });

  const m = useMutation({
    mutationFn: () => addFn({ data: form }),
    onSuccess: () => { toast.success("Question added."); setForm({ ...form, question: "", option_a: "", option_b: "", option_c: "", option_d: "", explanation: "" }); qc.invalidateQueries({ queryKey: ["admin","subjects"] }); },
    onError: (e: any) => toast.error(e.message ?? "Could not add"),
  });

  if (!isAdmin) {
    return (
      <DashboardShell>
        <div className="p-10 max-w-xl">
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <ShieldOff className="size-10 text-destructive mx-auto mb-3" />
            <h1 className="font-display text-2xl font-black">Admin access required</h1>
            <p className="text-muted-foreground mt-2">Your account doesn't have any admin roles. Contact a super admin to be assigned.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-6xl">
        <PageTitle title="Admin console" subtitle={`Active roles: ${(roles as string[]).join(", ")}`} action={<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 text-accent-foreground text-xs font-ui font-bold uppercase tracking-wider"><ShieldCheck className="size-3.5" /> Authorized</span>} />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Brain, label: "CBT subjects", value: subjects.length },
            { icon: BookOpen, label: "Courses", value: "—" },
            { icon: Newspaper, label: "News items", value: "—" },
            { icon: Users, label: "Total users", value: "—" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
              <s.icon className="size-5 text-primary mb-2" />
              <div className="font-display text-2xl font-black">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-ui font-bold mb-1">Add CBT question</h2>
          <p className="text-sm text-muted-foreground mb-5">Quick single-question entry. Bulk CSV upload arrives next.</p>
          <form className="grid sm:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); if (form.subjectSlug && form.question) m.mutate(); }}>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Subject</label>
              <select required value={form.subjectSlug} onChange={(e) => setForm({ ...form, subjectSlug: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary">
                <option value="">Choose a subject…</option>
                {(subjects as any[]).map((s) => <option key={s.slug} value={s.slug}>{s.exam_type.toUpperCase()} · {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Correct option</label>
              <select value={form.correct_option} onChange={(e) => setForm({ ...form, correct_option: e.target.value as any })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary">
                {["A","B","C","D"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Question</label>
              <textarea required rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary resize-none" />
            </div>
            {(["a","b","c","d"] as const).map((k) => (
              <div key={k}>
                <label className="text-sm font-ui font-medium mb-1.5 block">Option {k.toUpperCase()}</label>
                <input required value={(form as any)[`option_${k}`]} onChange={(e) => setForm({ ...form, [`option_${k}`]: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Explanation (optional)</label>
              <textarea rows={2} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary resize-none" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={m.isPending} className="rounded-lg">{m.isPending ? "Saving…" : "Add question"}</Button>
            </div>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
}
