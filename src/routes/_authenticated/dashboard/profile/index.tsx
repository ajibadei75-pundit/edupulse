import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { getMyProfile, updateMyProfile } from "@/lib/app.functions";
import { getMyInviteCode } from "@/lib/parent.functions";
import { Button } from "@/components/ui/button";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/profile/")({
  head: () => ({ meta: [{ title: "Profile — EduPulse" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const getFn = useServerFn(getMyProfile);
  const updFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["profile","me"], queryFn: () => getFn() });
  const [form, setForm] = useState({ full_name: "", school: "", level: "", bio: "" });

  useEffect(() => {
    if (data) setForm({ full_name: data.full_name ?? "", school: data.school ?? "", level: data.level ?? "", bio: data.bio ?? "" });
  }, [data]);

  const m = useMutation({
    mutationFn: () => updFn({ data: form }),
    onSuccess: () => { toast.success("Profile updated."); qc.invalidateQueries({ queryKey: ["profile","me"] }); qc.invalidateQueries({ queryKey: ["dashboard","overview"] }); },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-2xl">
        <PageTitle title="Profile" subtitle="How you appear across EduPulse." />
        <form className="bg-card border border-border rounded-2xl p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
          <div>
            <label className="text-sm font-ui font-medium mb-1.5 block">Full name</label>
            <input required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">School</label>
              <input maxLength={120} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Level</label>
              <input maxLength={60} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" placeholder="e.g. SS3, 200 level" />
            </div>
          </div>
          <div>
            <label className="text-sm font-ui font-medium mb-1.5 block">Bio</label>
            <textarea maxLength={500} rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary resize-none" />
          </div>
          <Button type="submit" disabled={m.isPending} className="rounded-lg">{m.isPending ? "Saving…" : "Save changes"}</Button>
        </form>
      </div>
    </DashboardShell>
  );
}
