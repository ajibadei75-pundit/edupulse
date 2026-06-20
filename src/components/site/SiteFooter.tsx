import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground mt-24">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="space-y-5">
            <Logo variant="light" />
            <p className="text-sm text-white/70 max-w-[34ch] leading-relaxed">
              The heartbeat of student success. One ecosystem for learning, exams, mentorship and opportunity across Africa.
            </p>
            <div className="space-y-2 text-sm text-white/70">
              <p className="flex items-center gap-2"><Mail className="size-4 text-accent" /> hello@edupulse.africa</p>
              <p className="flex items-center gap-2"><Phone className="size-4 text-accent" /> +234 800 EDUPULSE</p>
              <p className="flex items-center gap-2"><MapPin className="size-4 text-accent" /> Lagos · Abuja · Online</p>
            </div>
          </div>
          <div>
            <h5 className="font-ui font-semibold text-sm mb-4 text-accent uppercase tracking-wider">Ecosystem</h5>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link to="/courses" className="hover:text-accent transition-colors">Courses</Link></li>
              <li><Link to="/cbt" className="hover:text-accent transition-colors">CBT Practice</Link></li>
              <li><Link to="/it-academy" className="hover:text-accent transition-colors">IT Academy</Link></li>
              <li><Link to="/islamic-academy" className="hover:text-accent transition-colors">Islamic Academy</Link></li>
              <li><Link to="/community" className="hover:text-accent transition-colors">Community</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-ui font-semibold text-sm mb-4 text-accent uppercase tracking-wider">Support</h5>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link to="/counseling" className="hover:text-accent transition-colors">Counseling</Link></li>
              <li><Link to="/scholarships" className="hover:text-accent transition-colors">Scholarships</Link></li>
              <li><Link to="/sponsors" className="hover:text-accent transition-colors">Become a Partner</Link></li>
              <li><Link to="/faq" className="hover:text-accent transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-ui font-semibold text-sm mb-4 text-accent uppercase tracking-wider">Join the Pulse</h5>
            <p className="text-sm text-white/70 mb-3">Weekly opportunities, study guides and scholarship alerts.</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); }}>
              <input type="email" required placeholder="you@example.com" aria-label="Email" className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm outline-none focus:border-accent placeholder:text-white/40" />
              <button className="rounded-lg bg-accent text-accent-foreground font-semibold text-sm px-4 hover:brightness-110 transition-all">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="mt-16 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} EduPulse. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-accent">About</Link>
            <a href="#" className="hover:text-accent">Privacy</a>
            <a href="#" className="hover:text-accent">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
