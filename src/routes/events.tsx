import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { listPublicEvents } from "@/lib/events.functions";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — EduPulse" },
      { name: "description", content: "Workshops, masterclasses, mentorship sessions and student events. Register with a single shareable link." },
      { property: "og:title", content: "EduPulse Events" },
      { property: "og:description", content: "Live and online events for African students." },
    ],
  }),
  component: EventsPage,
});

function formatDate(s?: string | null) {
  if (!s) return "Date TBA";
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function EventsPage() {
  const fn = useServerFn(listPublicEvents);
  const { data = [], isLoading } = useQuery({ queryKey: ["events", "public"], queryFn: () => fn() });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Events"
        title="Live workshops & masterclasses"
        subtitle="Register with one link. Get reminders. Show up and grow."
      />
      <section className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          {isLoading ? (
            <p className="text-muted-foreground">Loading events…</p>
          ) : data.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Calendar className="size-10 text-primary mx-auto mb-3" />
              <h2 className="font-display text-2xl font-black">No events yet</h2>
              <p className="text-muted-foreground mt-2">Check back soon — new events drop weekly.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.map((e: any) => (
                <Link
                  key={e.id}
                  to="/events/$slug"
                  params={{ slug: e.slug }}
                  className="group bg-card border border-border rounded-2xl p-5 hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="text-xs font-ui font-bold uppercase tracking-wider text-primary mb-2">
                    {formatDate(e.starts_at)}
                  </div>
                  <h3 className="font-display text-xl font-black mb-2 group-hover:text-primary transition-colors">
                    {e.title}
                  </h3>
                  {e.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{e.description}</p>
                  )}
                  {e.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <MapPin className="size-3.5" /> {e.location}
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1 text-sm font-ui font-semibold text-primary">
                    Register <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
