import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { getAdminSiteSettings, updateSiteSettings } from "@/lib/site-settings.functions";
import { Upload, Image as ImageIcon, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/branding")({
  component: BrandingPage,
});

type Form = {
  site_name: string; tagline: string;
  support_email: string | null; support_phone: string | null; address: string | null;
  logo_url: string | null; favicon_url: string | null;
};

function fileToDataUrl(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) return reject(new Error(`File too large (max ${Math.round(maxBytes / 1024)} KB)`));
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Failed to read file"));
    r.readAsDataURL(file);
  });
}

function BrandingPage() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getSiteSettings);
  const save = useServerFn(updateSiteSettings);
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => fetchSettings() });
  const [form, setForm] = useState<Form | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data && !form) setForm({
      site_name: data.site_name, tagline: data.tagline,
      support_email: data.support_email ?? "", support_phone: data.support_phone ?? "", address: data.address ?? "",
      logo_url: data.logo_url ?? null, favicon_url: data.favicon_url ?? null,
    });
  }, [data, form]);

  const mutate = useMutation({
    mutationFn: (payload: Form) => save({ data: {
      site_name: payload.site_name, tagline: payload.tagline,
      support_email: payload.support_email || null,
      support_phone: payload.support_phone || null,
      address: payload.address || null,
      logo_url: payload.logo_url, favicon_url: payload.favicon_url,
    } }),
    onSuccess: () => { toast.success("Site settings saved"); qc.invalidateQueries({ queryKey: ["site-settings"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  if (!form) return <DashboardShell><div className="p-6">Loading…</div></DashboardShell>;

  async function pick(kind: "logo" | "favicon", file?: File) {
    if (!file) return;
    try {
      const max = kind === "logo" ? 400 * 1024 : 100 * 1024;
      const url = await fileToDataUrl(file, max);
      setForm((f) => f ? { ...f, [kind === "logo" ? "logo_url" : "favicon_url"]: url } : f);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <DashboardShell>
      <div className="px-4 lg:px-8 py-6 max-w-3xl">
        <PageTitle title="Branding & site settings" subtitle="Super admin · changes apply everywhere" />

        <div className="space-y-6">
          <Card title="Identity">
            <Field label="Site name">
              <input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} className={inp} maxLength={80} />
            </Field>
            <Field label="Tagline">
              <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inp} maxLength={160} />
            </Field>
          </Card>

          <Card title="Logo (shown in header)">
            <div className="flex items-center gap-4">
              <div className="grid place-items-center size-20 rounded-2xl bg-muted overflow-hidden border border-border">
                {form.logo_url ? <img src={form.logo_url} alt="logo preview" className="w-full h-full object-cover" /> : <ImageIcon className="size-7 text-muted-foreground" />}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => pick("logo", e.target.files?.[0])} />
                <button onClick={() => logoRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:brightness-110">
                  <Upload className="size-4" /> Upload logo
                </button>
                {form.logo_url && (
                  <button onClick={() => setForm({ ...form, logo_url: null })} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive">
                    <RotateCcw className="size-3" /> Reset to default
                  </button>
                )}
                <p className="text-[11px] text-muted-foreground">PNG / JPG / SVG · max 400 KB · square works best</p>
              </div>
            </div>
          </Card>

          <Card title="Favicon">
            <div className="flex items-center gap-4">
              <div className="grid place-items-center size-12 rounded-lg bg-muted overflow-hidden border border-border">
                {form.favicon_url ? <img src={form.favicon_url} alt="favicon preview" className="w-full h-full object-cover" /> : <ImageIcon className="size-5 text-muted-foreground" />}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={faviconRef} type="file" accept="image/*" hidden onChange={(e) => pick("favicon", e.target.files?.[0])} />
                <button onClick={() => faviconRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:brightness-110">
                  <Upload className="size-4" /> Upload favicon
                </button>
                {form.favicon_url && (
                  <button onClick={() => setForm({ ...form, favicon_url: null })} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive">
                    <RotateCcw className="size-3" /> Reset
                  </button>
                )}
                <p className="text-[11px] text-muted-foreground">32×32 or 64×64 PNG · max 100 KB</p>
              </div>
            </div>
          </Card>

          <Card title="Contact info">
            <Field label="Support email"><input type="email" value={form.support_email ?? ""} onChange={(e) => setForm({ ...form, support_email: e.target.value })} className={inp} placeholder="hello@example.com" /></Field>
            <Field label="Support phone"><input value={form.support_phone ?? ""} onChange={(e) => setForm({ ...form, support_phone: e.target.value })} className={inp} placeholder="+234…" /></Field>
            <Field label="Address"><textarea value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp + " min-h-[80px]"} maxLength={300} /></Field>
          </Card>

          <div className="flex justify-end">
            <button
              onClick={() => mutate.mutate(form)}
              disabled={mutate.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-bold shadow hover:brightness-110 disabled:opacity-60"
            >
              <Save className="size-4" /> {mutate.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-ui font-semibold text-muted-foreground mb-1">{label}</span>{children}</label>;
}
