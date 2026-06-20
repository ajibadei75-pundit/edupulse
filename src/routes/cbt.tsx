import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { getCbtSubjects } from "@/lib/public.functions";
import { Timer, ShieldCheck, BarChart3, Shuffle, ArrowRight, Brain } from "lucide-react";

const subjectsQO = queryOptions({ queryKey: ["public","cbt-subjects"], queryFn: () => getCbtSubjects() });

export const Route = createFileRoute("/cbt")({
  head: () => ({
    meta: [
      { title: "CBT Practice — JAMB, WAEC, NECO past questions" },
      { name: "description", content: "Real exam simulation with 20,000+ JAMB, WAEC, NECO and Post-UTME past questions. Timed mode, instant marking, deep analytics." },
      { property: "og:title", content: "EduPulse CBT Practice" },
      { property: "og:description", content: "Master your CBT exams with timed simulation, instant marking and per-topic analytics." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(subjectsQO),
  component: CbtPage,
});

const EXAMS = [
  { type: "jamb", name: "JAMB UTME", desc: "Unified Tertiary Matriculation Examination" },
  { type: "waec", name: "WAEC SSCE", desc: "West African Senior School Certificate" },
  { type: "neco", name: "NECO", desc: "National Examinations Council" },
  { type: "post_utme", name: "Post-UTME", desc: "University screening exams" },
];

function CbtPage() {
  const { data: subjects } = useSuspenseQuery(subjectsQO);
  return (
    <SiteLayout>
      <PageHero eyebrow="CBT Practice" title="Train like you'll test." subtitle="Real exam interface. Authentic past questions. Instant marking and per-topic analytics that tell you exactly what to study next.">
        <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-accent hover:text-accent-foreground font-ui font-bold"><Link to="/auth" search={{ tab: "signup" }}>Start a free drill</Link></Button>
      </PageHero>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl font-black mb-8 text-center">Examinations we cover</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXAMS.map((e) => (
              <div key={e.type} className="bg-card border border-border rounded-2xl p-6 hover:border-secondary/30 hover:shadow-lg transition-all">
                <div className="size-11 rounded-xl bg-secondary/10 text-secondary grid place-items-center mb-4"><Brain className="size-5" /></div>
                <h3 className="font-ui font-bold text-lg">{e.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/40">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl font-black mb-2 text-center">Subjects available now</h2>
          <p className="text-center text-muted-foreground mb-10">Practice timed drills on each subject. Sign up free to start.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((s) => (
              <Link key={s.id} to="/auth" search={{ tab: "signup" }} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-secondary/40 transition-all flex items-center gap-4">
                <div className="size-12 rounded-xl bg-secondary/10 text-secondary grid place-items-center font-bold text-xs uppercase">{s.exam_type}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.question_count} question{s.question_count===1?"":"s"}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Timer, t: "Real exam timer", d: "Practice under the same time pressure you'll face on exam day." },
            { icon: Shuffle, t: "Smart randomization", d: "No two drills are identical. Every attempt rebuilds your stamina." },
            { icon: BarChart3, t: "Per-topic analytics", d: "See exactly which topics need more work, not just a final score." },
            { icon: ShieldCheck, t: "Anti-cheat ready", d: "Lockdown mode, copy/paste blocks and randomized order for real assessments." },
          ].map((f) => (
            <div key={f.t} className="bg-card border border-border rounded-2xl p-6">
              <f.icon className="size-6 text-primary mb-3" />
              <h3 className="font-ui font-bold mb-1">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
