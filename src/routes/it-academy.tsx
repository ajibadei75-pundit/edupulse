import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Code2, Palette, BarChart3, Brain, Shield, Megaphone, Video, Layout, Database } from "lucide-react";

export const Route = createFileRoute("/it-academy")({
  head: () => ({
    meta: [
      { title: "IT Skills Academy — EduPulse" },
      { name: "description", content: "Learn web development, UI/UX, Python, data analytics, AI tools, cybersecurity and more — with mentors, projects and certificates." },
      { property: "og:title", content: "EduPulse IT Academy" },
      { property: "og:description", content: "From design to data — tech tracks that get you hired." },
    ],
  }),
  component: ItAcademyPage,
});

const TRACKS = [
  { icon: Code2, t: "Web Development", d: "HTML, CSS, JavaScript, React, Node — build and deploy real apps." },
  { icon: Palette, t: "UI/UX Design", d: "Figma, design systems, user research, portfolio capstone." },
  { icon: BarChart3, t: "Data Analytics", d: "Excel, SQL, Power BI — entry to mid-level analyst roles." },
  { icon: Brain, t: "AI Tools", d: "Practical AI for productivity, content, automation and decisions." },
  { icon: Shield, t: "Cybersecurity", d: "Fundamentals, networks, ethical hacking primer." },
  { icon: Megaphone, t: "Digital Marketing", d: "SEO, social, paid ads, analytics — full-funnel marketing." },
  { icon: Video, t: "Video Editing", d: "Premiere, DaVinci, mobile editing for creators and brands." },
  { icon: Layout, t: "Graphic Design", d: "Brand identity, social design, print — Adobe + Figma." },
  { icon: Database, t: "Programming", d: "Python, Java, C# — foundations that transfer to any role." },
];

function ItAcademyPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="IT Skills Academy" title="From classroom to first paycheck." subtitle="Project-based tracks taught by working professionals. Capstone projects, mentors, certificates and a community to keep you accountable.">
        <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-accent hover:text-accent-foreground font-ui font-bold"><Link to="/auth" search={{ tab: "signup" }}>Browse tracks</Link></Button>
      </PageHero>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRACKS.map((t) => (
              <div key={t.t} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 transition-all">
                <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4 group-hover:scale-110 transition-transform"><t.icon className="size-6" /></div>
                <h3 className="font-ui font-bold text-lg mb-1">{t.t}</h3>
                <p className="text-sm text-muted-foreground">{t.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
