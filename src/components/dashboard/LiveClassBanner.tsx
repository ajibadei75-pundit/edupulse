import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ExternalLink, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { getActiveLiveClasses } from "@/lib/live-banner.functions";
import { supabase } from "@/integrations/supabase/client";

export function LiveClassBanner() {
  const fetchActive = useServerFn(getActiveLiveClasses);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["active-live-classes"],
    queryFn: () => fetchActive(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [, setTick] = useState(0);
  const channelId = useId();

  // Tick every 15s so classes disappear the moment they end.
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  // Reset dismissals every 30 minutes.
  useEffect(() => {
    const t = setInterval(() => setDismissed(new Set()), 30 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Realtime: refetch as soon as a live class is inserted/updated/removed.
  useEffect(() => {
    const ch = supabase
      .channel(`live-classes-rt-${channelId}-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_classes" }, () => {
        qc.invalidateQueries({ queryKey: ["active-live-classes"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, channelId]);

  const now = Date.now();
  const visible = (data ?? []).filter(
    (c) => !dismissed.has(c.id) && new Date(c.ends_at).getTime() > now,
  );
  const top = visible[0];

  return (
    <AnimatePresence>
      {top && (
        <motion.div
          key={top.id}
          initial={{ y: -40, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="sticky top-2 z-50 flex justify-center px-3 pt-2 pointer-events-none"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(16,185,129,0.55), 0 10px 30px -8px rgba(16,185,129,0.5)",
                "0 0 0 14px rgba(16,185,129,0), 0 10px 40px -6px rgba(16,185,129,0.7)",
                "0 0 0 0 rgba(16,185,129,0.55), 0 10px 30px -8px rgba(16,185,129,0.5)",
              ],
              scale: [1, 1.03, 1],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-auto relative flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 text-white pl-3 pr-2 py-2 max-w-2xl w-full sm:w-auto ring-2 ring-emerald-300/60"
          >
            <span className="relative grid place-items-center size-6">
              <span className="absolute inset-0 rounded-full bg-emerald-300/80 animate-ping" />
              <span className="absolute inset-1 rounded-full bg-white/90" />
              <Radio className="relative size-3.5 text-emerald-700" />
            </span>
            <span className="text-xs font-ui font-bold uppercase tracking-wider drop-shadow">Live now</span>
            <span className="truncate text-sm font-medium max-w-[16rem] sm:max-w-sm">
              {top.title}
              {top.subject ? ` · ${top.subject}` : ""}
            </span>
            <a
              href={top.meeting_url}
              target="_blank"
              rel="noreferrer noopener"
              className="ml-2 inline-flex items-center gap-1 rounded-full bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-1 text-xs font-bold transition shadow"
            >
              Join <ExternalLink className="size-3" />
            </a>
            <button
              onClick={() => setDismissed((s) => new Set(s).add(top.id))}
              aria-label="Dismiss"
              className="ml-1 grid place-items-center size-7 rounded-full hover:bg-white/20 transition"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        </motion.div>

      )}
    </AnimatePresence>
  );
}
