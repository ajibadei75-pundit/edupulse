import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const STAFF = ["tutor","admin","super_admin","content_admin"];

export const listLibrary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().max(80).optional(), subject: z.string().max(80).optional() }).parse(d ?? {}))
  .handler(async ({ context, data }) => {
    let query = (context.supabase as any)
      .from("library_resources")
      .select("id,title,description,subject,topic,level,resource_type,file_path,external_url,download_allowed,uploaded_by,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.subject) query = query.eq("subject", data.subject);
    if (data.q) query = query.ilike("title", `%${data.q}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    // sign URLs for stored files
    const signed = await Promise.all((rows ?? []).map(async (r: any) => {
      if (r.file_path) {
        const { data: s } = await (context.supabase as any).storage.from("library").createSignedUrl(r.file_path, 60 * 60);
        return { ...r, signed_url: s?.signedUrl ?? null };
      }
      return { ...r, signed_url: null };
    }));

    const { data: bm } = await (context.supabase as any).from("library_bookmarks").select("resource_id").eq("user_id", context.userId);
    const bookmarks = new Set((bm ?? []).map((b: any) => b.resource_id));
    return signed.map((r: any) => ({ ...r, bookmarked: bookmarks.has(r.id) }));
  });

export const createLibraryResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().max(1000).optional().nullable(),
    subject: z.string().trim().max(80).optional().nullable(),
    topic: z.string().trim().max(120).optional().nullable(),
    level: z.string().trim().max(40).optional().nullable(),
    resource_type: z.enum(["pdf","slides","notes","video","link"]),
    file_path: z.string().max(500).optional().nullable(),
    external_url: z.string().url().max(500).optional().nullable(),
    download_allowed: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).map((r) => r.role).some((r) => STAFF.includes(r))) throw new Error("Only tutors or admins can add library resources.");
    if (!data.file_path && !data.external_url) throw new Error("Provide a file or external URL.");
    const { error } = await (context.supabase as any).from("library_resources").insert({
      ...data, uploaded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ resourceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: existing } = await (context.supabase as any).from("library_bookmarks").select("id").eq("user_id", context.userId).eq("resource_id", data.resourceId).maybeSingle();
    if (existing) {
      await (context.supabase as any).from("library_bookmarks").delete().eq("id", existing.id);
      return { bookmarked: false };
    }
    await (context.supabase as any).from("library_bookmarks").insert({ user_id: context.userId, resource_id: data.resourceId });
    return { bookmarked: true };
  });

export const deleteLibraryResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: r } = await (context.supabase as any).from("library_resources").select("file_path").eq("id", data.id).maybeSingle();
    if (r?.file_path) {
      await (context.supabase as any).storage.from("library").remove([r.file_path]);
    }
    const { error } = await (context.supabase as any).from("library_resources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
