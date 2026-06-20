import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Users, MessagesSquare, Heart, BookmarkCheck, Megaphone, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — EduPulse" },
      { name: "description", content: "Study groups, peer discussions, mentor circles and direct messages — the educational social network for African students." },
      { property: "og:title", content: "EduPulse Community" },
      { property: "og:description", content: "Find your study group, your mentor, your people." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Community" title="Find your people." subtitle="Study groups, forums, mentor circles and direct messaging — built for serious students.">
        <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-accent hover:text-accent-foreground font-ui font-bold"><Link to="/auth" search={{ tab: "signup" }}>Join the feed</Link></Button>
      </PageHero>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: MessagesSquare, t: "Discussion forums", d: "Ask, answer, debate — moderated for quality." },
            { icon: Users, t: "Study groups", d: "Subject-specific groups that meet weekly online." },
            { icon: GraduationCap, t: "Mentor circles", d: "Small cohorts led by a verified mentor for 8-week sprints." },
            { icon: Heart, t: "Posts, comments, likes", d: "A clean educational feed — no doom-scrolling." },
            { icon: BookmarkCheck, t: "Bookmarks & notes", d: "Save and revisit the best discussions and resources." },
            { icon: Megaphone, t: "Announcements", d: "School-wide and departmental updates in one place." },
          ].map((f) => (
            <div key={f.t} className="bg-card border border-border rounded-2xl p-6">
              <f.icon className="size-6 text-highlight mb-3" />
              <h3 className="font-ui font-bold mb-1">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
