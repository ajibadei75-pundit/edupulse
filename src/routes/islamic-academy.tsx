import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, GraduationCap, Calendar } from "lucide-react";
import islamicPattern from "@/assets/islamic-pattern.jpg";

export const Route = createFileRoute("/islamic-academy")({
  head: () => ({
    meta: [
      { title: "Islamic Academy — EduPulse" },
      { name: "description", content: "Qur'an, Tajweed, Hifz, Islamic Studies and counseling — taught by qualified instructors, integrated with your academic journey." },
      { property: "og:title", content: "EduPulse Islamic Academy" },
      { property: "og:description", content: "Modern Islamic learning that walks alongside your academic and career growth." },
      { property: "og:image", content: "" },
    ],
  }),
  component: IslamicAcademyPage,
});

const PROGRAMS = [
  { icon: BookOpen, t: "Qur'an Recitation", d: "Word-by-word Qira'ah with native instructors, structured weekly classes." },
  { icon: GraduationCap, t: "Tajweed", d: "Rules of correct recitation — practical drills, individual feedback." },
  { icon: BookOpen, t: "Hifz Program", d: "Memorization with a personalized roadmap, daily review and Sheikh check-ins." },
  { icon: BookOpen, t: "Islamic Studies", d: "Aqeedah, Fiqh, Seerah and Hadith for the modern student." },
  { icon: Users, t: "Madrasah for kids", d: "Age-appropriate classes for younger siblings and family." },
  { icon: Calendar, t: "Ramadan programs", d: "Special intensives during Ramadan — Qiyam, Tafseer and reflections." },
];

function IslamicAcademyPage() {
  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden bg-primary text-white -mt-16 pt-16">
        <div className="absolute inset-0 opacity-25" aria-hidden style={{ backgroundImage: `url(${islamicPattern})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
          <p className="font-ui text-xs uppercase tracking-[0.3em] font-bold text-accent mb-4">Islamic Academy</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-balance">Knowledge for the heart, mind and ummah.</h1>
          <p className="mt-5 text-lg text-white/85 max-w-2xl mx-auto text-pretty">Tajweed, Hifz, Aqeedah, Seerah, Fiqh — taught by qualified scholars, integrated with your academic and career growth.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl bg-accent text-accent-foreground hover:brightness-110 font-ui font-bold"><Link to="/auth" search={{ tab: "signup" }}>Enter the academy</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white font-ui font-bold"><Link to="/courses">View Islamic courses</Link></Button>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl font-black mb-10 text-center">Our programs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROGRAMS.map((p) => (
              <div key={p.t} className="bg-card border border-border rounded-2xl p-7 hover:border-accent/40 hover:shadow-lg transition-all">
                <div className="size-12 rounded-xl bg-accent/15 text-accent-foreground grid place-items-center mb-4"><p.icon className="size-5" /></div>
                <h3 className="font-ui font-bold text-lg mb-2">{p.t}</h3>
                <p className="text-sm text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/40">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-black mb-4">Separate male and female learning groups</h2>
          <p className="text-muted-foreground leading-relaxed">Comfortable, dignified learning environments with instructors matched to each group. Modern technology, classical scholarship.</p>
        </div>
      </section>
    </SiteLayout>
  );
}
