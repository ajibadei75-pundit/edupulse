import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function publicClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getCourses = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("courses").select("id,slug,title,description,category,level,duration_hours,cover_url").eq("is_published", true).order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
});

export const getNews = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("news_items").select("id,slug,title,excerpt,category,cover_url,published_at").order("published_at", { ascending: false });
  if (error) return [];
  return data ?? [];
});

export const getScholarships = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("scholarships").select("id,slug,title,sponsor,amount,deadline,description,apply_url,category").order("deadline", { ascending: true });
  if (error) return [];
  return data ?? [];
});

export const getCbtSubjects = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("cbt_subjects").select("id,slug,name,exam_type,description,question_count").order("name");
  if (error) return [];
  return data ?? [];
});
