import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listSchools = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb
    .from("schools")
    .select("id,slug,name,short_name,state,type,ownership,website,logo_url")
    .order("name");
  return data ?? [];
});

export const listAllCoursesCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb
    .from("school_courses")
    .select("id,course_name,faculty,jamb_cutoff,min_waec_credits,required_subjects,notes,school_id,schools(id,slug,name,short_name,state,ownership)")
    .order("jamb_cutoff", { ascending: false });
  return data ?? [];
});

// Match against scores (anyone, signed-in or not)
const WaecSchema = z.array(
  z.object({
    subject: z.string().trim().min(1).max(80),
    grade: z.string().trim().min(1).max(4), // A1, B2, B3, C4, C5, C6, D7, E8, F9
  }),
);

export const matchSchools = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        jamb_score: z.number().int().min(0).max(400),
        waec_subjects: WaecSchema.default([]),
        preferred_course: z.string().trim().max(120).optional().or(z.literal("")),
        preferred_state: z.string().trim().max(80).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows } = await sb
      .from("school_courses")
      .select("id,course_name,faculty,jamb_cutoff,min_waec_credits,required_subjects,notes,schools(id,slug,name,short_name,state,ownership)")
      .lte("jamb_cutoff", data.jamb_score)
      .order("jamb_cutoff", { ascending: false });

    const credits = data.waec_subjects.filter((s) => {
      const g = s.grade.toUpperCase();
      return ["A1", "B2", "B3", "C4", "C5", "C6"].includes(g);
    });
    const creditSubjects = new Set(credits.map((s) => s.subject.toLowerCase()));

    const filtered = (rows ?? []).filter((row: any) => {
      if (data.preferred_course && !row.course_name.toLowerCase().includes(data.preferred_course.toLowerCase())) return false;
      if (data.preferred_state && row.schools?.state?.toLowerCase() !== data.preferred_state.toLowerCase()) return false;
      if (credits.length < (row.min_waec_credits ?? 5)) return false;
      const required: string[] = Array.isArray(row.required_subjects) ? row.required_subjects : [];
      const requiredCovered = required.every((r) =>
        Array.from(creditSubjects).some((cs) => cs.includes(r.toLowerCase()) || r.toLowerCase().includes(cs)),
      );
      if (required.length && !requiredCovered) return false;
      return true;
    });

    return {
      matches: filtered.map((r: any) => ({
        id: r.id,
        course_name: r.course_name,
        faculty: r.faculty,
        jamb_cutoff: r.jamb_cutoff,
        required_subjects: r.required_subjects,
        notes: r.notes,
        school: r.schools,
      })),
      checked: rows?.length ?? 0,
      credits: credits.length,
    };
  });

// Authenticated: save / fetch a student's results
export const getMyResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("student_results")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data;
  });

export const saveMyResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        jamb_score: z.number().int().min(0).max(400),
        jamb_subjects: z.array(z.string().min(1).max(80)).max(4).default([]),
        waec_subjects: WaecSchema.default([]),
        preferred_course: z.string().trim().max(120).optional().or(z.literal("")),
        preferred_state: z.string().trim().max(80).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("student_results").upsert(
      {
        user_id: context.userId,
        jamb_score: data.jamb_score,
        jamb_subjects: data.jamb_subjects,
        waec_subjects: data.waec_subjects,
        preferred_course: data.preferred_course || null,
        preferred_state: data.preferred_state || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
