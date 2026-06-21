import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const ADMIN_ROLES = ["admin", "super_admin", "content_admin"];
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.some((r: string) => ADMIN_ROLES.includes(r))) throw new Error("Forbidden");
}

const CustomFieldSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  type: z.enum(["text", "textarea", "select", "checkbox"]),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

// ===== Public =====
export const listPublicEvents = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb
    .from("events")
    .select("id,slug,title,description,cover_url,location,starts_at,ends_at,feedback_open")
    .eq("is_published", true)
    .order("starts_at", { ascending: true, nullsFirst: false });
  return data ?? [];
});

export const getPublicEvent = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: ev } = await sb
      .from("events")
      .select("id,slug,title,description,cover_url,location,starts_at,ends_at,custom_fields,feedback_open,capacity")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    return ev;
  });

export const registerForEvent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        slug: z.string(),
        full_name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(255),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
        school: z.string().trim().max(160).optional().or(z.literal("")),
        responses: z.record(z.string(), z.any()).default({}),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: ev } = await sb.from("events").select("id").eq("slug", data.slug).maybeSingle();
    if (!ev) throw new Error("Event not found");
    const { error } = await sb.from("event_registrations").insert({
      event_id: (ev as any).id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      school: data.school || null,
      responses: data.responses,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitEventFeedback = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        slug: z.string(),
        rating: z.number().int().min(1).max(5),
        comments: z.string().trim().max(2000).optional().or(z.literal("")),
        full_name: z.string().trim().max(120).optional().or(z.literal("")),
        email: z.string().trim().email().max(255).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: ev } = await sb
      .from("events")
      .select("id,feedback_open")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!ev) throw new Error("Event not found");
    if (!(ev as any).feedback_open) throw new Error("Feedback closed");
    const { error } = await sb.from("event_feedback").insert({
      event_id: (ev as any).id,
      rating: data.rating,
      comments: data.comments || null,
      full_name: data.full_name || null,
      email: data.email || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Admin =====
export const adminListEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("events")
      .select("id,slug,title,starts_at,location,is_published,feedback_open,created_at")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const adminCreateEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        slug: z
          .string()
          .min(3)
          .max(80)
          .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens"),
        title: z.string().min(3).max(200),
        description: z.string().max(4000).optional(),
        location: z.string().max(200).optional(),
        starts_at: z.string().optional(),
        ends_at: z.string().optional(),
        capacity: z.number().int().positive().optional(),
        custom_fields: z.array(CustomFieldSchema).default([]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("events").insert({
      slug: data.slug,
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      starts_at: data.starts_at || null,
      ends_at: data.ends_at || null,
      capacity: data.capacity ?? null,
      custom_fields: data.custom_fields,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        is_published: z.boolean().optional(),
        feedback_open: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: any = {};
    if (data.is_published !== undefined) patch.is_published = data.is_published;
    if (data.feedback_open !== undefined) patch.feedback_open = data.feedback_open;
    const { error } = await context.supabase.from("events").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminEventDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: ev } = await context.supabase
      .from("events")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!ev) throw new Error("Not found");
    const [regs, fb] = await Promise.all([
      context.supabase
        .from("event_registrations")
        .select("id,full_name,email,phone,school,responses,created_at")
        .eq("event_id", (ev as any).id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("event_feedback")
        .select("id,rating,comments,full_name,email,created_at")
        .eq("event_id", (ev as any).id)
        .order("created_at", { ascending: false }),
    ]);
    const ratings = (fb.data ?? []).map((f: any) => f.rating);
    const avg = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
    return {
      event: ev,
      registrations: regs.data ?? [],
      feedback: fb.data ?? [],
      stats: {
        registrationCount: regs.data?.length ?? 0,
        feedbackCount: fb.data?.length ?? 0,
        averageRating: Math.round(avg * 10) / 10,
      },
    };
  });
