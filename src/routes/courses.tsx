import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { getCourses } from "@/lib/public.functions";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const coursesQO = queryOptions({ queryKey: ["public", "courses"], queryFn: () => getCourses() });

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — EduPulse Academy" },
      { name: "description", content: "Browse academic, IT skills, Islamic and career courses across the EduPulse ecosystem." },
      { property: "og:title", content: "EduPulse Courses" },
      { property: "og:description", content: "Premium courses across academics, IT skills, Islamic learning and career development." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(coursesQO),
  component: CoursesPage,
});

function CoursesPage() {
  const { data: courses } = useSuspenseQuery(coursesQO);
  const byCategory = courses.reduce<Record<string, typeof courses>>((acc, c) => {
    (acc[c.category] ||= []).push(c); return acc;
  }, {});

  return (
    <SiteLayout>
      <PageHero eyebrow="Academy" title="Courses across the ecosystem." subtitle="Structured curricula across academics, IT skills, Islamic learning, career development and more.">
        <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-accent hover:text-accent-foreground font-ui font-bold"><Link to="/auth" search={{ tab: "signup" }}>Start learning free</Link></Button>
      </PageHero>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl space-y-16">
          {Object.entries(byCategory).map(([cat, list]) => (
            <div key={cat}>
              <div className="flex items-end justify-between mb-6">
                <h2 className="font-display text-3xl font-black tracking-tight">{cat}</h2>
                <span className="text-sm text-muted-foreground">{list.length} course{list.length === 1 ? "" : "s"}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {list.map((c) => (
                  <article key={c.id} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 transition-all flex flex-col">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">{c.level || "All levels"}</div>
                    <h3 className="font-ui font-bold text-lg leading-tight mb-2">{c.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-5 flex-1">{c.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><Clock className="size-3.5" /> {c.duration_hours ?? 30} hrs</span>
                      <Link to="/auth" search={{ tab: "signup" }} className="text-primary font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">Enroll <ArrowRight className="size-3.5" /></Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
