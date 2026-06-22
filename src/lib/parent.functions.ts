import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const linkStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().trim().min(4).max(20) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: studentId, error } = await context.supabase.rpc("link_student_by_code", { _code: data.code });
    if (error) throw new Error(error.message);
    return { studentId };
  });

export const unlinkStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ studentId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("parent_links").delete()
      .eq("parent_id", context.userId).eq("student_id", data.studentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyChildren = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: links } = await context.supabase.from("parent_links")
      .select("student_id, created_at").eq("parent_id", context.userId);
    const ids = (links ?? []).map((l) => l.student_id);
    if (!ids.length) return [];

    const [{ data: profiles }, { data: attempts }, { data: enrolls }] = await Promise.all([
      context.supabase.from("profiles").select("id,full_name,avatar_url,school,level,invite_code").in("id", ids),
      context.supabase.from("cbt_attempts").select("user_id,score,total,completed_at,cbt_subjects(name,exam_type)").in("user_id", ids).order("completed_at", { ascending: false }).limit(50),
      context.supabase.from("enrollments").select("user_id,progress,courses(title,category)").in("user_id", ids),
    ]);

    return (profiles ?? []).map((p) => ({
      profile: p,
      attempts: (attempts ?? []).filter((a) => a.user_id === p.id),
      enrollments: (enrolls ?? []).filter((e) => e.user_id === p.id),
    }));
  });

export const getMyInviteCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("profiles").select("invite_code").eq("id", context.userId).maybeSingle();
    return data?.invite_code ?? null;
  });
