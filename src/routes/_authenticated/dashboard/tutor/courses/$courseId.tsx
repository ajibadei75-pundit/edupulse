import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { PageFade } from "@/components/dashboard/PageFade";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, ArrowLeft, Video, FileText } from "lucide-react";
import { addLesson, listCourseLessons, updateCourse } from "@/lib/courses.functions";

export const Route = createFileRoute("/_authenticated/dashboard/tutor/courses/$courseId")({
  head: () => ({ meta: [{ title: "Course lessons — Tutor" }] }),
  component: CourseEditor,
});

function CourseEditor() {
  const { courseId } = Route.useParams();
  const listFn = useServerFn(listCourseLessons);
  const addFn = useServerFn(addLesson);
  const updateFn = useServerFn(updateCourse);
  const qc = useQueryClient();
  const { data: lessons = [] } = useQuery({ queryKey: ["lessons", courseId], queryFn: () => listFn({ data: { courseId } }) });

  const [l, setL] = useState({ title: "", content: "", video_url: "" });

  const add = useMutation({
    mutationFn: () => addFn({ data: { courseId, title: l.title, content: l.content || undefined, video_url: l.video_url || undefined } }),
    onSuccess: () => { toast.success("Lesson added"); setL({ title: "", content: "", video_url: "" }); qc.invalidateQueries({ queryKey: ["lessons", courseId] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const publish = useMutation({
    mutationFn: (v: boolean) => updateFn({ data: { id: courseId, patch: { is_published: v } } }),
    onSuccess: () => toast.success("Course updated"),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <DashboardShell>
      <PageFade>
        <div className="p-6 sm:p-10 max-w-4xl">
          <Link to="/dashboard/tutor/courses" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-3"><ArrowLeft className="size-4" /> Back to courses</Link>
          <PageTitle title="Course lessons" subtitle="Add ordered lessons. Students see them in this order." action={
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-lg" onClick={() => publish.mutate(true)}>Publish</Button>
              <Button variant="ghost" className="rounded-lg" onClick={() => publish.mutate(false)}>Unpublish</Button>
            </div>
          } />

          <form className="bg-card border border-border rounded-2xl p-6 space-y-3 mb-6"
            onSubmit={(e) => { e.preventDefault(); if (l.title.trim()) add.mutate(); }}>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Lesson title</label>
              <input required value={l.title} onChange={(e) => setL({ ...l, title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">External video URL (Zoom/Meet/YouTube)</label>
              <input value={l.video_url} onChange={(e) => setL({ ...l, video_url: e.target.value })} placeholder="https://…" className="w-full rounded-lg border border-input bg-background px-3 py-2.5" />
            </div>
            <div>
              <label className="text-sm font-ui font-medium mb-1.5 block">Notes / transcript</label>
              <textarea rows={4} value={l.content} onChange={(e) => setL({ ...l, content: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5" />
            </div>
            <Button disabled={add.isPending} className="rounded-lg"><Plus className="size-4 mr-1.5" />Add lesson</Button>
          </form>

          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-ui font-bold text-lg mb-3">Lessons ({(lessons as any[]).length})</h2>
            {(lessons as any[]).length === 0 ? <p className="text-sm text-muted-foreground">No lessons yet.</p> : (
              <ol className="space-y-3 list-decimal pl-5">
                {(lessons as any[]).map((ln) => (
                  <li key={ln.id}>
                    <p className="font-ui font-semibold">{ln.title}</p>
                    <p className="text-xs text-muted-foreground flex flex-wrap gap-3">
                      {ln.video_url && <a className="inline-flex items-center gap-1 text-primary" href={ln.video_url} target="_blank" rel="noreferrer"><Video className="size-3" />Video</a>}
                      {ln.content && <span className="inline-flex items-center gap-1"><FileText className="size-3" />Notes</span>}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </PageFade>
    </DashboardShell>
  );
}
