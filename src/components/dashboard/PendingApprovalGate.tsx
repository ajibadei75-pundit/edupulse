import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock4, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { getMyApprovalStatus } from "@/lib/admin-approval.functions";

export function PendingApprovalGate({ children }: { children: ReactNode }) {
  const fetchStatus = useServerFn(getMyApprovalStatus);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["my-approval"],
    queryFn: () => fetchStatus(),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) return <>{children}</>;
  if (data.approved) return <>{children}</>;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const rejected = data.status === "rejected";

  return (
    <div className="min-h-dvh grid place-items-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md text-center bg-card border border-border rounded-3xl shadow-xl p-8">
        <div className="mx-auto grid place-items-center size-16 rounded-2xl bg-accent/15 text-accent mb-5">
          <Clock4 className="size-7" />
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight">
          {rejected ? "Account not approved" : "Awaiting approval"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rejected
            ? "Your account was rejected. Please contact support if this was a mistake."
            : "Thanks for signing up to EduPulse. An administrator will review and approve your account shortly. You'll get a notification the moment it's done."}
        </p>
        <div className="mt-6 grid gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >Check again</button>
          <button
            onClick={signOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
