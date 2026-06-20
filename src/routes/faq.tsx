import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";

const FAQS = [
  { q: "Is EduPulse free to use?", a: "Yes — the CBT practice library, student community and a starter set of courses are free forever. Premium courses, private tutor bookings and one-on-one counseling are paid." },
  { q: "Which exams does the CBT engine cover?", a: "WAEC, JAMB, NECO, Post-UTME and a growing list of professional exams." },
  { q: "How are tutors vetted?", a: "Every tutor passes a subject-matter assessment, a sample-class review and ongoing student feedback monitoring." },
  { q: "Do I get a certificate?", a: "Yes. Every completed course issues a digital certificate with a QR code for verification." },
  { q: "Can my school or organization sponsor students?", a: "Yes — visit the Sponsors page or contact us. We support per-student, per-course and full-cohort sponsorships." },
  { q: "What payment methods are supported?", a: "Paystack, Flutterwave, Stripe and bank transfer. We add more local methods regularly." },
  { q: "Is the Islamic Academy taught by qualified teachers?", a: "Yes — every instructor holds a recognized qualification in their area (Tajweed, Aqeedah, Seerah, etc) and is interviewed before joining." },
  { q: "Is my data safe?", a: "Yes. We use industry-standard encryption at rest and in transit, role-based access, and you can request data deletion at any time." },
  { q: "Can I use EduPulse on a low-bandwidth connection?", a: "We optimize aggressively for data costs — audio counseling, downloadable PDFs and lightweight CBT mode are designed for low-data days." },
  { q: "Do you offer scholarships?", a: "We curate scholarship listings and we run a small in-house scholarship fund. Sign up to get personalized alerts when something matches your profile." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — EduPulse" },
      { name: "description", content: "Common questions about EduPulse: pricing, exams covered, tutor vetting, payments, certificates and data safety." },
      { property: "og:title", content: "EduPulse FAQ" },
      { property: "og:description", content: "Clear answers about how EduPulse works for students, parents and partners." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="FAQ" title="Common questions. Clear answers." />
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="group bg-card border border-border rounded-xl p-5 open:shadow-md transition-all" open={i === 0}>
              <summary className="cursor-pointer font-ui font-semibold flex items-center justify-between list-none">
                {f.q}
                <span className="size-6 rounded-full bg-primary/10 text-primary grid place-items-center text-lg leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
