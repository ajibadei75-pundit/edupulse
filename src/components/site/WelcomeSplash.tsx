import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowRight } from "lucide-react";

const KEY = "edupulse_welcomed_v1";

export function WelcomeSplash() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch { /* ignore */ }
  }, []);

  function dismiss() {
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] gradient-hero text-white grid place-items-center px-6"
          role="dialog" aria-modal="true" aria-label="Welcome to EduPulse"
        >
          <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full border border-white/15 animate-pulse-ring" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full border border-white/20 animate-pulse-ring" style={{ animationDelay: "1s" }} />
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative max-w-xl text-center"
          >
            <div className="mx-auto grid place-items-center size-20 rounded-3xl bg-white/10 ring-1 ring-white/25 backdrop-blur mb-6">
              <Activity className="size-10 text-accent" />
            </div>
            <h1 className="font-display font-black text-5xl md:text-6xl tracking-tight leading-[1.05]">
              Welcome to <span className="text-accent">EduPulse</span>
            </h1>
            <p className="mt-4 text-lg text-white/85 max-w-md mx-auto">
              The heartbeat of student success — learn, grow and excel with one ecosystem.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth"
                onClick={dismiss}
                className="inline-flex items-center gap-2 rounded-2xl bg-accent text-accent-foreground px-6 py-3 font-ui font-bold shadow-lg hover:brightness-110"
              >
                Get started <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={dismiss}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 ring-1 ring-white/30 px-6 py-3 font-ui font-semibold text-white hover:bg-white/15"
              >
                Explore first
              </button>
            </div>
            <button onClick={dismiss} className="mt-6 text-xs text-white/60 hover:text-white/90 underline-offset-4 hover:underline">
              Skip introduction
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
