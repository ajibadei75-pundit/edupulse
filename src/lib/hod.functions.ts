import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertHodOrAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role as string);
  const ok = roles.some((r: string) => ["hod", "admin", "super_admin"].includes(r));
  if (!ok) throw new Error("Forbidden — HOD or admin role required");
  return roles;
}

export const getMyDepartment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertHodOrAdmin(context);
    const { data } = await context.supabase.from("profiles").select("department,full_name").eq("id", context.userId).maybeSingle();
    return data;
  });

export const updateMyDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ department: z.string().min(2).max(120) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertHodOrAdmin(context);
    const { error } = await context.supabase.from("profiles").update({ department: data.department }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const hodOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertHodOrAdmin(context);
    const { data: me } = await context.supabase.from("profiles").select("department").eq("id", context.userId).maybeSingle();
    const department = me?.department ?? null;
    if (!department) return { department: null, courses: [], tutors: [], students: [], avgProgress: 0 };

    const [coursesRes, tutorsRes] = await Promise.all([
      context.supabase.from("courses").select("id,title,slug,category,level,is_published,created_by,duration_hours,created_at").eq("department", department).order("created_at", { ascending: false }),
      context.supabase.from("profiles").select("id,full_name,avatar_url,school").eq("department", department),
    ]);
    const courses = coursesRes.data ?? [];
    const courseIds = courses.map((c: any) => c.id);

    let students: any[] = [];
    let avgProgress = 0;
    if (courseIds.length) {
      const { data: enrolls } = await context.supabase
        .from("enrollments")
        .select("user_id,progress,course_id,enrolled_at,profiles(full_name,avatar_url),courses(title)")
        .in("course_id", courseIds)
        .order("enrolled_at", { ascending: false })
        .limit(100);
      students = enrolls ?? [];
      avgProgress = students.length ? Math.round(students.reduce((s, e) => s + (e.progress ?? 0), 0) / students.length) : 0;
    }

    return { department, courses, tutors: tutorsRes.data ?? [], students, avgProgress };
  });

export const hodPublishCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ courseId: z.string().uuid(), publish: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertHodOrAdmin(context);
    const { error } = await context.supabase.from("courses").update({ is_published: data.publish }).eq("id", data.courseId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
