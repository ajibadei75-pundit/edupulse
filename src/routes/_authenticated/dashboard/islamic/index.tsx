import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { listStudentsForIslamic, listIslamicProgress, addIslamicProgress } from "@/lib/islamic.functions";
import { Button } from "@/components/ui/button";
import { BookMarked, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/islamic/")({
  head: () => ({ meta: [{ title: "Islamic Organizer — EduPulse" }] }),
  component: IslamicPage,
});

const PROGRAMS = ["Qur'an Memorization","Tajweed","Arabic","Hadith","Fiqh","Aqeedah","Seerah"];

function IslamicPage() {
  const qc = useQueryClient();
  const studentsFn = useServerFn(listStudentsForIslamic);
  const listFn = useServerFn(listIslamicProgress);
  const addFn = useServerFn(addIslamicProgress);
  const [studentId, setStudentId] = useState("");
  const [form, setForm] = useState({ program: PROGRAMS[0], milestone: "", score: "" as any, notes: "" });

  const students = useQuery({ queryKey: ["islamic-students"], queryFn: () => studentsFn() });
  const entries = useQuery({ queryKey: ["islamic-progress", studentId], queryFn: () => listFn({ data: { studentId: studentId || undefined } }) });

  const add = useMutation({
    mutationFn: () => addFn({ data: {
      studentId,
      program: form.program,
      milestone: form.milestone,
      score: form.score === "" ? undefined : Number(form.score),
      notes: form.notes || undefined,
    }}),
    onSuccess: () => { toast.success("Progress logged"); setForm({ ...form, milestone: "", score: "", notes: "" }); qc.invalidateQueries({ queryKey: ["islamic-progress"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-5xl">
        <PageTitle title="Islamic learning progress" subtitle="Log memorization, tajweed and knowledge milestones. Students, parents and admins are notified." />

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
          <form onSubmit={(e) => { e.preventDefault(); if (studentId && form.milestone) add.mutate(); }}
            className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div>
              <label className="text-xs font-ui font-bold uppercase tracking-wider text-muted-foreground">Student</label>
              <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                <option value="">Choose student…</option>
                {(students.data ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-ui font-bold uppercase tracking-wider text-muted-foreground">Program</label>
                <select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                  {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-ui font-bold uppercase tracking-wider text-muted-foreground">Score (0-100)</label>
                <input type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-ui font-bold uppercase tracking-wider text-muted-foreground">Milestone</label>
              <input required placeholder="e.g. Completed Surah Al-Baqarah" value={form.milestone} onChange={(e) => setForm({ ...form, milestone: e.target.value })} className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-ui font-bold uppercase tracking-wider text-muted-foreground">Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
            <Button type="submit" disabled={add.isPending} className="w-full rounded-lg gap-2"><Plus className="size-4" /> Log progress</Button>
          </form>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-ui font-bold mb-3 flex items-center gap-2"><BookMarked className="size-4 text-primary" /> {studentId ? "Student history" : "Recent entries"}</h2>
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {(entries.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No entries yet.</p> :
                (entries.data as any[]).map((e) => (
                  <div key={e.id} className="border border-border rounded-xl p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold">{e.profiles?.full_name ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-primary font-ui font-bold mt-0.5">{e.program} {e.score != null && <span className="ml-1 text-accent-foreground">· {e.score}%</span>}</div>
                    <div className="text-sm mt-1">{e.milestone}</div>
                    {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
