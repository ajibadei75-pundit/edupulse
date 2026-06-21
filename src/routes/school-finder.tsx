import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { matchSchools } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, GraduationCap, MapPin, Award } from "lucide-react";

export const Route = createFileRoute("/school-finder")({
  head: () => ({
    meta: [
      { title: "School Finder — EduPulse" },
      { name: "description", content: "Find Nigerian universities you can apply to based on your WAEC grades and JAMB score." },
      { property: "og:title", content: "School Finder — EduPulse" },
      { property: "og:description", content: "Match your JAMB and WAEC results with eligible universities and courses." },
    ],
  }),
  component: Page,
});

const GRADES = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];

function Page() {
  const matchFn = useServerFn(matchSchools);
  const [jamb, setJamb] = useState(220);
  const [course, setCourse] = useState("");
  const [stateF, setStateF] = useState("");
  const [waec, setWaec] = useState<{ subject: string; grade: string }[]>([
    { subject: "English", grade: "C6" },
    { subject: "Mathematics", grade: "C6" },
    { subject: "Biology", grade: "C6" },
    { subject: "Chemistry", grade: "C6" },
    { subject: "Physics", grade: "C6" },
  ]);

  const m = useMutation({
    mutationFn: () => matchFn({ data: { jamb_score: jamb, waec_subjects: waec, preferred_course: course, preferred_state: stateF } }),
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Admission match"
        title="Find schools you can get into"
        subtitle="Enter your JAMB score and WAEC grades. We'll match you with universities and courses where you meet the cut-off."
      />
      <section className="py-12 px-6">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-[1fr_1.4fr] gap-8">
          <form
            onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
            className="bg-card border border-border rounded-2xl p-6 space-y-4 h-fit sticky top-20"
          >
            <h2 className="font-display text-xl font-black">Your scores</h2>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">JAMB score (0-400)</label>
              <input type="number" min={0} max={400} required value={jamb} onChange={(e) => setJamb(Number(e.target.value))} className={inputCls} />
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
                  <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2">
                    <input placeholder="Subject" value={s.subject} onChange={(e) => setWaec(waec.map((w, j) => j === i ? { ...w, subject: e.target.value } : w))} className={inputCls} />
                    <select value={s.grade} onChange={(e) => setWaec(waec.map((w, j) => j === i ? { ...w, grade: e.target.value } : w))} className={inputCls}>
                      {GRADES.map((g) => <option key={g}>{g}</option>)}
                    </select>
                    <button type="button" onClick={() => setWaec(waec.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Preferred course (optional)</label>
              <input placeholder="e.g. Computer Science" value={course} onChange={(e) => setCourse(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Preferred state (optional)</label>
              <input placeholder="e.g. Lagos" value={stateF} onChange={(e) => setStateF(e.target.value)} className={inputCls} />
            </div>
            <Button type="submit" disabled={m.isPending} className="w-full rounded-lg">
              {m.isPending ? "Matching…" : "Find my matches"}
            </Button>
          </form>

          <div>
            {m.isIdle && (
              <div className="bg-muted/40 border border-dashed border-border rounded-2xl p-10 text-center">
                <GraduationCap className="size-10 text-primary mx-auto mb-3" />
                <h3 className="font-display text-xl font-black">Enter your scores</h3>
                <p className="text-muted-foreground text-sm mt-1">Your eligible schools and courses will appear here.</p>
              </div>
            )}
            {m.isPending && <p className="text-muted-foreground">Searching…</p>}
            {m.data && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Found <span className="font-bold text-foreground">{m.data.matches.length}</span> matches from {m.data.checked} courses (using {m.data.credits} credit passes).
                </p>
                {m.data.matches.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-8 text-center">
                    <p className="font-ui font-bold">No matches yet.</p>
                    <p className="text-muted-foreground text-sm mt-1">Try lowering your filters or check your subject names.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {m.data.matches.map((r: any) => (
                      <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-display text-lg font-black">{r.course_name}</h3>
                            <p className="text-sm text-primary font-semibold">{r.school?.name} {r.school?.short_name && <span className="text-muted-foreground">({r.school.short_name})</span>}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            <Award className="size-3" /> Cut-off {r.jamb_cutoff}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {r.faculty && <span>{r.faculty}</span>}
                          {r.school?.state && <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {r.school.state}</span>}
                          {r.school?.ownership && <span>{r.school.ownership}</span>}
                        </div>
                        {Array.isArray(r.required_subjects) && r.required_subjects.length > 0 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            <span className="font-semibold">Required:</span> {r.required_subjects.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
