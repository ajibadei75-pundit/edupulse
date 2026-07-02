import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ROLE = z.enum([
  "student","tutor","admin","super_admin","cbt_admin","content_admin",
  "finance_admin","islamic_admin","parent","hod","islamic_organizer",
]);

async function assertSuperAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("super_admin")) throw new Error("Only super admins can perform this action.");
}

export const searchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().max(120).default("") }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.rpc("admin_search_users", { _q: data.q });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), role: ROLE }).parse(d))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context);
    const { error } = await context.supabase.rpc("assign_user_role", { _target: data.userId, _role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), role: ROLE }).parse(d))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context);
    const { error } = await context.supabase.rpc("revoke_user_role", { _target: data.userId, _role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("activity_logs")
      .select("id,actor_id,action,target,meta,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
