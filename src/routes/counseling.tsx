import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { GraduationCap, Briefcase, School, Heart, Video, Phone, MessageCircle, CalendarCheck } from "lucide-react";

export const Route = createFileRoute("/counseling")({
  head: () => ({
    meta: [
      { title: "Counseling & Mentorship — EduPulse" },
      { name: "description", content: "Book 1-on-1 academic, career, admission or personal counseling with vetted EduPulse counselors. Video, audio or chat." },
      { property: "og:title", content: "EduPulse Counseling" },
      { property: "og:description", content: "Talk to a counselor who gets it. Academic, career, admission and personal support." },
    ],
  }),
  component: CounselingPage,
});

const KINDS = [
  { icon: School, title: "Academic counseling", desc: "Plan subjects, study habits, exam prep and time management.", color: "primary" as const },
  { icon: Briefcase, title: "Career counseling", desc: "Pick a course, plan internships, build a career path that fits.", color: "secondary" as const },
  { icon: GraduationCap, title: "Admission counseling", desc: "University choice, applications, scholarship strategy, post-UTME.", color: "highlight" as const },
  { icon: Heart, title: "Personal development", desc: "Mental health, motivation, confidence — talk to a real human.", color: "accent" as const },
];

function CounselingPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Counseling & Mentorship" title="Talk to someone who gets it." subtitle="Vetted counselors. Confidential. Booked around your schedule — video, audio or chat.">
        <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-accent hover:text-accent-foreground font-ui font-bold"><Link to="/auth" search={{ tab: "signup" }}>Book a session</Link></Button>
      </PageHero>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-black mb-8 text-center">Choose your type of session</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {KINDS.map((k) => (
              <div key={k.title} className="bg-card border border-border rounded-2xl p-7 hover:shadow-lg transition-all">
                <div className={`size-12 rounded-xl bg-${k.color}/10 text-${k.color === "accent" ? "accent-foreground" : k.color} grid place-items-center mb-4`}><k.icon className="size-5" /></div>
                <h3 className="font-ui font-bold text-xl mb-1">{k.title}</h3>
                <p className="text-muted-foreground text-sm">{k.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/40">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: CalendarCheck, t: "Pick a slot", d: "Calendar shows real availability. Book or reschedule any time." },
            { icon: Video, t: "Video", d: "Face-to-face when it matters. HD video with screen share." },
            { icon: Phone, t: "Audio", d: "Mobile-data friendly. Voice-only for low-bandwidth areas." },
            { icon: MessageCircle, t: "Chat", d: "Text-based check-ins between sessions." },
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
