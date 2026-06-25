import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertCounselor(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role as string);
  const ok = roles.some((r) => ["tutor", "admin", "super_admin", "hod"].includes(r));
  if (!ok) throw new Error("Forbidden — counselor role required");
}

export const listCounselingQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCounselor(context);
    const { data } = await context.supabase
      .from("counseling_sessions")
      .select("id,topic,type,scheduled_at,status,notes,counselor_id,user_id,profiles!counseling_sessions_user_id_fkey(full_name,avatar_url)")
      .or(`counselor_id.is.null,counselor_id.eq.${context.userId}`)
      .order("scheduled_at", { ascending: true });
    return data ?? [];
  });

export const claimCounselingSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertCounselor(context);
    const { error } = await context.supabase
      .from("counseling_sessions")
      .update({ counselor_id: context.userId, status: "confirmed" })
      .eq("id", data.id)
      .is("counselor_id", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCounselingSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
    notes: z.string().max(2000).optional(),
    scheduled_at: z.string().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertCounselor(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("counseling_sessions").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
