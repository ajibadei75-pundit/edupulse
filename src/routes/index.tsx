import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Quote, Star, BadgeCheck, GraduationCap, Award } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { HeartbeatLine } from "@/components/brand/HeartbeatLine";
import { Logo } from "@/components/brand/Logo";
import { ShieldCheck } from "lucide-react";
import { MODULES, colorClasses } from "@/lib/modules";
import heroImg from "@/assets/hero-students.jpg";
import student1 from "@/assets/student-1.jpg";
import student2 from "@/assets/student-2.jpg";
import student3 from "@/assets/student-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduPulse — Learn. Grow. Excel." },
      { name: "description", content: "All-in-one student success ecosystem for Africa: academic LMS, JAMB/WAEC CBT practice, counseling, IT skills, Islamic learning, community and scholarships." },
      { property: "og:title", content: "EduPulse — Learn. Grow. Excel." },
      { property: "og:description", content: "The heartbeat of student success. Master your exams, build skills, find mentors, win scholarships — in one platform." },
    ],
  }),
  component: HomePage,
});

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

function HomePage() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative isolate overflow-hidden gradient-hero text-white -mt-16 pt-16">
        <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[700px] rounded-full border border-white/15 animate-pulse-ring" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[500px] rounded-full border border-white/20 animate-pulse-ring" style={{ animationDelay: "1s" }} />
          <div className="absolute top-20 right-20 size-2 bg-accent rounded-full blur-md animate-pulse" />
          <div className="absolute bottom-32 left-24 size-3 bg-highlight rounded-full blur-lg animate-pulse" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl shadow-black/20">
              <Logo variant="light" className="scale-125" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="font-ui text-[10px] uppercase tracking-[0.2em] font-bold">The Heartbeat of Student Success</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-balance">
            Learn. Grow. <span className="text-accent">Excel.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-2xl mx-auto mt-7 font-sans text-lg sm:text-xl text-white/85 text-pretty">
            Academic support, CBT practice, counseling, IT skills, Islamic learning and career development — one ecosystem built for the modern African student.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl bg-white text-primary font-ui font-bold hover:bg-accent hover:text-accent-foreground shadow-xl shadow-black/20">
              <Link to="/auth" search={{ tab: "signup" }}>Start Learning <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
            <Button asChild size="lg" className="rounded-xl bg-secondary text-secondary-foreground font-ui font-bold hover:brightness-110 shadow-xl shadow-black/20">
              <Link to="/community">Join EduPulse</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white font-ui font-bold backdrop-blur-md">
              <Link to="/counseling">Book Counseling</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 backdrop-blur-sm text-xs text-white/80"
          >
            <ShieldCheck className="size-3.5 text-accent" />
            <span className="font-ui font-semibold">Admin?</span>
            <span className="text-white/70">
              Sign in at{" "}
              <Link to="/auth" className="underline underline-offset-2 font-semibold text-white hover:text-accent">
                /auth
              </Link>{" "}
              → open{" "}
              <Link to="/dashboard/admin" className="underline underline-offset-2 font-semibold text-white hover:text-accent">
                /dashboard/admin
              </Link>
            </span>
          </motion.div>


          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }}
            className="mt-16 mx-auto max-w-md text-accent">
            <HeartbeatLine className="w-full h-12" />
            <p className="mt-2 font-ui text-[10px] uppercase tracking-[0.35em] font-black text-white/60">The pulse of potential</p>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative -mt-16 z-10 px-6">
        <div className="mx-auto max-w-5xl bg-card rounded-2xl shadow-2xl shadow-primary/10 border border-border grid grid-cols-2 md:grid-cols-4 p-6 sm:p-8 gap-6">
          {[
            { val: 120000, suf: "+", label: "Students Enrolled", color: "text-primary" },
            { val: 450, suf: "+", label: "Premium Courses", color: "text-secondary" },
            { val: 1200, suf: "+", label: "Expert Tutors", color: "text-highlight" },
            { val: 85, suf: "M+", pre: "₦", label: "Scholarships Won", color: "text-accent-foreground" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`font-display text-3xl sm:text-4xl font-black ${s.color}`}>
                <Counter to={s.val} suffix={s.suf} prefix={s.pre} />
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-ui font-bold uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="font-ui text-xs uppercase tracking-[0.25em] font-bold text-primary mb-3">The ecosystem</p>
            <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight">Everything a student needs, integrated into one pulse.</h2>
            <p className="mt-4 text-muted-foreground">Eight connected modules across academics, exams, skills, mentorship and opportunity.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MODULES.map((m, i) => {
              const c = colorClasses(m.color);
              const Icon = m.icon;
              return (
                <motion.div key={m.slug}
                  initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
                  transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}>
                  <Link to={m.href} className={`group block h-full p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all ${c.border}`}>
                    <div className={`size-12 rounded-xl ${c.bg} grid place-items-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`size-6 ${c.textPure}`} />
                    </div>
                    <h3 className="font-ui font-bold text-lg mb-1">{m.title}</h3>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">{m.short}</p>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{m.description}</p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${c.textPure}`}>
                      {m.cta} <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-muted/40">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="font-ui text-xs uppercase tracking-[0.25em] font-bold text-primary mb-3">The EduPulse journey</p>
            <h2 className="font-display text-4xl font-black tracking-tight">Three steps to your best self.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "01", t: "Register & profile", d: "Tell us your goals — exam date, target university, skills you want to build." },
              { n: "02", t: "Personalized learning", d: "Get curated courses, CBT drills, mentor matches and a community on day one." },
              { n: "03", t: "Track & triumph", d: "Monitor your heartbeat of progress, earn certificates, win scholarships." },
            ].map((s, i) => (
              <motion.div key={s.n} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative bg-card border border-border rounded-2xl p-8">
                <span className="absolute -top-4 left-8 font-display font-black text-sm text-accent-foreground bg-accent px-3 py-1 rounded-full">{s.n}</span>
                <h3 className="font-ui font-bold text-xl mt-2 mb-2">{s.t}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section className="py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <p className="font-ui text-xs uppercase tracking-[0.25em] font-bold text-primary mb-3">Success stories</p>
              <h2 className="font-display text-4xl font-black tracking-tight">Real students. Real outcomes.</h2>
            </div>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map((i) => <Star key={i} className="size-5 fill-accent text-accent" />)}
              <span className="ml-2 text-sm text-muted-foreground self-center">4.9 average · 8,200 reviews</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { img: student1, name: "Adaeze O.", role: "UNILAG, Medicine 2026", quote: "I scored 312 in JAMB on my second try after just 8 weeks of CBT drills. EduPulse rebuilt my confidence." },
              { img: student2, name: "Tunde A.", role: "Frontend Developer", quote: "The IT Academy took me from zero to my first remote job in 7 months. The mentorship made all the difference." },
              { img: student3, name: "Fatima M.", role: "ABU, Education", quote: "The Islamic Academy and academic support together — I didn't think one platform could hold both worlds." },
            ].map((s) => (
              <div key={s.name} className="bg-card border border-border rounded-2xl p-6 flex flex-col">
                <Quote className="size-6 text-accent mb-4" />
                <p className="text-foreground/85 leading-relaxed mb-6">"{s.quote}"</p>
                <div className="mt-auto flex items-center gap-3">
                  <img src={s.img} alt={s.name} loading="lazy" width={48} height={48} className="size-12 rounded-full object-cover" />
                  <div>
                    <p className="font-ui font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-12 border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">Trusted by</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 opacity-70">
            {["NUC","JAMB","WAEC","Andela","Stanbic","MTN Foundation","Mastercard"].map((p) => (
              <span key={p} className="font-display font-extrabold text-lg text-muted-foreground">{p}</span>
            ))}
          </div>
          <Button asChild variant="link" className="text-primary font-ui font-semibold">
            <Link to="/sponsors">Become a partner <ArrowRight className="ml-1 size-4" /></Link>
          </Button>
        </div>
      </section>

      {/* NEWS PREVIEW */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <p className="font-ui text-xs uppercase tracking-[0.25em] font-bold text-primary mb-3">Opportunities hub</p>
              <h2 className="font-display text-4xl font-black tracking-tight">Don't miss what matters.</h2>
            </div>
            <Button asChild variant="ghost" className="font-ui font-semibold">
              <Link to="/news">View all news <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { tag: "Scholarships", color: "text-secondary", title: "Shell Nigeria 2026 Tertiary Scholarship Now Open", excerpt: "Undergraduates in Nigerian universities are invited to apply for the annual grant.", img: heroImg },
              { tag: "Platform", color: "text-highlight", title: "EduPulse IT Academy Launches Data Science Track", excerpt: "Bringing professional data analytics to high-school grads in partnership with global firms.", img: student2 },
              { tag: "Exams", color: "text-primary", title: "JAMB CBT 2026: Essential Success Checklist", excerpt: "A comprehensive guide for candidates preparing for the upcoming UTME.", img: student1 },
            ].map((n) => (
              <article key={n.title} className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={n.img} alt="" loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${n.color}`}>{n.tag}</span>
                  <h3 className="font-ui font-semibold leading-snug mt-2 mb-2">{n.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{n.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-muted/40">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="font-ui text-xs uppercase tracking-[0.25em] font-bold text-primary mb-3">FAQ</p>
            <h2 className="font-display text-4xl font-black">Common questions, clear answers.</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Is EduPulse free to use?", a: "The CBT practice library, community, and a starter set of courses are free. Premium courses, one-on-one counseling and private tutor sessions are paid." },
              { q: "Which exams does the CBT engine cover?", a: "WAEC, JAMB, NECO, Post-UTME and selected professional exams. We add subjects and past-question years every term." },
              { q: "How are tutors and counselors vetted?", a: "Every counselor is interviewed and reference-checked. Tutors complete a teaching assessment and ongoing peer review." },
              { q: "Is the Islamic Academy taught by qualified teachers?", a: "Yes — every instructor in the Islamic Academy holds a recognized qualification in their area (Tajweed, Aqeedah, Seerah, etc)." },
            ].map((f, i) => (
              <details key={i} className="group bg-card border border-border rounded-xl p-5 open:shadow-md transition-all">
                <summary className="cursor-pointer font-ui font-semibold flex items-center justify-between list-none">
                  {f.q}
                  <span className="size-6 rounded-full bg-primary/10 text-primary grid place-items-center text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="link"><Link to="/faq">See all FAQs <ArrowRight className="ml-1 size-4" /></Link></Button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl gradient-hero text-white rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
          <Sparkles className="absolute top-8 right-8 size-6 text-accent animate-float" aria-hidden />
          <BadgeCheck className="absolute bottom-8 left-8 size-6 text-accent/70 animate-float" style={{ animationDelay: "1s" }} aria-hidden />
          <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-balance">Your success story starts today.</h2>
          <p className="mt-4 text-white/80 max-w-xl mx-auto">Join 120,000 students learning, building and winning across Africa with EduPulse.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-accent hover:text-accent-foreground font-ui font-bold">
              <Link to="/auth" search={{ tab: "signup" }}><GraduationCap className="size-4 mr-1" /> Create free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white font-ui font-bold">
              <Link to="/scholarships"><Award className="size-4 mr-1" /> Browse scholarships</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
