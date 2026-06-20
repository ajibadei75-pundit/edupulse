import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — EduPulse" },
      { name: "description", content: "Reach the EduPulse team — for support, partnership, press or general questions." },
      { property: "og:title", content: "Contact EduPulse" },
      { property: "og:description", content: "Get in touch about support, partnerships, sponsorships or careers." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  return (
    <SiteLayout>
      <PageHero eyebrow="Contact" title="Tell us what you need." subtitle="Support, partnership, press or general questions — we answer within one working day." />
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-10 items-start">
          <div className="space-y-6">
            <div>
              <h3 className="font-ui font-bold text-lg mb-1">Reach us directly</h3>
              <p className="text-sm text-muted-foreground">Or scroll through our FAQ first — most answers are there.</p>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3"><Mail className="size-4 text-primary" /> hello@edupulse.africa</li>
              <li className="flex items-center gap-3"><Phone className="size-4 text-primary" /> +234 800 EDUPULSE</li>
              <li className="flex items-center gap-3"><MapPin className="size-4 text-primary" /> Lagos · Abuja · Online</li>
            </ul>
            <div className="aspect-video bg-muted rounded-2xl border border-border grid place-items-center text-muted-foreground text-sm">Map placeholder</div>
          </div>
          <form className="bg-card border border-border rounded-2xl p-7 space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent — we'll be in touch within 1 working day."); setForm({ name: "", email: "", message: "" }); }}>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block" htmlFor="c-name">Full name</label>
              <input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block" htmlFor="c-email">Email</label>
              <input id="c-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block" htmlFor="c-msg">Message</label>
              <textarea id="c-msg" required rows={5} maxLength={1500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary resize-none" />
            </div>
            <Button type="submit" className="w-full rounded-lg font-ui font-semibold">Send message</Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
