import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { PageFade } from "@/components/dashboard/PageFade";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload, FileText, BookOpen, Users, Brain, Loader2, Plus, Timer, Layers, Info,
  FileSpreadsheet, FileJson, Type as TypeIcon,
} from "lucide-react";
import {
  tutorStats, listCbtSubjects, bulkInsertQuestions,
  listDepartments, upsertDepartment, upsertCbtSubject,
} from "@/lib/tutor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/tutor/")({
  head: () => ({ meta: [{ title: "Tutor console — EduPulse" }] }),
  component: TutorPage,
});

type Fmt = "csv" | "json" | "xlsx" | "text";

const SAMPLES: Record<Fmt, string> = {
  csv: `question,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty
"What is 2+2?","3","4","5","6","B","Basic arithmetic","easy"
"Capital of France?","Berlin","Madrid","Paris","Rome","C","","easy"`,
  json: `[
  {
    "question": "What is 2+2?",
    "option_a": "3", "option_b": "4", "option_c": "5", "option_d": "6",
    "correct_option": "B",
    "explanation": "Basic arithmetic",
    "difficulty": "easy"
  }
]`,
  xlsx: "",
  text: `1. What is 2+2?
A) 3
B) 4
C) 5
D) 6
Answer: B
Explanation: Basic arithmetic

2. Capital of France?
A) Berlin
B) Madrid
C) Paris
D) Rome
Answer: C`,
};

function parseTextFormat(raw: string) {
  const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 5) return null;
    const question = lines[0].replace(/^\s*\d+[.)]\s*/, "").trim();
    const opts: Record<string, string> = {};
    let correct = ""; let explanation = "";
    for (const line of lines.slice(1)) {
      const m = line.match(/^([A-D])[).\s-]+(.+)$/i);
      if (m) { opts[m[1].toUpperCase()] = m[2].trim(); continue; }
      const a = line.match(/^answer\s*[:\-]\s*([A-D])/i);
      if (a) { correct = a[1].toUpperCase(); continue; }
      const e = line.match(/^explanation\s*[:\-]\s*(.+)$/i);
      if (e) { explanation = e[1].trim(); continue; }
    }
    if (!question || !correct || !opts.A || !opts.B || !opts.C || !opts.D) return null;
    return {
      question, option_a: opts.A, option_b: opts.B, option_c: opts.C, option_d: opts.D,
      correct_option: correct as "A"|"B"|"C"|"D", explanation: explanation || undefined,
    };
  }).filter(Boolean) as any[];
}

function normalizeRow(r: any) {
  const q = String(r.question ?? r.Question ?? "").trim();
  const co = String(r.correct_option ?? r.answer ?? r.Answer ?? "").trim().toUpperCase();
  if (!q || !["A","B","C","D"].includes(co)) return null;
  return {
    question: q,
    option_a: String(r.option_a ?? r.A ?? r.a ?? "").trim(),
    option_b: String(r.option_b ?? r.B ?? r.b ?? "").trim(),
    option_c: String(r.option_c ?? r.C ?? r.c ?? "").trim(),
    option_d: String(r.option_d ?? r.D ?? r.d ?? "").trim(),
    correct_option: co as "A"|"B"|"C"|"D",
    explanation: r.explanation ? String(r.explanation).trim() : undefined,
    difficulty: r.difficulty ? String(r.difficulty).trim().toLowerCase() as any : undefined,
  };
}

