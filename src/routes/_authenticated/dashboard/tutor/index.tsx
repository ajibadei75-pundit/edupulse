import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import Papa from "papaparse";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { PageFade } from "@/components/dashboard/PageFade";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileText, BookOpen, Users, Brain, GraduationCap, Loader2 } from "lucide-react";
import { tutorStats, listCbtSubjects, bulkInsertQuestions } from "@/lib/tutor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/tutor/")({
  head: () => ({ meta: [{ title: "Tutor dashboard — EduPulse" }] }),
  component: TutorPage,
});

const SAMPLE_CSV = `question,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty
"What is 2+2?","3","4","5","6","B","Basic arithmetic","easy"`;

function TutorPage() {
  const statsFn = useServerFn(tutorStats);
  const subjectsFn = useServerFn(listCbtSubjects);
  const bulkFn = useServerFn(bulkInsertQuestions);
  const { data: stats } = useQuery({ queryKey: ["tutor","stats"], queryFn: () => statsFn() });
  const { data: subjects } = useQuery({ queryKey: ["tutor","subjects"], queryFn: () => subjectsFn() });

  const [subjectId, setSubjectId] = useState("");
  const [csv, setCsv] = useState("");

  const upload = useMutation({
    mutationFn: async () => {
      if (!subjectId) throw new Error("Pick a subject first.");
      const parsed = Papa.parse(csv.trim(), { header: true, skipEmptyLines: true });
      if (parsed.errors.length) throw new Error(parsed.errors[0].message);
      const questions = (parsed.data as any[]).map((r) => ({
        question: String(r.question ?? "").trim(),
        option_a: String(r.option_a ?? "").trim(),
        option_b: String(r.option_b ?? "").trim(),
        option_c: String(r.option_c ?? "").trim(),
        option_d: String(r.option_d ?? "").trim(),
        correct_option: String(r.correct_option ?? "").trim().toUpperCase() as any,
        explanation: r.explanation ? String(r.explanation).trim() : undefined,
        difficulty: r.difficulty ? String(r.difficulty).trim().toLowerCase() as any : undefined,
      })).filter((q) => q.question && ["A","B","C","D"].includes(q.correct_option));
      if (!questions.length) throw new Error("No valid rows. Check CSV headers and correct_option (A/B/C/D).");
      return bulkFn({ data: { subjectId, questions } });
    },
    onSuccess: (r) => { toast.success(`Inserted ${r.inserted} questions.`); setCsv(""); },
    onError: (e: any) => toast.error(e.message ?? "Upload failed"),
  });

  return (
    <DashboardShell>
      <PageFade>
      <div className="p-4 sm:p-6 lg:p-10 max-w-5xl">
        <PageTitle title="Tutor console" subtitle="Manage CBT content and view platform activity." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat icon={Brain} label="CBT subjects" value={stats?.subjects ?? "—"} />
          <Stat icon={FileText} label="Questions" value={stats?.questions ?? "—"} />
          <Stat icon={BookOpen} label="Courses" value={stats?.courses ?? "—"} />
          <Stat icon={Users} label="Students" value={stats?.students ?? "—"} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="size-5 text-primary" />
            <h2 className="font-ui font-bold text-lg">Bulk import CBT questions</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Paste a CSV with columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">question, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty</code>. The <code className="text-xs bg-muted px-1 py-0.5 rounded">correct_option</code> must be A, B, C, or D.
          </p>

          <div className="grid sm:grid-cols-[1fr_auto] gap-2 mb-3">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
              <option value="">Pick subject…</option>
              {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.exam_type} · {s.name}</option>)}
            </select>
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setCsv(SAMPLE_CSV)}>Use sample</Button>
          </div>

          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} placeholder="Paste CSV here…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono outline-none focus:border-primary" />

          <Button onClick={() => upload.mutate()} disabled={upload.isPending || !csv.trim()} className="mt-3 rounded-lg gap-2">
            {upload.isPending && <Loader2 className="size-4 animate-spin" />} Import questions
          </Button>
        </div>

        <div className="mt-6 bg-muted/30 border border-dashed border-border rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <GraduationCap className="size-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-ui font-semibold">Schedule a live class</p>
              <p className="text-muted-foreground">
                Live class integrations (Zoom · Google Meet · Microsoft Teams) need provider OAuth credentials. Share your Zoom / Meet link in the community feed for now — full integration ships as a separate build once credentials are configured.
              </p>
            </div>
          </div>
        </div>
      </div>
      </PageFade>
    </DashboardShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="size-9 rounded-xl grid place-items-center bg-primary/10 text-primary mb-2"><Icon className="size-4" /></div>
      <div className="font-display text-2xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
