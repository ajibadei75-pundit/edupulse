import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { getNews } from "@/lib/public.functions";

const QO = queryOptions({ queryKey: ["public","news"], queryFn: () => getNews() });

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Updates — EduPulse" },
      { name: "description", content: "Educational news, exam updates, scholarship alerts and platform announcements." },
      { property: "og:title", content: "EduPulse News" },
      { property: "og:description", content: "Stay updated on exams, scholarships and learning opportunities across Africa." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(QO),
  component: NewsPage,
});

function NewsPage() {
  const { data } = useSuspenseQuery(QO);
  return (
    <SiteLayout>
      <PageHero eyebrow="News & updates" title="What's moving across African education." />
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {data.map((n) => (
            <article key={n.id} className="bg-card border border-border rounded-2xl p-7 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{n.category ?? "News"}</span>
                <span className="text-xs text-muted-foreground">{new Date(n.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <h3 className="font-ui font-bold text-xl leading-snug mb-1">{n.title}</h3>
              <p className="text-sm text-muted-foreground">{n.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
