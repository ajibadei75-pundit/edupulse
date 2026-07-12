import { Link } from "@tanstack/react-router";

export function AdminDot() {
  return (
    <Link
      to="/auth"
      aria-label="Admin login"
      title="Admin access"
      className="fixed bottom-4 left-4 z-40 group flex items-center gap-2"
    >
      <span className="relative flex size-3">
        <span className="absolute inset-0 rounded-full bg-primary/60 animate-ping" />
        <span className="relative inline-flex size-3 rounded-full bg-primary shadow-lg shadow-primary/40 ring-2 ring-background" />
      </span>
      <span className="hidden group-hover:inline text-[10px] font-ui font-semibold uppercase tracking-wider text-foreground/70 bg-background/80 backdrop-blur px-2 py-1 rounded-full border border-border">
        Admin
      </span>
    </Link>
  );
}
