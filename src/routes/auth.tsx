import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { completeOnboarding } from "@/lib/tutor.functions";

const searchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional(),
  redirect: z.string().optional(),
}).optional();

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login or sign up — EduPulse" },
      { name: "description", content: "Sign in to your EduPulse student account or create a new one — free, with email, phone or Google." },
    ],
  }),
  validateSearch: searchSchema,
  component: AuthPage,
});

const COUNTRIES = ["Nigeria","Ghana","Kenya","South Africa","Uganda","Cameroon","Other"];
const LEVELS = ["JSS1-3","SS1","SS2","SS3","100 level","200 level","300 level","400 level","500 level","Postgraduate","Other"];
const INTERESTS = ["WAEC prep","JAMB / Post-UTME","NECO","Coding","Design","Data analytics","Islamic studies","Career mentorship","Scholarships","English","Maths","Sciences"];

function AuthPage() {
  const navigate = useNavigate();
  const { tab, redirect } = Route.useSearch() ?? {};
  const [mode, setMode] = useState<"login" | "signup">(tab ?? "login");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/dashboard" });
    });
  }, [navigate, redirect]);

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      <aside className="hidden lg:flex relative gradient-hero text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-25" aria-hidden>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[500px] rounded-full border border-white/20 animate-pulse-ring" />
        </div>
        <div className="relative"><Logo variant="light" /></div>
        <div className="relative space-y-4">
          <h2 className="font-display text-4xl font-black tracking-tight">Learn. Grow. Excel.</h2>
          <p className="text-white/80 max-w-md">Your CBT practice, courses, AI tutor and community — all behind one login.</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>✓ Free CBT drills across JAMB / WAEC / NECO</li>
            <li>✓ AI study assistant — explain, summarize, quiz</li>
            <li>✓ Counseling, scholarships, certificates</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} EduPulse</p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden justify-center mb-6"><Logo /></div>
          <div className="hidden lg:flex justify-center mb-4 opacity-90"><Logo /></div>
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

          {mode === "login" ? <LoginPanel loading={loading} setLoading={setLoading} redirect={redirect} /> : <SignupWizard redirect={redirect} />}

          <p className="mt-6 text-xs text-center text-muted-foreground">
            By continuing you agree to EduPulse's <Link to="/" className="underline">Terms</Link> and <Link to="/" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}

function LoginPanel({ loading, setLoading, redirect }: { loading: boolean; setLoading: (b: boolean) => void; redirect?: string }) {
  const navigate = useNavigate();
  const [method, setMethod] = useState<"email"|"phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (result.error) { toast.error("Google sign-in failed"); setLoading(false); return; }
      if (result.redirected) return;
      navigate({ to: redirect ?? "/dashboard" });
    } catch { toast.error("Google sign-in failed"); setLoading(false); }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back."); navigate({ to: redirect ?? "/dashboard" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Authentication failed"); }
    finally { setLoading(false); }
  }

  async function sendOtp() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setOtpSent(true); toast.success("Code sent. Check your phone.");
    } catch (err: any) {
      toast.error(err.message?.includes("provider") ? "Phone login is not enabled yet. Ask the admin to enable Phone Auth." : (err.message ?? "Failed"));
    } finally { setLoading(false); }
  }

  async function verifyOtp() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (error) throw error;
      toast.success("Welcome."); navigate({ to: redirect ?? "/dashboard" });
    } catch (err: any) { toast.error(err.message ?? "Invalid code"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <Button onClick={handleGoogle} disabled={loading} variant="outline" className="w-full mt-6 rounded-lg font-ui font-semibold gap-2">
        <GoogleIcon /> Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />or<div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs mb-4">
        <button type="button" className={`py-1.5 rounded-md font-ui font-semibold ${method === "email" ? "bg-card shadow" : "text-muted-foreground"}`} onClick={() => setMethod("email")}>Email</button>
        <button type="button" className={`py-1.5 rounded-md font-ui font-semibold ${method === "phone" ? "bg-card shadow" : "text-muted-foreground"}`} onClick={() => setMethod("phone")}>Phone</button>
      </div>

      {method === "email" ? (
        <form onSubmit={handleEmail} className="space-y-3">
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
          <Button type="submit" disabled={loading} className="w-full rounded-lg font-ui font-semibold gap-2">
            {loading && <Loader2 className="size-4 animate-spin" />} Sign in
          </Button>
        </form>
      ) : (
        <div className="space-y-3">
          <Field label="Phone (with country code)" type="tel" value={phone} onChange={setPhone} placeholder="+2348012345678" required />
          {otpSent && <Field label="6-digit code" type="text" value={otp} onChange={setOtp} maxLength={6} required />}
          {!otpSent ? (
            <Button onClick={sendOtp} disabled={loading || !phone} className="w-full rounded-lg gap-2">{loading && <Loader2 className="size-4 animate-spin" />} Send code</Button>
          ) : (
            <Button onClick={verifyOtp} disabled={loading || otp.length < 6} className="w-full rounded-lg gap-2">{loading && <Loader2 className="size-4 animate-spin" />} Verify & sign in</Button>
          )}
        </div>
      )}
    </>
  );
}

