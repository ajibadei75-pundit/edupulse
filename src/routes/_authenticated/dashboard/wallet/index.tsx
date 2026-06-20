import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/wallet/")({
  head: () => ({ meta: [{ title: "Wallet — EduPulse" }] }),
  component: WalletPage,
});

function WalletPage() {
  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-3xl">
        <PageTitle title="Wallet & subscriptions" subtitle="Top-up, view invoices and manage premium subscriptions." />
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <Wallet className="size-12 text-primary mx-auto mb-3" />
          <h2 className="font-display text-2xl font-black">Coming soon</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">Paystack & Flutterwave integration arrives in the next release. Until then, premium subscriptions are managed manually — contact us.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
