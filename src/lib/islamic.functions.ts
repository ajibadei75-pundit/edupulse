import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertOrganizer(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  const allowed = roles.some((r: string) =>
    ["islamic_organizer","islamic_admin","admin","super_admin"].includes(r)
  );
  if (!allowed) throw new Error("Forbidden");
}

export const listStudentsForIslamic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOrganizer(context);
    const { data } = await context.supabase
      .from("profiles")
      .select("id,full_name,avatar_url,school,level")
      .eq("approval_status","approved")
      .order("full_name")
      .limit(500);
    return data ?? [];
  });

export const listIslamicProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ studentId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const q = context.supabase
      .from("islamic_progress")
      .select("id,student_id,program,milestone,score,notes,created_at,profiles:student_id(full_name,avatar_url)")
      .order("created_at", { ascending: false })
      .limit(200);
    const { data: rows, error } = data.studentId ? await q.eq("student_id", data.studentId) : await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addIslamicProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    studentId: z.string().uuid(),
    program: z.string().min(2).max(80),
    milestone: z.string().min(2).max(200),
    score: z.number().int().min(0).max(100).optional(),
    notes: z.string().max(1000).optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertOrganizer(context);
    const { error } = await context.supabase.from("islamic_progress").insert({
      student_id: data.studentId,
      program: data.program,
      milestone: data.milestone,
      score: data.score,
      notes: data.notes,
      recorded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("notifications").insert({
      user_id: data.studentId,
      kind: "islamic",
      title: "Islamic progress update",
      body: `${data.program}: ${data.milestone}`,
      url: "/dashboard",
    });
    return { ok: true };
  });

export const getMyIslamicProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("islamic_progress")
      .select("id,program,milestone,score,notes,created_at")
      .eq("student_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    return data ?? [];
  });
