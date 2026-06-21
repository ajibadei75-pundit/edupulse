import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const ADMIN_ROLES = ["admin", "super_admin"];

export const submitSiteFeedback = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        rating: z.number().int().min(1).max(5).optional(),
        category: z.enum(["bug", "idea", "praise", "question"]).default("idea"),
        message: z.string().trim().min(3).max(2000),
        page: z.string().max(200).optional(),
        email: z.string().trim().email().max(255).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { error } = await sb.from("site_feedback").insert({
      rating: data.rating ?? null,
      category: data.category,
      message: data.message,
      page: data.page || null,
      email: data.email || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListSiteFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const r = (roles ?? []).map((x: any) => x.role);
    if (!r.some((x: string) => ADMIN_ROLES.includes(x))) throw new Error("Forbidden");
    const { data } = await context.supabase
      .from("site_feedback")
      .select("id,rating,category,message,page,email,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });
