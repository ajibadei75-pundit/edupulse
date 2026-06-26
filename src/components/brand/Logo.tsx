import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/lib/site-settings.functions";

export function Logo({ className, variant = "default" }: { className?: string; variant?: "default" | "light" }) {
  const fetchSettings = useServerFn(getSiteSettings);
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60_000,
  });
  const siteName = data?.site_name ?? "EduPulse";
  const logoUrl = data?.logo_url ?? null;

  return (
    <Link to="/" className={cn("flex items-center gap-2 group", className)}>
      {logoUrl ? (
        <img src={logoUrl} alt={`${siteName} logo`} className="h-9 w-9 rounded-xl object-cover" />
      ) : (
        <span className={cn(
          "relative grid place-items-center size-9 rounded-xl",
          variant === "light" ? "bg-white/10 ring-1 ring-white/20" : "bg-primary text-primary-foreground"
        )}>
          <Activity className={cn("size-5 stroke-[2.5]", variant === "light" && "text-accent")} />
          <span className="absolute inset-0 rounded-xl animate-pulse-ring border border-current opacity-40" aria-hidden />
        </span>
      )}
      <span className={cn(
        "font-display font-extrabold text-xl tracking-tight",
        variant === "light" ? "text-white" : "text-primary"
      )}>
        {siteName}
      </span>
    </Link>
  );
}
