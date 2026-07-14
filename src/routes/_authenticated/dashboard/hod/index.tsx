import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { PageFade } from "@/components/dashboard/PageFade";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GraduationCap, Users, BookOpen, TrendingUp, CheckCircle2, EyeOff } from "lucide-react";
import { hodOverview, getMyDepartment, updateMyDepartment, hodPublishCourse } from "@/lib/hod.functions";

export const Route = createFileRoute("/_authenticated/dashboard/hod/")({
  head: () => ({ meta: [{ title: "HOD console — EduPulse" }] }),
  component: HodPage,
});

function HodPage() {
  const meFn = useServerFn(getMyDepartment);
  const updateDeptFn = useServerFn(updateMyDepartment);
  const overviewFn = useServerFn(hodOverview);
  const publishFn = useServerFn(hodPublishCourse);
  const qc = useQueryClient();

  const { data: me } = useQuery({ queryKey: ["hod", "me"], queryFn: () => meFn() });
  const { data: overview, isLoading } = useQuery({ queryKey: ["hod", "overview"], queryFn: () => overviewFn() });

  const [dept, setDept] = useState("");

  const setDepartment = useMutation({
    mutationFn: (department: string) => updateDeptFn({ data: { department } }),
    onSuccess: () => { toast.success("Department updated"); qc.invalidateQueries({ queryKey: ["hod"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const togglePublish = useMutation({
    mutationFn: (v: { courseId: string; publish: boolean }) => publishFn({ data: v }),
    onSuccess: () => { toast.success("Course updated"); qc.invalidateQueries({ queryKey: ["hod", "overview"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const needsDept = !me?.department;

  return (
    <DashboardShell>
      <PageFade>
        <div className="p-4 sm:p-6 lg:p-10 max-w-6xl">
          <PageTitle title="Head of Department" subtitle="Oversee tutors, courses, and student performance across your department." />

          {needsDept ? (
            <form
              className="bg-card border border-border rounded-2xl p-6 max-w-xl space-y-3"
              onSubmit={(e) => { e.preventDefault(); if (dept.trim()) setDepartment.mutate(dept.trim()); }}
            >
              <h2 className="font-ui font-bold text-lg">Set your department</h2>
              <p className="text-sm text-muted-foreground">We'll scope your dashboard to courses, tutors and students in this department.</p>
              <input
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
              />
              <Button disabled={setDepartment.isPending} className="rounded-lg">Save</Button>
            </form>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={GraduationCap} label="Department" value={me?.department ?? "—"} />
                <StatCard icon={BookOpen} label="Courses" value={overview?.courses.length ?? 0} />
                <StatCard icon={Users} label="Tutors / Students" value={`${overview?.tutors.length ?? 0} / ${overview?.students.length ?? 0}`} />
                <StatCard icon={TrendingUp} label="Avg progress" value={`${overview?.avgProgress ?? 0}%`} />
              </div>

              <section className="bg-card border border-border rounded-2xl p-6 mb-6">
                <h2 className="font-ui font-bold text-lg mb-3">Department courses</h2>
                {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (overview?.courses.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No courses tagged to this department yet. Tutors can tag their courses with “{me?.department}” when creating.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-2 pr-2">Title</th><th className="py-2 px-2">Category</th><th className="py-2 px-2">Level</th><th className="py-2 px-2">Status</th><th className="py-2 px-2 text-right">Action</th>
                      </tr></thead>
                      <tbody>
                        {overview!.courses.map((c: any) => (
                          <tr key={c.id} className="border-b border-border/60">
                            <td className="py-2 pr-2 font-medium">{c.title}</td>
                            <td className="py-2 px-2">{c.category}</td>
                            <td className="py-2 px-2">{c.level ?? "—"}</td>
                            <td className="py-2 px-2">
                              {c.is_published ? <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">Live</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Draft</span>}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <Button size="sm" variant="outline" className="rounded-lg"
                                onClick={() => togglePublish.mutate({ courseId: c.id, publish: !c.is_published })}>
                                {c.is_published ? <><EyeOff className="size-4 mr-1.5" />Unpublish</> : <><CheckCircle2 className="size-4 mr-1.5" />Publish</>}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-ui font-bold text-lg mb-3">Recent enrollments</h2>
                {(overview?.students.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground">No enrollments yet.</p> : (
                  <ul className="divide-y divide-border">
                    {overview!.students.slice(0, 20).map((e: any, i: number) => (
                      <li key={`${e.user_id}-${e.course_id}-${i}`} className="py-2.5 flex items-center justify-between text-sm">
                        <span className="truncate"><b>{e.profiles?.full_name ?? "Student"}</b> · {e.courses?.title ?? "Course"}</span>
                        <span className="text-muted-foreground">{e.progress ?? 0}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </PageFade>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-ui font-bold"><Icon className="size-4" />{label}</div>
      <p className="font-display text-2xl font-black mt-2">{value}</p>
    </div>
  );
}
