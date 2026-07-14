import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Check } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your password — EduPulse" },
      { name: "description", content: "Set a new password for your EduPulse account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase auto-parses the recovery hash and fires PASSWORD_RECOVERY / SIGNED_IN
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated. Redirecting…");
      setTimeout(() => navigate({ to: "/dashboard" }), 1200);
    } catch (err: any) {
      toast.error(err.message ?? "Could not update password");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh grid place-items-center p-6 bg-muted/40">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6"><Logo /></div>
        <h1 className="font-display text-2xl font-black text-center">Set a new password</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Choose something strong you'll remember.</p>

        {!ready ? (
          <p className="text-xs text-center text-muted-foreground mt-6">
            Open this page from the reset link in your email. <br />
            <Link to="/auth" className="underline text-primary">Back to login</Link>
          </p>
        ) : done ? (
          <div className="mt-6 text-center text-sm text-secondary flex items-center justify-center gap-2">
            <Check className="size-4" /> Password updated
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <PasswordField label="New password" value={password} onChange={setPassword} show={show} setShow={setShow} />
            <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} show={show} setShow={setShow} />
            <Button type="submit" disabled={loading} className="w-full rounded-lg gap-2">
              {loading && <Loader2 className="size-4 animate-spin" />} Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, setShow }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; setShow: (b: boolean) => void;
}) {
  return (
    <div>
      <label className="text-sm font-ui font-medium mb-1.5 block">{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} required minLength={8}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 outline-none focus:border-primary text-sm" />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
