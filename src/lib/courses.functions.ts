import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertCanAuthor(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role as string);
  const ok = roles.some((r: string) => ["tutor", "hod", "admin", "super_admin", "content_admin"].includes(r));
  if (!ok) throw new Error("Forbidden — tutor/HOD/admin role required");
}

export const listMyAuthoredCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCanAuthor(context);
    const { data } = await context.supabase
      .from("courses")
      .select("id,slug,title,description,category,level,duration_hours,is_published,department,created_at")
      .eq("created_by", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

const CourseInput = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(2000).optional(),
  category: z.string().min(2).max(60),
  level: z.string().max(40).optional(),
  department: z.string().max(120).optional(),
  duration_hours: z.number().int().min(0).max(2000).optional(),
  cover_url: z.string().url().max(500).optional(),
  is_published: z.boolean().optional(),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "course";
}

export const createCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CourseInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertCanAuthor(context);
    const slug = `${slugify(data.title)}-${Math.random().toString(36).slice(2, 7)}`;
    const { data: row, error } = await context.supabase
      .from("courses")
      .insert({ ...data, slug, created_by: context.userId, is_published: data.is_published ?? false })
      .select("id,slug")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), patch: CourseInput.partial() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertCanAuthor(context);
    const { error } = await context.supabase.from("courses").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertCanAuthor(context);
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCourseLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ courseId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows } = await context.supabase
      .from("lessons")
      .select("id,title,content,video_url,position")
      .eq("course_id", data.courseId)
      .order("position", { ascending: true });
    return rows ?? [];
  });

export const addLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    courseId: z.string().uuid(),
    title: z.string().min(2).max(160),
    content: z.string().max(20000).optional(),
    video_url: z.string().url().max(500).optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertCanAuthor(context);
    const { data: last } = await context.supabase.from("lessons").select("position").eq("course_id", data.courseId).order("position", { ascending: false }).limit(1).maybeSingle();
    const position = ((last?.position as number | undefined) ?? 0) + 1;
    const { error } = await context.supabase.from("lessons").insert({
      course_id: data.courseId, title: data.title, content: data.content, video_url: data.video_url, position,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ courseId: z.string().uuid(), lessonId: z.string().uuid(), progress: z.number().int().min(0).max(100) }).parse(d))
  .handler(async ({ context, data }) => {
    // Ensure enrollment exists
    await context.supabase.from("enrollments").upsert({ user_id: context.userId, course_id: data.courseId }, { onConflict: "user_id,course_id" });
    const { error } = await context.supabase
      .from("enrollments")
      .update({ progress: data.progress, last_lesson_id: data.lessonId })
      .eq("user_id", context.userId)
      .eq("course_id", data.courseId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
