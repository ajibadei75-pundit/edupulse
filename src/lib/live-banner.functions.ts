import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ActiveLiveClass = {
  id: string;
  title: string;
  subject: string | null;
  meeting_url: string;
  starts_at: string;
  ends_at: string;
};

export const getActiveLiveClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ActiveLiveClass[]> => {
    const nowIso = new Date().toISOString();
    // window: classes that started in the last 6h
    const recent = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const [{ data: profile }, { data: enrolls }, { data: classes }] = await Promise.all([
      context.supabase.from("profiles").select("department").eq("id", context.userId).maybeSingle(),
      context.supabase.from("enrollments").select("course_id").eq("user_id", context.userId),
      context.supabase
        .from("live_classes")
        .select("id,title,subject,meeting_url,starts_at,duration_minutes,course_id,department")
        .gte("starts_at", recent)
        .lte("starts_at", nowIso)
        .order("starts_at", { ascending: false }),
    ]);

    const dept = (profile?.department as string | null) ?? null;
    const enrolledCourseIds = new Set((enrolls ?? []).map((e: any) => e.course_id as string));
    const now = Date.now();

    return (classes ?? [])
      .map((c: any) => {
        const endsAt = new Date(new Date(c.starts_at).getTime() + (c.duration_minutes ?? 60) * 60_000);
        return { ...c, ends_at: endsAt.toISOString() };
      })
      .filter((c: any) => new Date(c.ends_at).getTime() > now)
      .filter((c: any) => {
        if (c.course_id && enrolledCourseIds.has(c.course_id)) return true;
        if (c.department && dept && c.department === dept) return true;
        if (!c.course_id && !c.department) return true; // open to all
        return false;
      })
      .map((c: any) => ({
        id: c.id,
        title: c.title,
        subject: c.subject ?? null,
        meeting_url: c.meeting_url,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
      }));
  });
