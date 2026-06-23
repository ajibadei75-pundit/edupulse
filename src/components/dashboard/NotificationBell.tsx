import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { listMyNotifications, markAllRead, markRead } from "@/lib/notifications.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const listFn = useServerFn(listMyNotifications);
  const allFn = useServerFn(markAllRead);
  const oneFn = useServerFn(markRead);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: items = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => listFn(), refetchInterval: 60_000 });
  const unread = (items as any[]).filter((n) => !n.read_at).length;

  useEffect(() => {
    const ch = supabase.channel("notif-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative p-2 rounded-lg hover:bg-muted" aria-label="Notifications">
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute top-1 right-1 size-2 rounded-full bg-highlight animate-ping" />}
        {unread > 0 && <span className="absolute top-1 right-1 size-2 rounded-full bg-highlight" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-popover border border-border rounded-xl shadow-lg z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-ui font-bold text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={() => allFn().then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                <Check className="size-3" /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(items as any[]).map((n) => {
                const inner = (
                  <div className={cn("px-4 py-3 hover:bg-muted/50 transition", !n.read_at && "bg-primary/5")}>
                    <p className="text-sm font-ui font-medium line-clamp-2">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                );
                return (
                  <li key={n.id} onClick={() => { if (!n.read_at) oneFn({ data: { id: n.id } }).then(() => qc.invalidateQueries({ queryKey: ["notifications"] })); }}>
                    {n.url ? <Link to={n.url as any} onClick={() => setOpen(false)}>{inner}</Link> : inner}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
