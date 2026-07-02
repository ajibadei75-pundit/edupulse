import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, BookOpen, Brain, HeartHandshake, Users, Award, Trophy, UserCircle, Wallet, LogOut, Menu, X, ShieldCheck, Calendar, GraduationCap, MessageCircle, Sparkles, BookOpenCheck, Baby, Radio, Library, Briefcase, FolderKanban, BookMarked, Activity, UserCog } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyRoles } from "@/lib/app.functions";
import { toast } from "sonner";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { LiveClassBanner } from "@/components/dashboard/LiveClassBanner";
import { PendingApprovalGate } from "@/components/dashboard/PendingApprovalGate";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/live-classes", label: "Live Classes", icon: Radio },
  { to: "/dashboard/library", label: "Library", icon: Library },
  { to: "/dashboard/ai-tutor", label: "AI Tutor", icon: Sparkles },
  { to: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { to: "/dashboard/cbt", label: "CBT Practice", icon: Brain },
  { to: "/dashboard/results", label: "Results & Match", icon: GraduationCap },
  { to: "/dashboard/counseling", label: "Counseling", icon: HeartHandshake },
  { to: "/dashboard/community", label: "Community", icon: Users },
  { to: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/dashboard/certificates", label: "Certificates", icon: Award },
  { to: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { to: "/dashboard/profile", label: "Profile", icon: UserCircle },
] as const;

const TUTOR_NAV = [
  { to: "/dashboard/tutor", label: "Tutor console", icon: BookOpenCheck },
  { to: "/dashboard/tutor/courses", label: "My courses", icon: FolderKanban },
  { to: "/dashboard/counselor", label: "Counselor inbox", icon: HeartHandshake },
] as const;

const HOD_NAV = [
  { to: "/dashboard/hod", label: "HOD console", icon: Briefcase },
] as const;

const PARENT_NAV = [
  { to: "/dashboard/parent", label: "Parent dashboard", icon: Baby },
] as const;

const ISLAMIC_NAV = [
  { to: "/dashboard/islamic", label: "Islamic progress", icon: BookMarked },
] as const;

const ADMIN_NAV = [
  { to: "/dashboard/admin", label: "Admin console", icon: ShieldCheck },
  { to: "/dashboard/admin/approvals", label: "Student approvals", icon: UserCircle },
  { to: "/dashboard/admin/branding", label: "Branding & settings", icon: Sparkles },
  { to: "/dashboard/events", label: "Events", icon: Calendar },
  { to: "/dashboard/feedback", label: "Feedback", icon: MessageCircle },
] as const;

const SUPER_NAV = [
  { to: "/dashboard/admin/roles", label: "Team & roles", icon: UserCog },
  { to: "/dashboard/admin/activity", label: "Activity log", icon: Activity },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchRoles = useServerFn(getMyRoles);
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => fetchRoles() });

  useEffect(() => setOpen(false), [pathname]);

  const roleList = roles ?? [];
  const isSuper = roleList.includes("super_admin");
  const isAdmin = roleList.some((r) => ["admin","super_admin","cbt_admin","content_admin","finance_admin","islamic_admin"].includes(r));
  const isHod = roleList.includes("hod") || isAdmin;
  const isTutor = roleList.includes("tutor") || isHod;
  const isParent = roleList.includes("parent");
  const isIslamic = roleList.some((r) => ["islamic_organizer","islamic_admin","admin","super_admin"].includes(r));

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-dvh bg-muted/30">
      {/* Top bar mobile */}
      <header className="lg:hidden sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border h-14 px-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button aria-label="Menu" onClick={() => setOpen((v) => !v)} className="p-2 rounded-lg hover:bg-muted">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className={cn(
          "lg:sticky lg:top-0 lg:h-dvh lg:flex lg:flex-col bg-card border-r border-border",
          open ? "block" : "hidden lg:flex"
        )}>
          <div className="hidden lg:flex h-16 items-center px-6 border-b border-border"><Logo /></div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV.map((n) => {
              const active = pathname === n.to;
              const Icon = n.icon;
              return (
                <Link key={n.to} to={n.to} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-ui font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/75 hover:bg-muted hover:text-foreground"
                )}>
                  <Icon className="size-4" /> {n.label}
                </Link>
              );
            })}
            {isTutor && (
              <div className="mt-4 pt-3 border-t border-border space-y-1">
                <p className="px-3 text-[10px] font-ui font-bold uppercase tracking-wider text-muted-foreground mb-1">Tutor</p>
                {TUTOR_NAV.map((n) => {
                  const active = pathname === n.to || pathname.startsWith(n.to + "/");
                  const Icon = n.icon;
                  return (
                    <Link key={n.to} to={n.to} className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-ui font-medium transition-colors",
                      active ? "bg-secondary text-secondary-foreground" : "text-foreground/75 hover:bg-muted hover:text-foreground"
                    )}>
                      <Icon className="size-4" /> {n.label}
                    </Link>
                  );
                })}
              </div>
            )}
            {isHod && (
              <div className="mt-4 pt-3 border-t border-border space-y-1">
                <p className="px-3 text-[10px] font-ui font-bold uppercase tracking-wider text-muted-foreground mb-1">Head of Dept</p>
                {HOD_NAV.map((n) => {
                  const active = pathname === n.to || pathname.startsWith(n.to + "/");
                  const Icon = n.icon;
                  return (
                    <Link key={n.to} to={n.to} className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-ui font-medium transition-colors",
                      active ? "bg-accent text-accent-foreground" : "text-foreground/75 hover:bg-muted hover:text-foreground"
                    )}>
                      <Icon className="size-4" /> {n.label}
                    </Link>
                  );
                })}
              </div>
            )}
            {isParent && (
              <div className="mt-4 pt-3 border-t border-border space-y-1">
                <p className="px-3 text-[10px] font-ui font-bold uppercase tracking-wider text-muted-foreground mb-1">Parent</p>
                {PARENT_NAV.map((n) => {
                  const active = pathname === n.to || pathname.startsWith(n.to + "/");
                  const Icon = n.icon;
                  return (
                    <Link key={n.to} to={n.to} className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-ui font-medium transition-colors",
                      active ? "bg-highlight text-highlight-foreground" : "text-foreground/75 hover:bg-muted hover:text-foreground"
                    )}>
                      <Icon className="size-4" /> {n.label}
                    </Link>
                  );
                })}
              </div>
            )}
            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-border space-y-1">
                <p className="px-3 text-[10px] font-ui font-bold uppercase tracking-wider text-muted-foreground mb-1">Admin</p>
                {ADMIN_NAV.map((n) => {
                  const active = pathname === n.to || pathname.startsWith(n.to + "/");
                  const Icon = n.icon;
                  return (
                    <Link key={n.to} to={n.to} className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-ui font-medium transition-colors",
                      active ? "bg-accent text-accent-foreground" : "text-foreground/75 hover:bg-muted hover:text-foreground"
                    )}>
                      <Icon className="size-4" /> {n.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
          <div className="p-3 border-t border-border">
            <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-ui font-medium text-foreground/75 hover:bg-muted hover:text-destructive">
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </aside>
        <div className="min-w-0">
          <header className="hidden lg:flex sticky top-0 z-30 h-14 items-center justify-end gap-2 px-6 bg-background/80 backdrop-blur border-b border-border">
            <NotificationBell />
          </header>
          <LiveClassBanner />
          <PendingApprovalGate>{children}</PendingApprovalGate>
        </div>
      </div>
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
      <div>
        <h1 className="font-display text-3xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