function TutorPage() {
  const qc = useQueryClient();
  const statsFn = useServerFn(tutorStats);
  const subjectsFn = useServerFn(listCbtSubjects);
  const bulkFn = useServerFn(bulkInsertQuestions);
  const deptsFn = useServerFn(listDepartments);
  const upsertDept = useServerFn(upsertDepartment);
  const upsertSubj = useServerFn(upsertCbtSubject);

  const { data: stats } = useQuery({ queryKey: ["tutor","stats"], queryFn: () => statsFn() });
  const { data: subjects = [] } = useQuery({ queryKey: ["tutor","subjects"], queryFn: () => subjectsFn() });
  const { data: departments = [] } = useQuery({ queryKey: ["tutor","depts"], queryFn: () => deptsFn() });

  const [fmt, setFmt] = useState<Fmt>("csv");
  const [subjectId, setSubjectId] = useState("");
  const [payload, setPayload] = useState("");
  const [parsedCount, setParsedCount] = useState<number | null>(null);

  const [deptFilter, setDeptFilter] = useState<string>("");
  const filteredSubjects = useMemo(() =>
    (subjects as any[]).filter((s) => !deptFilter || s.department_id === deptFilter), [subjects, deptFilter]);
  const activeSubject = (subjects as any[]).find((s) => s.id === subjectId);

  // Parse questions from current payload/format
  const parseQuestions = () => {
    try {
      if (fmt === "csv") {
        const parsed = Papa.parse(payload.trim(), { header: true, skipEmptyLines: true });
        if (parsed.errors.length) throw new Error(parsed.errors[0].message);
        return (parsed.data as any[]).map(normalizeRow).filter(Boolean) as any[];
      }
      if (fmt === "json") {
        const arr = JSON.parse(payload);
        if (!Array.isArray(arr)) throw new Error("JSON must be an array");
        return arr.map(normalizeRow).filter(Boolean) as any[];
      }
      if (fmt === "text") return parseTextFormat(payload);
      return [];
    } catch (e: any) { toast.error(e.message ?? "Parse failed"); return []; }
  };

  const onFile = async (file: File) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws) as any[];
      const q = rows.map(normalizeRow).filter(Boolean) as any[];
      setPayload(JSON.stringify(q, null, 2));
      setFmt("json");
      setParsedCount(q.length);
      toast.success(`Loaded ${q.length} questions from Excel.`);
    } else {
      const t = await file.text();
      setPayload(t);
      if (name.endsWith(".json")) setFmt("json");
      else if (name.endsWith(".csv")) setFmt("csv");
      else setFmt("text");
    }
  };

  const upload = useMutation({
    mutationFn: async () => {
      if (!subjectId) throw new Error("Pick a subject first.");
      const questions = parseQuestions();
      if (!questions.length) throw new Error("No valid questions detected.");
      return bulkFn({ data: { subjectId, questions } });
    },
    onSuccess: (r) => {
      toast.success(`Inserted ${r.inserted} questions.`);
      setPayload(""); setParsedCount(null);
      qc.invalidateQueries({ queryKey: ["tutor"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Upload failed"),
  });

  const [newDept, setNewDept] = useState({ name: "", slug: "" });
  const [newSubj, setNewSubj] = useState({ name: "", slug: "", exam_type: "jamb" as const, department_id: "", duration_minutes: 10, guidelines: "" });

  const addDept = useMutation({
    mutationFn: async () => upsertDept({ data: { name: newDept.name.trim(), slug: newDept.slug.trim().toLowerCase() } }),
    onSuccess: () => { toast.success("Department created."); setNewDept({ name: "", slug: "" }); qc.invalidateQueries({ queryKey: ["tutor","depts"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const addSubj = useMutation({
    mutationFn: async () => upsertSubj({ data: {
      name: newSubj.name.trim(), slug: newSubj.slug.trim().toLowerCase(),
      exam_type: newSubj.exam_type, department_id: newSubj.department_id || null,
      duration_minutes: Number(newSubj.duration_minutes) || 10,
      guidelines: newSubj.guidelines || undefined,
    } }),
    onSuccess: () => { toast.success("Subject saved."); qc.invalidateQueries({ queryKey: ["tutor","subjects"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveSubjectMeta = useMutation({
    mutationFn: async () => {
      if (!activeSubject) throw new Error("No subject selected");
      return upsertSubj({ data: {
        id: activeSubject.id, name: activeSubject.name, slug: activeSubject.slug,
        exam_type: activeSubject.exam_type,
        department_id: activeSubject.department_id ?? null,
        duration_minutes: Number(activeSubject.duration_minutes) || 10,
        guidelines: activeSubject.guidelines || undefined,
      } });
    },
    onSuccess: () => { toast.success("Subject updated."); qc.invalidateQueries({ queryKey: ["tutor","subjects"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <PageFade>
        <div className="p-4 sm:p-6 lg:p-10 max-w-6xl">
          <PageTitle title="Tutor console" subtitle="Manage departments, subjects, timers, guidelines and bulk-import CBT questions." />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Stat icon={Brain} label="Subjects" value={stats?.subjects ?? "—"} />
            <Stat icon={FileText} label="Questions" value={stats?.questions ?? "—"} />
            <Stat icon={BookOpen} label="Courses" value={stats?.courses ?? "—"} />
            <Stat icon={Users} label="Students" value={stats?.students ?? "—"} />
          </div>

          {/* Departments & Subjects */}
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><Layers className="size-4 text-primary" /><h3 className="font-ui font-bold">Departments</h3></div>
              <ul className="text-sm space-y-1 mb-4 max-h-40 overflow-auto">
                {(departments as any[]).map((d) => (
                  <li key={d.id} className="flex justify-between border-b border-border/50 py-1">
                    <span>{d.name}</span><span className="text-xs text-muted-foreground">{d.slug}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <input value={newDept.name} onChange={(e) => setNewDept((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Engineering" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <input value={newDept.slug} onChange={(e) => setNewDept((d) => ({ ...d, slug: e.target.value }))} placeholder="slug" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <Button size="sm" className="mt-3 rounded-lg gap-1" onClick={() => addDept.mutate()} disabled={!newDept.name || !newDept.slug || addDept.isPending}>
                <Plus className="size-3.5" /> Add department
              </Button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><BookOpen className="size-4 text-secondary" /><h3 className="font-ui font-bold">Create subject</h3></div>
              <div className="grid grid-cols-2 gap-2">
                <input value={newSubj.name} onChange={(e) => setNewSubj((s) => ({ ...s, name: e.target.value }))} placeholder="Subject name" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <input value={newSubj.slug} onChange={(e) => setNewSubj((s) => ({ ...s, slug: e.target.value }))} placeholder="slug" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <select value={newSubj.exam_type} onChange={(e) => setNewSubj((s) => ({ ...s, exam_type: e.target.value as any }))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="jamb">JAMB</option><option value="waec">WAEC</option><option value="neco">NECO</option><option value="post_utme">Post-UTME</option>
                </select>
                <select value={newSubj.department_id} onChange={(e) => setNewSubj((s) => ({ ...s, department_id: e.target.value }))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">No department</option>
                  {(departments as any[]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="number" min={1} max={240} value={newSubj.duration_minutes} onChange={(e) => setNewSubj((s) => ({ ...s, duration_minutes: Number(e.target.value) }))} placeholder="Timer (min)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <textarea value={newSubj.guidelines} onChange={(e) => setNewSubj((s) => ({ ...s, guidelines: e.target.value }))} placeholder="Exam guidelines shown before the drill starts…" rows={2} className="w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <Button size="sm" className="mt-3 rounded-lg gap-1" onClick={() => addSubj.mutate()} disabled={!newSubj.name || !newSubj.slug || addSubj.isPending}>
                <Plus className="size-3.5" /> Save subject
              </Button>
            </div>
          </div>

          {/* Bulk uploader */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="size-5 text-primary" />
              <h2 className="font-ui font-bold text-lg">Bulk import questions</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Choose a format, drop a file or paste — we'll validate and import.</p>

            {/* Filters + subject */}
            <div className="grid sm:grid-cols-3 gap-2 mb-3">
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                <option value="">All departments</option>
                {(departments as any[]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); }} className="sm:col-span-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                <option value="">Pick subject…</option>
                {filteredSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.exam_type.toUpperCase()} · {s.name} ({s.question_count})</option>)}
              </select>
            </div>

            {/* Subject meta editor */}
            {activeSubject && (
              <div className="rounded-xl border border-dashed border-border p-3 mb-4 bg-muted/30">
                <div className="grid sm:grid-cols-[auto_1fr_auto] items-center gap-3">
                  <div className="inline-flex items-center gap-2 text-xs font-ui font-semibold text-muted-foreground"><Timer className="size-3.5" /> Timer</div>
                  <input type="number" min={1} max={240} defaultValue={activeSubject.duration_minutes ?? 10}
                    onChange={(e) => { (activeSubject as any).duration_minutes = Number(e.target.value); }}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-28" /> <span className="text-xs text-muted-foreground">minutes</span>
                </div>
                <div className="mt-2">
                  <label className="text-xs font-ui font-semibold text-muted-foreground inline-flex items-center gap-1 mb-1"><Info className="size-3.5" /> Guidelines shown to students</label>
                  <textarea defaultValue={activeSubject.guidelines ?? ""} rows={2}
                    onChange={(e) => { (activeSubject as any).guidelines = e.target.value; }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <Button size="sm" variant="outline" className="mt-2 rounded-lg" onClick={() => saveSubjectMeta.mutate()} disabled={saveSubjectMeta.isPending}>Save subject settings</Button>
              </div>
            )}

            {/* Format tabs */}
            <div className="flex flex-wrap gap-2 mb-3">
              {([
                { k: "csv", label: "CSV", Icon: FileText },
                { k: "json", label: "JSON", Icon: FileJson },
                { k: "xlsx", label: "Excel (.xlsx)", Icon: FileSpreadsheet },
                { k: "text", label: "Plain text", Icon: TypeIcon },
              ] as { k: Fmt; label: string; Icon: any }[]).map(({ k, label, Icon }) => (
                <button key={k} onClick={() => setFmt(k)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-ui font-semibold border transition ${fmt === k ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"}`}>
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Guidelines per format */}
            <div className="rounded-xl bg-muted/40 border border-border p-3 text-xs text-muted-foreground mb-3 leading-relaxed">
              {fmt === "csv" && <>Columns: <code className="bg-background/70 px-1 rounded">question, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty</code>. <code>correct_option</code> must be A/B/C/D.</>}
              {fmt === "json" && <>Array of objects with keys <code className="bg-background/70 px-1 rounded">question</code>, <code>option_a…d</code>, <code>correct_option</code>, optional <code>explanation</code>, <code>difficulty</code>.</>}
              {fmt === "xlsx" && <>Upload an .xlsx / .xls where row 1 headers match the CSV columns. We parse client-side — no data leaves your device until you click Import.</>}
              {fmt === "text" && <>Numbered questions with A) B) C) D) options and an <code>Answer:</code> line. Optional <code>Explanation:</code>. Separate questions with a blank line.</>}
            </div>

            {/* File + textarea */}
            <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2 mb-3">
              <input type="file"
                accept={fmt === "xlsx" ? ".xlsx,.xls" : fmt === "json" ? ".json,application/json" : fmt === "csv" ? ".csv,text/csv" : ".txt,text/plain"}
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1.5 file:text-xs file:font-semibold" />
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => { setPayload(SAMPLES[fmt] || ""); setFmt(fmt === "xlsx" ? "csv" : fmt); }}>Use sample</Button>
              <Button type="button" variant="ghost" className="rounded-lg" onClick={() => { const q = parseQuestions(); setParsedCount(q.length); if (q.length) toast.success(`${q.length} valid rows detected.`); }}>Preview</Button>
            </div>

            {fmt !== "xlsx" && (
              <textarea value={payload} onChange={(e) => { setPayload(e.target.value); setParsedCount(null); }} rows={12}
                placeholder={fmt === "json" ? "Paste JSON array…" : fmt === "text" ? "Paste numbered questions…" : "Paste CSV…"}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono outline-none focus:border-primary" />
            )}

            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-muted-foreground">{parsedCount !== null ? `${parsedCount} valid rows ready` : "Preview to validate before import."}</p>
              <Button onClick={() => upload.mutate()} disabled={upload.isPending || !subjectId} className="rounded-lg gap-2">
                {upload.isPending && <Loader2 className="size-4 animate-spin" />} Import questions
              </Button>
            </div>
          </div>
        </div>
      </PageFade>
    </DashboardShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="size-9 rounded-xl grid place-items-center bg-primary/10 text-primary mb-2"><Icon className="size-4" /></div>
      <div className="font-display text-2xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
