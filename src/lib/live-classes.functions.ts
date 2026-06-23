import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const STAFF = ["tutor","admin","super_admin","content_admin"];

export const listLiveClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("live_classes")
      .select("id,title,subject,description,meeting_url,starts_at,duration_minutes,host_id")
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createLiveClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().trim().min(3).max(160),
    subject: z.string().trim().max(80).optional().nullable(),
    description: z.string().trim().max(1000).optional().nullable(),
    meeting_url: z.string().trim().url().max(500),
    starts_at: z.string(),
    duration_minutes: z.number().int().min(5).max(480).default(60),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const list = (roles ?? []).map((r) => r.role);
    if (!list.some((r) => STAFF.includes(r))) throw new Error("Only tutors or admins can schedule live classes.");
    const { error } = await (context.supabase as any).from("live_classes").insert({
      title: data.title,
      subject: data.subject ?? null,
      description: data.description ?? null,
      meeting_url: data.meeting_url,
      starts_at: data.starts_at,
      duration_minutes: data.duration_minutes,
      host_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLiveClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await (context.supabase as any).from("live_classes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
