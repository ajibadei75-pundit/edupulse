import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role as string);
  if (!roles.some((r: string) => ["admin", "super_admin"].includes(r))) {
    throw new Error("Forbidden");
  }
}

export const listPendingStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("profiles")
      .select("id,full_name,avatar_url,school,level,country,institution,created_at,approval_status")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const listAllStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("profiles")
      .select("id,full_name,avatar_url,school,level,country,institution,created_at,approval_status,approved_at")
      .order("created_at", { ascending: false })
      .limit(500);
    return data ?? [];
  });

export const setStudentApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    studentId: z.string().uuid(),
    status: z.enum(["approved", "rejected", "pending"]),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.rpc("set_student_approval", {
      _student: data.studentId,
      _status: data.status,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyApprovalStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      context.supabase.from("profiles").select("approval_status").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    const roles = (r ?? []).map((x: any) => x.role as string);
    const isStudent = roles.length === 0 || (roles.length === 1 && roles[0] === "student");
    return {
      status: (p?.approval_status as string) ?? "pending",
      isStudentOnly: isStudent,
      approved: !isStudent || p?.approval_status === "approved",
    };
  });
