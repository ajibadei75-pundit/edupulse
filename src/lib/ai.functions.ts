import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("ai_conversations")
      .select("id,title,updated_at").eq("user_id", context.userId)
      .order("updated_at", { ascending: false }).limit(50);
    return data ?? [];
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ title: z.string().max(120).default("New chat") }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("ai_conversations")
      .insert({ user_id: context.userId, title: data.title }).select("id,title,updated_at").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ conversationId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows } = await context.supabase.from("ai_messages")
      .select("id,role,content,created_at").eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    return rows ?? [];
  });

export const saveMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    conversationId: z.string().uuid(),
    role: z.enum(["user","assistant","system"]),
    content: z.string().min(1).max(20000),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("ai_messages").insert({
      conversation_id: data.conversationId, role: data.role, content: data.content,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", data.conversationId);
    return { ok: true };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ conversationId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("ai_conversations").delete()
      .eq("id", data.conversationId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
