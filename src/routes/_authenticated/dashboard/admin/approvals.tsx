import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { listPendingStudents, listAllStudents, setStudentApproval } from "@/lib/admin-approval.functions";
import { Check, X, Clock4 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const fetchPending = useServerFn(listPendingStudents);
  const fetchAll = useServerFn(listAllStudents);
  const mutate = useServerFn(setStudentApproval);

  const pendingQ = useQuery({ queryKey: ["pending-students"], queryFn: () => fetchPending() });
  const allQ = useQuery({ queryKey: ["all-students"], queryFn: () => fetchAll(), enabled: tab === "all" });

  const m = useMutation({
    mutationFn: (v: { studentId: string; status: "approved" | "rejected" | "pending" }) => mutate({ data: v }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["pending-students"] });
      qc.invalidateQueries({ queryKey: ["all-students"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const list = tab === "pending" ? (pendingQ.data ?? []) : (allQ.data ?? []);

  return (
    <DashboardShell>
      <div className="px-4 lg:px-8 py-6">
        <PageTitle title="Student approvals" subtitle="Review and approve new students" />

        <div className="inline-flex rounded-xl bg-muted p-1 mb-4">
          <TabBtn active={tab === "pending"} onClick={() => setTab("pending")}>Pending {pendingQ.data?.length ? `(${pendingQ.data.length})` : ""}</TabBtn>
          <TabBtn active={tab === "all"} onClick={() => setTab("all")}>All students</TabBtn>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-12 text-center text-muted-foreground">
            <Clock4 className="size-8 mx-auto mb-3 opacity-60" />
            {tab === "pending" ? "No pending students right now." : "No students yet."}
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs font-ui uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">School</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Joined</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s: any) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {s.avatar_url ? <img src={s.avatar_url} className="size-8 rounded-full" alt="" /> : <div className="size-8 rounded-full bg-muted grid place-items-center text-xs font-bold">{(s.full_name ?? "?").slice(0,1).toUpperCase()}</div>}
                        <div>
                          <div className="font-medium">{s.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{s.level ?? "—"}{s.country ? ` · ${s.country}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{s.institution ?? s.school ?? "—"}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <StatusPill status={s.approval_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-2">
                        {s.approval_status !== "approved" && (
                          <button disabled={m.isPending} onClick={() => m.mutate({ studentId: s.id, status: "approved" })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:brightness-110 disabled:opacity-50">
                            <Check className="size-3.5" /> Approve
                          </button>
                        )}
                        {s.approval_status !== "rejected" && (
                          <button disabled={m.isPending} onClick={() => m.mutate({ studentId: s.id, status: "rejected" })} className="inline-flex items-center gap-1 rounded-lg border border-destructive text-destructive px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10 disabled:opacity-50">
                            <X className="size-3.5" /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`px-4 py-1.5 rounded-lg text-sm font-ui font-semibold ${active ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{children}</button>;
}

function StatusPill({ status }: { status: string }) {
  const cls = status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
    : status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}
