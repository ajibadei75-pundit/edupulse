import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Sun, Moon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/courses", label: "Courses" },
  { to: "/cbt", label: "CBT Practice" },
  { to: "/counseling", label: "Counseling" },
  { to: "/it-academy", label: "IT Academy" },
  { to: "/islamic-academy", label: "Islamic" },
  { to: "/community", label: "Community" },
  { to: "/scholarships", label: "Scholarships" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("edupulse-theme");
    const prefersDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("edupulse-theme", next ? "dark" : "light");
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all",
      scrolled ? "bg-background/85 backdrop-blur-lg border-b border-border" : "bg-background/40 backdrop-blur-md"
    )}>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1 font-ui text-sm">
          {NAV.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link key={n.to} to={n.to} className={cn(
                "px-3 py-2 rounded-lg font-medium transition-colors",
                active ? "text-primary bg-primary/10" : "text-foreground/70 hover:text-foreground hover:bg-muted"
              )}>{n.label}</Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-lg hover:bg-muted text-foreground/70 hover:text-foreground transition-colors">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {signedIn ? (
            <Button asChild size="sm" className="hidden sm:inline-flex rounded-full font-ui font-semibold">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex font-ui">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full font-ui font-semibold shadow-lg shadow-primary/20">
                <Link to="/auth" search={{ tab: "signup" }}>Sign Up</Link>
              </Button>
            </>
          )}
          <button className="lg:hidden p-2 rounded-lg hover:bg-muted" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background animate-fade-in">
          <nav className="px-4 py-3 grid gap-1 font-ui text-sm">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="px-3 py-2.5 rounded-lg hover:bg-muted font-medium">{n.label}</Link>
            ))}
            <Link to="/sponsors" className="px-3 py-2.5 rounded-lg hover:bg-muted font-medium">Sponsors</Link>
            <Link to="/about" className="px-3 py-2.5 rounded-lg hover:bg-muted font-medium">About</Link>
            <Link to="/contact" className="px-3 py-2.5 rounded-lg hover:bg-muted font-medium">Contact</Link>
            {!signedIn && (
              <Link to="/auth" className="px-3 py-2.5 rounded-lg hover:bg-muted font-medium">Login</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
