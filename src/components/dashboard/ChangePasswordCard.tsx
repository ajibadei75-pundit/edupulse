import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

export function ChangePasswordCard() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== pw2) return toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    setPw(""); setPw2("");
  }

  return (
    <section className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1"><KeyRound className="size-4 text-primary" /><h2 className="font-ui font-bold">Change password</h2></div>
      <p className="text-sm text-muted-foreground mb-4">Update your account password. Minimum 8 characters.</p>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 max-w-xl">
        <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password"
          className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
        <input type="password" required minLength={8} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm password"
          className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
        <div className="sm:col-span-2"><Button type="submit" disabled={busy} className="rounded-lg">{busy ? "Updating…" : "Update password"}</Button></div>
      </form>
    </section>
  );
}
