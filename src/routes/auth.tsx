import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional(),
  redirect: z.string().optional(),
}).optional();

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login or sign up — EduPulse" },
      { name: "description", content: "Sign in to your EduPulse student account or create a new one — free, with email or Google." },
    ],
  }),
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { tab, redirect } = Route.useSearch() ?? {};
  const [mode, setMode] = useState<"login" | "signup">(tab ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/dashboard" });
    });
  }, [navigate, redirect]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to EduPulse!");
        navigate({ to: redirect ?? "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: redirect ?? "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (result.error) { toast.error("Google sign-in failed"); setLoading(false); return; }
      if (result.redirected) return;
      navigate({ to: redirect ?? "/dashboard" });
    } catch {
      toast.error("Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      <aside className="hidden lg:flex relative gradient-hero text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-25" aria-hidden>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[500px] rounded-full border border-white/20 animate-pulse-ring" />
        </div>
        <div className="relative"><Logo variant="light" /></div>
        <div className="relative space-y-4">
          <h2 className="font-display text-4xl font-black tracking-tight">Learn. Grow. Excel.</h2>
          <p className="text-white/80 max-w-md">Your CBT practice, courses, mentor and community — all behind one login.</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>✓ Free CBT drills across JAMB / WAEC / NECO</li>
            <li>✓ Personalized course recommendations</li>
            <li>✓ Counseling, scholarships, certificates</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} EduPulse</p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="font-display text-3xl font-black tracking-tight">
            {mode === "login" ? "Welcome back." : "Create your account."}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Sign in to continue your learning." : "Free forever for students."}
          </p>

          <div className="mt-6 grid grid-cols-2 p-1 bg-muted rounded-lg text-sm">
            <button type="button" className={`py-2 rounded-md font-ui font-semibold transition-all ${mode === "login" ? "bg-card shadow" : "text-muted-foreground"}`} onClick={() => setMode("login")}>Login</button>
            <button type="button" className={`py-2 rounded-md font-ui font-semibold transition-all ${mode === "signup" ? "bg-card shadow" : "text-muted-foreground"}`} onClick={() => setMode("signup")}>Sign up</button>
          </div>

          <Button onClick={handleGoogle} disabled={loading} variant="outline" className="w-full mt-6 rounded-lg font-ui font-semibold gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />or<div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-ui font-medium mb-1.5 block" htmlFor="name">Full name</label>
                <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
              </div>
            )}
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block" htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block" htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-lg font-ui font-semibold gap-2">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            By continuing you agree to EduPulse's <Link to="/" className="underline">Terms</Link> and acknowledge our <Link to="/" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
