import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { listLibrary, createLibraryResource, toggleBookmark, deleteLibraryResource } from "@/lib/library.functions";
import { getMyRoles } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BookmarkPlus, BookmarkCheck, Search, Plus, FileText, Trash2, Download, Link as LinkIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/library/")({
  head: () => ({ meta: [{ title: "Library — EduPulse" }] }),
  component: LibraryPage,
});

const MAX_BYTES = 25 * 1024 * 1024;

function LibraryPage() {
  const listFn = useServerFn(listLibrary);
  const rolesFn = useServerFn(getMyRoles);
  const createFn = useServerFn(createLibraryResource);
  const bookmarkFn = useServerFn(toggleBookmark);
  const delFn = useServerFn(deleteLibraryResource);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const { data: items = [], isLoading } = useQuery({ queryKey: ["library", q, subject], queryFn: () => listFn({ data: { q: q || undefined, subject: subject || undefined } }) });
  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: () => rolesFn() });
  const canUpload = (roles as string[]).some((r) => ["tutor","admin","super_admin","content_admin"].includes(r));

  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", topic: "", level: "", resource_type: "pdf" as const, external_url: "", description: "" });
  const [file, setFile] = useState<File | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !form.external_url) { toast.error("Pick a file or paste a URL."); return; }
    if (file && file.size > MAX_BYTES) { toast.error("File exceeds 25 MB."); return; }
    setUploading(true);
    try {
      let file_path: string | null = null;
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${Date.now()}_${safe}`;
        const { error: uErr } = await supabase.storage.from("library").upload(path, file);
        if (uErr) throw uErr;
        file_path = path;
      }
      await createFn({ data: { ...form, file_path, external_url: form.external_url || null, download_allowed: true } });
      toast.success("Added to library.");
      setShowForm(false); setFile(null);
      setForm({ title: "", subject: "", topic: "", level: "", resource_type: "pdf", external_url: "", description: "" });
      qc.invalidateQueries({ queryKey: ["library"] });
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  }

  const bm = useMutation({
    mutationFn: (id: string) => bookmarkFn({ data: { resourceId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library"] }),
  });

  return (
    <DashboardShell>
      <div className="p-6 sm:p-10 max-w-6xl">
        <PageTitle
          title="E-Library"
          subtitle="Notes, slides, past papers and study material — searchable and bookmarkable."
          action={canUpload && <Button onClick={() => setShowForm((v) => !v)} className="rounded-lg gap-2"><Plus className="size-4" /> Add resource</Button>}
        />

        {showForm && canUpload && (
          <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 mb-8 grid sm:grid-cols-2 gap-4 animate-fade-in">
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div><label className="text-sm font-ui font-medium mb-1.5 block">Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" /></div>
            <div><label className="text-sm font-ui font-medium mb-1.5 block">Topic</label>
              <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" /></div>
            <div><label className="text-sm font-ui font-medium mb-1.5 block">Level</label>
              <input placeholder="SS3 / Year 1 / Beginner" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" /></div>
            <div><label className="text-sm font-ui font-medium mb-1.5 block">Type</label>
              <select value={form.resource_type} onChange={(e) => setForm({ ...form, resource_type: e.target.value as any })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary">
                {["pdf","slides","notes","video","link"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">File (max 25 MB)</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">…or External URL (YouTube, Drive, etc.)</label>
              <input type="url" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-ui font-medium mb-1.5 block">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary resize-none" />
            </div>
            <div className="sm:col-span-2"><Button type="submit" disabled={uploading}>{uploading ? "Uploading…" : "Save resource"}</Button></div>
          </form>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title…" className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 outline-none focus:border-primary text-sm" />
          </div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Filter by subject" className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary text-sm" />
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[0,1,2,3,4,5].map((i) => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">No resources yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(items as any[]).map((r) => (
              <article key={r.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-[10px] font-ui font-bold uppercase tracking-wider">
                    {r.file_path ? <FileText className="size-3" /> : <LinkIcon className="size-3" />} {r.resource_type}
                  </span>
                  <button onClick={() => bm.mutate(r.id)} className="p-1.5 rounded-md hover:bg-muted" aria-label="Bookmark">
                    {r.bookmarked ? <BookmarkCheck className="size-4 text-primary" /> : <BookmarkPlus className="size-4 text-muted-foreground" />}
                  </button>
                </div>
                <h3 className="font-ui font-bold mt-3 line-clamp-2">{r.title}</h3>
                {r.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.description}</p>}
                <div className="text-[11px] text-muted-foreground mt-2 flex flex-wrap gap-x-3">
                  {r.subject && <span>{r.subject}</span>}{r.topic && <span>· {r.topic}</span>}{r.level && <span>· {r.level}</span>}
                </div>
                <div className="mt-auto pt-4 flex items-center gap-2">
                  {(r.signed_url || r.external_url) && (
                    <a href={r.signed_url ?? r.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-ui font-bold hover:brightness-110">
                      <Download className="size-3" /> Open
                    </a>
                  )}
                  {canUpload && (
                    <button onClick={() => delFn({ data: { id: r.id } }).then(() => qc.invalidateQueries({ queryKey: ["library"] }))} className="ml-auto p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="size-4" /></button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
