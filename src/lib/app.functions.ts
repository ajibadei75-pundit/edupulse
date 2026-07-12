import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data }, { data: priv }] = await Promise.all([
      context.supabase.from("profiles")
        .select("id,full_name,avatar_url,school,level,bio,streak_days,created_at,updated_at,country,institution,interests,goals,department")
        .eq("id", context.userId).maybeSingle(),
      context.supabase.rpc("get_my_private_profile"),
    ]);
    const p = Array.isArray(priv) ? priv[0] : priv;
    return data ? { ...data, phone: p?.phone ?? null, invite_code: p?.invite_code ?? null } : null;
  });


export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ full_name: z.string().min(1).max(120), school: z.string().max(120).optional(), level: z.string().max(60).optional(), bio: z.string().max(500).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("profiles").update({ ...data, updated_at: new Date().toISOString() }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    return (data ?? []).map((r) => r.role);
  });

export const getDashboardOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, enrolls, attempts, certs] = await Promise.all([
      context.supabase.from("profiles").select("full_name,avatar_url,school,streak_days").eq("id", context.userId).maybeSingle(),
      context.supabase.from("enrollments").select("id,progress,course_id,courses(title,category)").eq("user_id", context.userId),
      context.supabase.from("cbt_attempts").select("id,score,total,completed_at,subject_id,cbt_subjects(name,exam_type)").eq("user_id", context.userId).order("completed_at", { ascending: false }).limit(5),
      context.supabase.from("certificates").select("id").eq("user_id", context.userId),
    ]);
    return {
      profile: profile.data,
      enrollments: enrolls.data ?? [],
      recentAttempts: attempts.data ?? [],
      certificateCount: certs.data?.length ?? 0,
    };
  });

export const listSubjectsForExam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("cbt_subjects").select("id,slug,name,exam_type,question_count").order("name");
    return data ?? [];
  });

export const startCbtAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ subjectSlug: z.string(), count: z.number().int().min(5).max(50).default(10) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: subject } = await context.supabase.from("cbt_subjects").select("id,name,exam_type").eq("slug", data.subjectSlug).maybeSingle();
    if (!subject) throw new Error("Subject not found");
    const { data: questions } = await context.supabase.from("cbt_questions").select("id,question,option_a,option_b,option_c,option_d").eq("subject_id", subject.id).limit(data.count);
    const shuffled = [...(questions ?? [])].sort(() => Math.random() - 0.5);
    return { subject, questions: shuffled };
  });

export const submitCbtAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    subjectSlug: z.string(),
    answers: z.array(z.object({ questionId: z.string().uuid(), choice: z.enum(["A","B","C","D"]) })),
    durationSeconds: z.number().int().min(0),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: subject } = await context.supabase.from("cbt_subjects").select("id").eq("slug", data.subjectSlug).maybeSingle();
    if (!subject) throw new Error("Subject not found");
    const ids = data.answers.map((a) => a.questionId);
    const { data: qs } = await context.supabase.rpc("get_cbt_answer_keys", { _ids: ids });
    const lookup = new Map((qs ?? []).map((q: any) => [q.id, q]));
    let score = 0;
    const review = data.answers.map((a) => {
      const q = lookup.get(a.questionId);
      const correct = q?.correct_option === a.choice;
      if (correct) score += 1;
      return { questionId: a.questionId, question: q?.question, choice: a.choice, correct_option: q?.correct_option, explanation: q?.explanation, correct };
    });
    const total = data.answers.length;
    const { data: inserted, error } = await context.supabase.from("cbt_attempts").insert({
      user_id: context.userId, subject_id: subject.id, score, total, duration_seconds: data.durationSeconds,
      answers: data.answers,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { attemptId: inserted.id, score, total, review };
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_cbt_leaderboard", { _limit: 20 });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      userId: r.user_id,
      profile: { full_name: r.full_name, avatar_url: r.avatar_url, school: r.school },
      avgScore: Number(r.avg_score ?? 0),
      attempts: Number(r.attempts ?? 0),
    }));
  });

export const getMyCommunityFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("community_posts")
      .select("id,content,category,likes_count,comments_count,created_at,user_id,profiles(full_name,avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ content: z.string().trim().min(1).max(1000), category: z.string().max(40).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("community_posts").insert({ user_id: context.userId, content: data.content, category: data.category ?? "General" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const likePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ postId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("post_likes").insert({ post_id: data.postId, user_id: context.userId });
    if (!error) {
      const { data: cur } = await context.supabase.from("community_posts").select("likes_count").eq("id", data.postId).maybeSingle();
      await context.supabase.from("community_posts").update({ likes_count: (cur?.likes_count ?? 0) + 1 }).eq("id", data.postId);
    }
    return { ok: true };
  });

export const getMyEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("enrollments").select("id,progress,enrolled_at,courses(id,slug,title,description,category,level,duration_hours)").eq("user_id", context.userId);
    return data ?? [];
  });

export const enrollInCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ courseId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("enrollments").upsert({ user_id: context.userId, course_id: data.courseId }, { onConflict: "user_id,course_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("courses").select("id,slug,title,description,category,level,duration_hours").eq("is_published", true).order("title");
    return data ?? [];
  });

export const getMyCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("certificates").select("id,title,verification_code,issued_at,courses(title)").eq("user_id", context.userId).order("issued_at", { ascending: false });
    return data ?? [];
  });

export const getMyCounselingSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("counseling_sessions").select("*").eq("user_id", context.userId).order("scheduled_at", { ascending: false });
    return data ?? [];
  });

export const bookCounseling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    type: z.enum(["academic","career","admission","personal"]),
    topic: z.string().min(3).max(200),
    scheduled_at: z.string(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("counseling_sessions").insert({
      user_id: context.userId, type: data.type, topic: data.topic, scheduled_at: data.scheduled_at, status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
