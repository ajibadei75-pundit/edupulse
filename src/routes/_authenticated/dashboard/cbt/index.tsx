import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { listSubjectsForExam } from "@/lib/app.functions";
import { Brain, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/cbt/")({
  head: () => ({ meta: [{ title: "CBT Practice — EduPulse" }] }),
  component: CbtIndex,
});

const EXAMS = [
  { key: "jamb", label: "JAMB UTME" },
  { key: "waec", label: "WAEC" },
  { key: "neco", label: "NECO" },
  { key: "post_utme", label: "Post-UTME" },
] as const;

function CbtIndex() {
  const fn = useServerFn(listSubjectsForExam);
  const { data: subjects = [] } = useQuery({ queryKey: ["cbt","subjects"], queryFn: () => fn() });
  const [exam, setExam] = useState<typeof EXAMS[number]["key"]>("jamb");
  const filtered = subjects.filter((s: any) => s.exam_type === exam);

  return (
    <DashboardShell>
      <div className="p-4 sm:p-6 lg:p-10 max-w-6xl">
        <PageTitle title="CBT Practice" subtitle="Pick an exam, pick a subject, take a timed drill." />
        <div className="flex flex-wrap gap-2 mb-8">
          {EXAMS.map((e) => (
            <button key={e.key} onClick={() => setExam(e.key)} className={`px-4 py-2 rounded-full text-sm font-ui font-semibold transition-all ${exam === e.key ? "bg-primary text-primary-foreground shadow" : "bg-card border border-border hover:border-primary/40"}`}>{e.label}</button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s: any) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-secondary/40 transition-all">
              <div className="size-11 rounded-xl bg-secondary/10 text-secondary grid place-items-center mb-3"><Brain className="size-5" /></div>
              <h3 className="font-ui font-bold mb-1">{s.name}</h3>
              <p className="text-xs text-muted-foreground mb-4 inline-flex items-center gap-1"><Clock className="size-3" /> {s.question_count} questions · 10-min drill</p>
              <Button asChild size="sm" className="w-full rounded-lg"><Link to="/dashboard/cbt/$slug" params={{ slug: s.slug }}>Start drill <ArrowRight className="size-3.5 ml-1" /></Link></Button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No subjects for this exam yet — check back soon.</p>}
        </div>
      </div>
    </DashboardShell>
  );
}
