import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { enrollInCourse, getMyEnrollments, listAllCourses } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/courses/")({
  head: () => ({ meta: [{ title: "Courses — EduPulse Dashboard" }] }),
  component: CoursesDash,
});

function CoursesDash() {
  const fn1 = useServerFn(getMyEnrollments);
  const fn2 = useServerFn(listAllCourses);
  const enrollFn = useServerFn(enrollInCourse);
  const qc = useQueryClient();
  const { data: enrolls = [] } = useQuery({ queryKey: ["enrollments"], queryFn: () => fn1() });
  const { data: catalog = [] } = useQuery({ queryKey: ["catalog"], queryFn: () => fn2() });

  const enrolledIds = new Set((enrolls as any[]).map((e) => e.courses?.id));
  const m = useMutation({
    mutationFn: (courseId: string) => enrollFn({ data: { courseId } }),
    onSuccess: () => { toast.success("Enrolled."); qc.invalidateQueries({ queryKey: ["enrollments"] }); qc.invalidateQueries({ queryKey: ["dashboard","overview"] }); },
    onError: (e: any) => toast.error(e.message ?? "Could not enroll"),
  });

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-6xl">
        <PageTitle title="Courses" subtitle="Continue your enrolled tracks or pick up something new." />

        <h2 className="font-ui font-bold mb-3">My courses</h2>
        {(enrolls as any[]).length === 0 ? (
          <p className="text-sm text-muted-foreground mb-10">Not enrolled in anything yet. Pick a course below to start.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {(enrolls as any[]).map((e) => (
              <div key={e.id} className="bg-card border border-border rounded-2xl p-5">
                <BookOpen className="size-5 text-primary mb-2" />
                <h3 className="font-ui font-semibold leading-tight">{e.courses?.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{e.courses?.category}</p>
                <Progress value={e.progress} className="mt-3 h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">{e.progress}% complete</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-ui font-bold mb-3">Browse the catalog</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(catalog as any[]).map((c) => {
            const enrolled = enrolledIds.has(c.id);
            return (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col">
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary">{c.category}</div>
                <h3 className="font-ui font-bold mt-1 mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{c.description}</p>
                <div className="flex items-center text-xs text-muted-foreground gap-3 mb-3"><span><Clock className="size-3 inline mr-1" /> {c.duration_hours ?? 30} hrs</span><span>· {c.level ?? "All levels"}</span></div>
                <Button disabled={enrolled || m.isPending} onClick={() => m.mutate(c.id)} size="sm" className="mt-auto rounded-lg">
                  {enrolled ? "Enrolled" : <><Plus className="size-3.5 mr-1" /> Enroll</>}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
