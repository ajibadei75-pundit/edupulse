import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { getMyResults, saveMyResults, matchSchools } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Award, MapPin, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/results/")({
  head: () => ({ meta: [{ title: "My Results — EduPulse" }] }),
  component: ResultsPage,
});

const GRADES = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];

function ResultsPage() {
  const getFn = useServerFn(getMyResults);
  const saveFn = useServerFn(saveMyResults);
  const matchFn = useServerFn(matchSchools);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-results"], queryFn: () => getFn() });

  const [jamb, setJamb] = useState(220);
  const [waec, setWaec] = useState<{ subject: string; grade: string }[]>([]);
  const [course, setCourse] = useState("");
  const [stateF, setStateF] = useState("");

  useEffect(() => {
    if (data) {
      setJamb((data as any).jamb_score ?? 220);
      setWaec(((data as any).waec_subjects as any[]) ?? []);
      setCourse((data as any).preferred_course ?? "");
      setStateF((data as any).preferred_state ?? "");
    } else if (waec.length === 0) {
      setWaec([
        { subject: "English", grade: "C6" },
        { subject: "Mathematics", grade: "C6" },
        { subject: "Biology", grade: "C6" },
        { subject: "Chemistry", grade: "C6" },
        { subject: "Physics", grade: "C6" },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const saveM = useMutation({
    mutationFn: () => saveFn({ data: { jamb_score: jamb, waec_subjects: waec, jamb_subjects: [], preferred_course: course, preferred_state: stateF } }),
    onSuccess: () => { toast.success("Saved!"); qc.invalidateQueries({ queryKey: ["my-results"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const matchM = useMutation({
    mutationFn: () => matchFn({ data: { jamb_score: jamb, waec_subjects: waec, preferred_course: course, preferred_state: stateF } }),
  });

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-6xl">
        <PageTitle title="My results & school match" subtitle="Save your scores once. Run the matcher anytime." />

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 h-fit">
            <h2 className="font-display text-lg font-black">Your scores</h2>
            <div>
              <label className="text-sm font-ui font-medium mb-1 block">JAMB score</label>
              <input type="number" min={0} max={400} value={jamb} onChange={(e) => setJamb(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-ui font-medium">WAEC subjects</label>
                <button type="button" onClick={() => setWaec([...waec, { subject: "", grade: "C6" }])} className="text-xs text-primary font-semibold inline-flex items-center gap-1">
                  <Plus className="size-3.5" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {waec.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_auto] gap-2">
                    <input placeholder="Subject" value={s.subject} onChange={(e) => setWaec(waec.map((w, j) => j === i ? { ...w, subject: e.target.value } : w))} className={inputCls} />
                    <select value={s.grade} onChange={(e) => setWaec(waec.map((w, j) => j === i ? { ...w, grade: e.target.value } : w))} className={inputCls}>
                      {GRADES.map((g) => <option key={g}>{g}</option>)}
                    </select>
                    <button type="button" onClick={() => setWaec(waec.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1 block">Preferred course</label>
              <input placeholder="e.g. Computer Science" value={course} onChange={(e) => setCourse(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1 block">Preferred state</label>
              <input placeholder="e.g. Lagos" value={stateF} onChange={(e) => setStateF(e.target.value)} className={inputCls} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveM.mutate()} variant="outline" disabled={saveM.isPending} className="rounded-lg flex-1">
                <Save className="size-4 mr-1" /> {saveM.isPending ? "Saving…" : "Save"}
              </Button>
              <Button onClick={() => matchM.mutate()} disabled={matchM.isPending} className="rounded-lg flex-1">
                {matchM.isPending ? "…" : "Find matches"}
              </Button>
            </div>
          </div>

          <div>
            {matchM.isIdle && <div className="bg-muted/40 border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">Click <strong>Find matches</strong> to see eligible schools.</div>}
            {matchM.data && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">{matchM.data.matches.length} matches</p>
                <div className="space-y-3">
                  {matchM.data.matches.map((r: any) => (
                    <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-lg font-black">{r.course_name}</h3>
                          <p className="text-sm text-primary font-semibold">{r.school?.name}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold"><Award className="size-3" /> {r.jamb_cutoff}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {r.school?.state && <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {r.school.state}</span>}
                        {r.school?.ownership && <span>{r.school.ownership}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
