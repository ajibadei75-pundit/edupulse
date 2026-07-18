import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertTutorOrAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  const ok = roles.some((r: string) => ["tutor","admin","super_admin","cbt_admin","content_admin"].includes(r));
  if (!ok) throw new Error("Forbidden — tutor or admin role required");
}

export const listCbtSubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("cbt_subjects").select("id,slug,name,exam_type,question_count,duration_minutes,guidelines,department_id").order("name");
    return data ?? [];
  });

export const listDepartments = createServerFn({ method: "GET" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await sb.from("departments").select("id,name,slug,description").order("name");
    return data ?? [];
  });

export const upsertDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2).max(80),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    description: z.string().max(300).optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertTutorOrAdmin(context);
    const { error } = await context.supabase.from("departments").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertCbtSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2).max(120),
    slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
    exam_type: z.enum(["jamb","waec","neco","post_utme"]),
    department_id: z.string().uuid().nullable().optional(),
    duration_minutes: z.number().int().min(1).max(240).default(10),
    guidelines: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertTutorOrAdmin(context);
    const { error } = await context.supabase.from("cbt_subjects").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkInsertQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    subjectId: z.string().uuid(),
    questions: z.array(z.object({
      question: z.string().min(3).max(2000),
      option_a: z.string().min(1).max(500),
      option_b: z.string().min(1).max(500),
      option_c: z.string().min(1).max(500),
      option_d: z.string().min(1).max(500),
      correct_option: z.enum(["A","B","C","D"]),
      explanation: z.string().max(2000).optional(),
      difficulty: z.enum(["easy","medium","hard"]).optional(),
    })).min(1).max(500),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertTutorOrAdmin(context);
    const rows = data.questions.map((q) => ({ ...q, subject_id: data.subjectId }));
    const { error, count } = await context.supabase.from("cbt_questions").insert(rows, { count: "exact" });
    if (error) throw new Error(error.message);
    // refresh question_count
    const { count: total } = await context.supabase.from("cbt_questions")
      .select("id", { count: "exact", head: true }).eq("subject_id", data.subjectId);
    await context.supabase.from("cbt_subjects").update({ question_count: total ?? 0 }).eq("id", data.subjectId);
    return { inserted: count ?? rows.length };
  });

export const tutorStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertTutorOrAdmin(context);
    const [{ count: subjects }, { count: questions }, { count: courses }, { count: students }] = await Promise.all([
      context.supabase.from("cbt_subjects").select("id", { count: "exact", head: true }),
      context.supabase.from("cbt_questions").select("id", { count: "exact", head: true }),
      context.supabase.from("courses").select("id", { count: "exact", head: true }),
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    return { subjects: subjects ?? 0, questions: questions ?? 0, courses: courses ?? 0, students: students ?? 0 };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    full_name: z.string().min(1).max(120),
    phone: z.string().max(40).optional(),
    country: z.string().max(80).optional(),
    institution: z.string().max(160).optional(),
    level: z.string().max(60).optional(),
    interests: z.array(z.string().max(40)).max(15).default([]),
    goals: z.string().max(500).optional(),
    role: z.enum(["student","tutor","parent"]).default("student"),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("profiles").update({
      full_name: data.full_name, phone: data.phone, country: data.country,
      institution: data.institution, school: data.institution, level: data.level,
      interests: data.interests, goals: data.goals,
      updated_at: new Date().toISOString(),
    }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    if (data.role !== "student") {
      await context.supabase.from("user_roles").insert({ user_id: context.userId, role: data.role });
    }
    return { ok: true };
  });
