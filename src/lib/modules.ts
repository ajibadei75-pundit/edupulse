import {
  BookOpen, Brain, HeartHandshake, Code, Moon, Briefcase, Users, Award, Sparkles, Trophy
} from "lucide-react";

export type ModuleDef = {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: typeof BookOpen;
  href: string;
  color: "primary" | "secondary" | "accent" | "highlight";
  cta: string;
};

export const MODULES: ModuleDef[] = [
  { slug: "academics", title: "Academics", short: "WAEC · NECO · School", description: "Structured secondary curriculum with weekly classes, notes and quizzes.", icon: BookOpen, href: "/courses", color: "primary", cta: "Explore courses" },
  { slug: "cbt", title: "CBT Practice", short: "JAMB · Post-UTME", description: "20,000+ past questions. Real-exam simulation, instant marking, analytics.", icon: Brain, href: "/cbt", color: "secondary", cta: "Start a drill" },
  { slug: "counseling", title: "Counseling", short: "Academic · Career · Personal", description: "Book 1-on-1 sessions with vetted counselors for the decisions that matter.", icon: HeartHandshake, href: "/counseling", color: "highlight", cta: "Book a session" },
  { slug: "it-academy", title: "IT Skills Academy", short: "Code · Design · Data", description: "Web dev, UI/UX, Python, data analytics — with projects and certificates.", icon: Code, href: "/it-academy", color: "primary", cta: "Browse tracks" },
  { slug: "islamic-academy", title: "Islamic Academy", short: "Qur’an · Tajweed · Studies", description: "Tajweed, Hifz, Aqeedah, Seerah — taught by qualified instructors.", icon: Moon, href: "/islamic-academy", color: "accent", cta: "Enter academy" },
  { slug: "career", title: "Career Development", short: "CV · Interviews · Brand", description: "Land your first internship with mentorship, CV reviews and interview drills.", icon: Briefcase, href: "/courses", color: "secondary", cta: "Get coached" },
  { slug: "community", title: "Community", short: "Forums · Groups · Mentors", description: "Study groups, peer discussions and mentor circles — find your people.", icon: Users, href: "/community", color: "highlight", cta: "Join the feed" },
  { slug: "scholarships", title: "Scholarships", short: "Funding · Internships", description: "Curated, deadline-aware feed of grants, fellowships and opportunities.", icon: Award, href: "/scholarships", color: "accent", cta: "Find funding" },
];

export const colorClasses = (c: ModuleDef["color"]) => ({
  bg: { primary: "bg-primary/10", secondary: "bg-secondary/10", accent: "bg-accent/15", highlight: "bg-highlight/10" }[c],
  text: { primary: "text-primary", secondary: "text-secondary", accent: "text-accent-foreground", highlight: "text-highlight" }[c],
  textPure: { primary: "text-primary", secondary: "text-secondary", accent: "text-accent", highlight: "text-highlight" }[c],
  border: { primary: "hover:border-primary/30", secondary: "hover:border-secondary/30", accent: "hover:border-accent/40", highlight: "hover:border-highlight/30" }[c],
  ring: { primary: "ring-primary/20", secondary: "ring-secondary/20", accent: "ring-accent/30", highlight: "ring-highlight/20" }[c],
});

export { Sparkles, Trophy };
