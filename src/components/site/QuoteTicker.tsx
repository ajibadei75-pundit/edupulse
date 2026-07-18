import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

const QUOTES: { q: string; a: string }[] = [
  { q: "The beautiful thing about learning is that no one can take it away from you.", a: "B.B. King" },
  { q: "Education is the most powerful weapon which you can use to change the world.", a: "Nelson Mandela" },
  { q: "Do not follow where the path may lead. Go instead where there is no path and leave a trail.", a: "Ralph Waldo Emerson" },
  { q: "Seek knowledge from the cradle to the grave.", a: "Prophet Muhammad ﷺ" },
  { q: "The expert in anything was once a beginner.", a: "Helen Hayes" },
  { q: "Success is the sum of small efforts, repeated day in and day out.", a: "Robert Collier" },
  { q: "You don't have to be great to start, but you have to start to be great.", a: "Zig Ziglar" },
  { q: "Discipline is the bridge between goals and accomplishment.", a: "Jim Rohn" },
];

export function QuoteTicker({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % QUOTES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const cur = QUOTES[i];
  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <Quote className="size-5 mx-auto mb-2 text-accent" />
        <p className="font-display text-lg sm:text-xl italic text-foreground/85 leading-relaxed">"{cur.q}"</p>
        <p className="mt-2 text-xs font-ui uppercase tracking-widest text-muted-foreground">— {cur.a}</p>
      </div>
    </div>
  );
}
