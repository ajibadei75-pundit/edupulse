import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { MessageCircle, X, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitSiteFeedback } from "@/lib/feedback.functions";
import { toast } from "sonner";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<"bug" | "idea" | "praise" | "question">("idea");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const path = useRouterState({ select: (s) => s.location.pathname });
  const fn = useServerFn(submitSiteFeedback);

  const m = useMutation({
    mutationFn: () =>
      fn({ data: { rating: rating || undefined, category, message, page: path, email: email || undefined } }),
    onSuccess: () => {
      toast.success("Thanks! Feedback received.");
      setOpen(false);
      setMessage(""); setEmail(""); setRating(0); setCategory("idea");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to send"),
  });

  // Hide on event registration pages (they have their own feedback flow)
  if (path.startsWith("/auth") || path.startsWith("/events/")) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Send feedback"
      >
        <MessageCircle className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-card border border-border rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display font-black">Send us feedback</h2>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded"><X className="size-4" /></button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); if (message.trim().length >= 3) m.mutate(); }}
              className="p-4 space-y-3"
            >
              <div className="grid grid-cols-4 gap-1.5">
                {(["bug", "idea", "praise", "question"] as const).map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-ui font-semibold capitalize transition ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:bg-muted/70"}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-2">Rating:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)}>
                    <Star className={`size-5 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50"}`} />
                  </button>
                ))}
              </div>
              <textarea
                required minLength={3} maxLength={2000} rows={4} value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              />
              <input
                type="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional, so we can follow up)"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <Button type="submit" disabled={m.isPending || message.trim().length < 3} className="w-full rounded-lg">
                <Send className="size-4 mr-1" /> {m.isPending ? "Sending…" : "Send feedback"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
