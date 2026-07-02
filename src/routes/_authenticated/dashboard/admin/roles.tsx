import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { getMyRoles } from "@/lib/app.functions";
import { searchUsers, assignRole, revokeRole } from "@/lib/superadmin.functions";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, X, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/roles")({
  head: () => ({ meta: [{ title: "Role management — EduPulse" }] }),
  component: RolesPage,
});

const ROLE_OPTIONS = [
  { value: "tutor", label: "Subject Tutor" },
  { value: "hod", label: "Head of Department" },
  { value: "cbt_admin", label: "CBT Admin" },
  { value: "content_admin", label: "Content Admin" },
  { value: "finance_admin", label: "Finance Admin" },
  { value: "islamic_admin", label: "Islamic Admin" },
  { value: "islamic_organizer", label: "Islamic Organizer" },
  { value: "parent", label: "Parent" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

function RolesPage() {
  const qc = useQueryClient();
  const rolesFn = useServerFn(getMyRoles);
  const searchFn = useServerFn(searchUsers);
  const assignFn = useServerFn(assignRole);
  const revokeFn = useServerFn(revokeRole);
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<{ id: string; role: string }>({ id: "", role: "tutor" });

  const { data: myRoles = [] } = useQuery({ queryKey: ["roles"], queryFn: () => rolesFn() });
  const isSuper = (myRoles as string[]).includes("super_admin");

  const list = useQuery({ queryKey: ["admin-users", q], queryFn: () => searchFn({ data: { q } }), enabled: isSuper });

  const assign = useMutation({
    mutationFn: (v: { userId: string; role: string }) => assignFn({ data: v as any }),
    onSuccess: () => { toast.success("Role granted"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: (v: { userId: string; role: string }) => revokeFn({ data: v as any }),
    onSuccess: () => { toast.success("Role revoked"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isSuper) {
    return (
      <DashboardShell>
        <div className="p-10 max-w-xl">
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <ShieldOff className="size-10 text-destructive mx-auto mb-3" />
            <h1 className="font-display text-2xl font-black">Super admin only</h1>
            <p className="text-muted-foreground mt-2">Only the super administrator can assign roles.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-5xl">
        <PageTitle title="Team & roles" subtitle="Grant or revoke roles for tutors, HODs, counselors, admins, and organizers." />

        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users by name…"
              className="flex-1 bg-transparent outline-none text-sm py-1.5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Current roles</th>
                <th className="text-right py-3 px-4">Grant role</th>
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).map((u: any) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? <img src={u.avatar_url} className="size-8 rounded-full" alt="" /> : <div className="size-8 rounded-full bg-muted grid place-items-center text-xs font-bold">{(u.full_name ?? "?").slice(0,1).toUpperCase()}</div>}
                      <div>
                        <div className="font-medium">{u.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{u.school ?? ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(u.roles ?? []).length === 0 ? <span className="text-xs text-muted-foreground">— none —</span> :
                        (u.roles as string[]).map((r) => (
                          <span key={r} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 font-semibold">
                            {r}
                            <button title="Revoke" onClick={() => revoke.mutate({ userId: u.id, role: r })} className="hover:text-destructive"><X className="size-3" /></button>
                          </span>
                        ))
                      }
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex gap-2">
                      <select
                        value={pending.id === u.id ? pending.role : "tutor"}
                        onChange={(e) => setPending({ id: u.id, role: e.target.value })}
                        className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
                        {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <Button size="sm" onClick={() => assign.mutate({ userId: u.id, role: pending.id === u.id ? pending.role : "tutor" })} className="rounded-lg gap-1">
                        <ShieldCheck className="size-3.5" /> Grant
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
