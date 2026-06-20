import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { getScholarships } from "@/lib/public.functions";
import { Calendar, ExternalLink } from "lucide-react";

const QO = queryOptions({ queryKey: ["public","scholarships"], queryFn: () => getScholarships() });

export const Route = createFileRoute("/scholarships")({
  head: () => ({
    meta: [
      { title: "Scholarships & Opportunities — EduPulse" },
      { name: "description", content: "Curated scholarships, fellowships, internships and competitions for African students. Deadline-aware, vetted." },
      { property: "og:title", content: "EduPulse Scholarships Hub" },
      { property: "og:description", content: "Real funding, on-time alerts. The opportunities hub for African students." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(QO),
  component: ScholarshipsPage,
});

function ScholarshipsPage() {
  const { data } = useSuspenseQuery(QO);
  return (
    <SiteLayout>
      <PageHero eyebrow="Opportunities Hub" title="Funding that fits your future." subtitle="Curated scholarships, fellowships, internships and competitions — with deadlines that come to you.">
        <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-accent hover:text-accent-foreground font-ui font-bold"><Link to="/auth" search={{ tab: "signup" }}>Get personalized alerts</Link></Button>
      </PageHero>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {data.map((s) => (
            <article key={s.id} className="bg-card border border-border rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-lg transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{s.category ?? "Scholarship"}</span>
                  {s.deadline && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Calendar className="size-3" /> Deadline: {new Date(s.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  )}
                </div>
                <h3 className="font-ui font-bold text-lg leading-tight">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.sponsor} · <span className="text-accent-foreground font-semibold">{s.amount}</span></p>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.description}</p>
              </div>
              <Button asChild size="sm" className="self-start sm:self-center rounded-lg font-ui font-semibold">
                <a href={s.apply_url ?? "#"} target="_blank" rel="noopener noreferrer">Apply <ExternalLink className="size-3.5 ml-1" /></a>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
