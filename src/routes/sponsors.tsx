import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Heart, Building2, HandCoins, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/sponsors")({
  head: () => ({
    meta: [
      { title: "Sponsors & Partners — EduPulse" },
      { name: "description", content: "Sponsor a student, fund a course or partner with EduPulse to expand access to education across Africa." },
      { property: "og:title", content: "Partner with EduPulse" },
      { property: "og:description", content: "Companies, NGOs and individuals — invest in the next generation of African talent." },
    ],
  }),
  component: SponsorsPage,
});

function SponsorsPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Sponsorship & Partnership" title="Invest in the next generation." subtitle="Sponsor a student, fund a course or partner with EduPulse to widen access to education across Africa.">
        <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-accent hover:text-accent-foreground font-ui font-bold"><Link to="/contact">Become a partner</Link></Button>
      </PageHero>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Heart, t: "Sponsor a student", d: "Cover a full year of premium learning for a student in need." },
            { icon: Building2, t: "Sponsor a course", d: "Underwrite a full course track so it's free for thousands." },
            { icon: HandCoins, t: "Donate", d: "Any amount fuels our scholarship and counseling fund." },
            { icon: BarChart3, t: "Impact reporting", d: "Quarterly dashboards on the students and outcomes you funded." },
          ].map((p) => (
            <div key={p.t} className="bg-card border border-border rounded-2xl p-6">
              <p.icon className="size-6 text-primary mb-3" />
              <h3 className="font-ui font-bold mb-1">{p.t}</h3>
              <p className="text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/40">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-black mb-4">Already partnering with us</h2>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 opacity-70 mt-8">
            {["NUC","JAMB","WAEC","Andela","Stanbic","MTN Foundation","Mastercard","Shell"].map((p) => (
              <span key={p} className="font-display font-extrabold text-lg text-muted-foreground">{p}</span>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
