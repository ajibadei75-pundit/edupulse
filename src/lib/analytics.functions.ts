import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_admin_analytics");
    if (error) throw new Error(error.message);
    return data as Record<string, any>;
  });

export const listTutorProgramFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const r = (roles ?? []).map((x: any) => x.role);
    if (!r.some((x: string) => ["admin", "super_admin"].includes(x))) throw new Error("Forbidden");
    const { data } = await context.supabase
      .from("site_feedback")
      .select("id,rating,category,message,target_type,target_label,created_at")
      .in("target_type", ["tutor", "program"])
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });
