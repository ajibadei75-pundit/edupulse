import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const SettingsSchema = z.object({
  site_name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(1).max(160),
  support_email: z.string().trim().email().max(160).nullable().optional(),
  support_phone: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  logo_url: z.string().max(500000).nullable().optional(),
  favicon_url: z.string().max(500000).nullable().optional(),
});

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data } = await sb.from("site_settings").select("*").eq("id", true).maybeSingle();
  return data ?? {
    site_name: "EduPulse",
    tagline: "The Heartbeat of Student Success",
    support_email: null, support_phone: null, address: null,
    logo_url: null, favicon_url: null,
  };
});

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SettingsSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!isSuper) throw new Error("Only super admins can change site settings");
    const { error } = await context.supabase.from("site_settings")
      .update({ ...data, updated_by: context.userId })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