function SignupWizard({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const onboardFn = useServerFn(completeOnboarding);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", phone: "",
    country: "Nigeria", institution: "", level: "",
    interests: [] as string[], goals: "",
    role: "student" as "student"|"tutor"|"parent",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }
  function toggleInterest(t: string) { set("interests", form.interests.includes(t) ? form.interests.filter((x) => x !== t) : [...form.interests, t]); }

  async function handleGoogle() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (result.error) { toast.error("Google sign-in failed"); return; }
      if (result.redirected) return;
      navigate({ to: redirect ?? "/dashboard" });
    } catch { toast.error("Google sign-in failed"); }
  }

  async function finalSubmit() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: form.full_name } },
      });
      if (error) throw error;
      // best-effort onboarding write — auth may need email confirm; ignore if no session yet
      try { await onboardFn({ data: { full_name: form.full_name, phone: form.phone, country: form.country, institution: form.institution, level: form.level, interests: form.interests, goals: form.goals, role: form.role } }); } catch { /* deferred */ }
      toast.success("Account created. Welcome to EduPulse!");
      navigate({ to: redirect ?? "/dashboard" });
    } catch (err: any) { toast.error(err.message ?? "Signup failed"); }
    finally { setLoading(false); }
  }

  const canNext =
    step === 1 ? form.full_name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6 :
    step === 2 ? form.country && form.level :
    step === 3 ? true : true;

  return (
    <>
      <Button onClick={handleGoogle} variant="outline" className="w-full mt-6 rounded-lg font-ui font-semibold gap-2">
        <GoogleIcon /> Sign up with Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />or fill in details<div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex items-center gap-2 mb-5">
        {[1,2,3,4].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`size-7 rounded-full grid place-items-center text-xs font-bold ${s < step ? "bg-secondary text-secondary-foreground" : s === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s < step ? <Check className="size-3.5" /> : s}
            </div>
            {s < 4 && <div className={`flex-1 h-0.5 ${s < step ? "bg-secondary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <Field label="Full name" value={form.full_name} onChange={(v) => set("full_name", v)} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} required />
          <Field label="Phone (optional)" type="tel" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+2348012345678" />
          <Field label="Password (min 6 chars)" type="password" value={form.password} onChange={(v) => set("password", v)} minLength={6} required />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <Select label="Country" value={form.country} onChange={(v) => set("country", v)} options={COUNTRIES} />
          <Field label="Institution / school" value={form.institution} onChange={(v) => set("institution", v)} placeholder="e.g. University of Lagos" />
          <Select label="Level" value={form.level} onChange={(v) => set("level", v)} options={["", ...LEVELS]} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-ui font-medium mb-2 block">Interests <span className="text-muted-foreground font-normal">(pick any)</span></label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((t) => {
                const on = form.interests.includes(t);
                return <button key={t} type="button" onClick={() => toggleInterest(t)} className={`text-xs px-3 py-1.5 rounded-full border transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>{t}</button>;
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-ui font-medium mb-1.5 block">Your goal</label>
            <textarea maxLength={500} rows={3} value={form.goals} onChange={(e) => set("goals", e.target.value)} placeholder="e.g. Score 300+ in JAMB and study Medicine."
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary text-sm resize-none" />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">I am signing up as:</p>
          {([
            { v: "student", label: "Student", desc: "Take courses, CBT, get AI tutoring" },
            { v: "tutor", label: "Tutor", desc: "Create content and CBT questions" },
            { v: "parent", label: "Parent / Guardian", desc: "Monitor a child's progress" },
          ] as const).map((o) => (
            <button key={o.v} type="button" onClick={() => set("role", o.v)} className={`w-full text-left p-3 rounded-xl border-2 transition ${form.role === o.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
              <div className="font-ui font-bold text-sm">{o.label}</div>
              <div className="text-xs text-muted-foreground">{o.desc}</div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-2">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="rounded-lg gap-1.5"><ArrowLeft className="size-4" /> Back</Button>
        ) : <span />}
        {step < 4 ? (
          <Button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)} className="rounded-lg gap-1.5">Next <ArrowRight className="size-4" /></Button>
        ) : (
          <Button type="button" onClick={finalSubmit} disabled={loading} className="rounded-lg gap-2">{loading && <Loader2 className="size-4 animate-spin" />} Create account</Button>
        )}
      </div>
    </>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder, minLength, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string; minLength?: number; maxLength?: number;
}) {
  return (
    <div>
      <label className="text-sm font-ui font-medium mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} minLength={minLength} maxLength={maxLength}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary text-sm" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-ui font-medium mb-1.5 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary text-sm">
        {options.map((o) => <option key={o} value={o}>{o || "Select…"}</option>)}
      </select>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
  );
}
