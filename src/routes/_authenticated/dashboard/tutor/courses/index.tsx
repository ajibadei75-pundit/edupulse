import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { PageFade } from "@/components/dashboard/PageFade";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, BookOpen, ArrowRight, Trash2 } from "lucide-react";
import { createCourse, deleteCourse, listMyAuthoredCourses } from "@/lib/courses.functions";

export const Route = createFileRoute("/_authenticated/dashboard/tutor/courses/")({
  head: () => ({ meta: [{ title: "My courses — Tutor" }] }),
  component: TutorCoursesPage,
});

function TutorCoursesPage() {
  const listFn = useServerFn(listMyAuthoredCourses);
  const createFn = useServerFn(createCourse);
  const delFn = useServerFn(deleteCourse);
  const qc = useQueryClient();
  const { data: courses = [] } = useQuery({ queryKey: ["tutor", "courses"], queryFn: () => listFn() });

  const [form, setForm] = useState({ title: "", description: "", category: "Technology", level: "Beginner", department: "", duration_hours: 4 });

  const create = useMutation({
    mutationFn: () => createFn({ data: { ...form, duration_hours: Number(form.duration_hours) } }),
    onSuccess: () => { toast.success("Course created"); setForm({ ...form, title: "", description: "" }); qc.invalidateQueries({ queryKey: ["tutor", "courses"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["tutor", "courses"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <DashboardShell>
      <PageFade>
        <div className="p-6 sm:p-10 max-w-6xl">
          <PageTitle title="My courses" subtitle="Author courses, add lessons, and publish to students." />

          <form
            onSubmit={(e) => { e.preventDefault(); if (form.title.trim()) create.mutate(); }}
            className="bg-card border border-border rounded-2xl p-6 grid sm:grid-cols-2 gap-3 mb-8"
          >
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Level</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5">
                {["Beginner","Intermediate","Advanced"].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Department (optional)</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" className="w-full rounded-lg border border-input bg-background px-3 py-2.5" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Duration (hrs)</label>
              <input type="number" min={0} value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5" />
            </div>
            <div className="sm:col-span-2">
              <Button disabled={create.isPending} className="rounded-lg"><Plus className="size-4 mr-1.5" />Create course</Button>
            </div>
          </form>

          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-ui font-bold text-lg mb-3 flex items-center gap-2"><BookOpen className="size-5" />Authored courses</h2>
            {(courses as any[]).length === 0 ? <p className="text-sm text-muted-foreground">No courses yet. Create your first one above.</p> : (
              <ul className="divide-y divide-border">
                {(courses as any[]).map((c) => (
                  <li key={c.id} className="py-3 flex flex-wrap items-center gap-3 justify-between">
                    <div>
                      <p className="font-ui font-semibold">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.category} · {c.level ?? "—"} {c.department ? `· ${c.department}` : ""} · {c.is_published ? <span className="text-secondary">Live</span> : "Draft"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="rounded-lg">
                        <Link to="/dashboard/tutor/courses/$courseId" params={{ courseId: c.id }}>Lessons <ArrowRight className="size-4 ml-1" /></Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg text-destructive" onClick={() => confirm("Delete course?") && remove.mutate(c.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </PageFade>
    </DashboardShell>
  );
}
