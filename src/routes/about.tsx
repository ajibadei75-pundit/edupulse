import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { Target, Eye, Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About EduPulse — Our mission, vision and impact" },
      { name: "description", content: "Why EduPulse exists, what we believe, and how we're building Africa's leading student success ecosystem." },
      { property: "og:title", content: "About EduPulse" },
      { property: "og:description", content: "Mission, vision, values and impact behind The Heartbeat of Student Success." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="About us" title="Built for the African student." subtitle="EduPulse exists to give every student — regardless of school, town or background — the academic, emotional and professional foundation to thrive.">
        <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-accent hover:text-accent-foreground font-ui font-bold"><Link to="/auth" search={{ tab: "signup" }}>Join EduPulse</Link></Button>
      </PageHero>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: "Mission", body: "To equip every African student with the tools, mentorship and opportunities they need to excel academically and professionally." },
            { icon: Eye, title: "Vision", body: "A continent where no student's potential is limited by access — only by ambition." },
            { icon: Heart, title: "Values", body: "Excellence, integrity, inclusion, and a relentless focus on student outcomes." },
          ].map((v) => (
            <div key={v.title} className="bg-card border border-border rounded-2xl p-7">
              <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4"><v.icon className="size-5" /></div>
              <h3 className="font-ui font-bold text-xl mb-2">{v.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/40">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-4xl font-black tracking-tight text-center mb-12">Our impact in numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: 120000, s: "+", l: "Students reached" },
              { v: 94, s: "%", l: "CBT pass rate" },
              { v: 1200, s: "+", l: "Verified tutors" },
              { v: 85, s: "M+", p: "₦", l: "Scholarships unlocked" },
            ].map((s) => (
              <div key={s.l} className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="font-display text-3xl font-black gradient-text"><Counter to={s.v} suffix={s.s} prefix={s.p} /></div>
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="size-10 text-accent mx-auto mb-4" />
          <h2 className="font-display text-3xl font-black mb-4">Why EduPulse?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Other platforms give you one piece — courses, or exam practice, or community. EduPulse gives you all of them together, designed for the realities of African students: data costs, exam pressure, faith, language, and the leap from school into work or university. We measure ourselves by your outcomes, not our screen time.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
