import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { startCbtAttempt, submitCbtAttempt } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Timer, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/cbt/$slug")({
  head: () => ({ meta: [{ title: "CBT Drill — EduPulse" }] }),
  component: CbtDrill,
});

type Question = { id: string; question: string; option_a: string; option_b: string; option_c: string; option_d: string };

function CbtDrill() {
  const { slug } = useParams({ from: "/_authenticated/dashboard/cbt/$slug" });
  const startFn = useServerFn(startCbtAttempt);
  const submitFn = useServerFn(submitCbtAttempt);
  const { data, isLoading } = useQuery({ queryKey: ["cbt","drill",slug], queryFn: () => startFn({ data: { subjectSlug: slug, count: 10 } }) });

  const durationSec = ((data?.subject as any)?.duration_minutes ?? 10) * 60;
  const [answers, setAnswers] = useState<Record<string, "A"|"B"|"C"|"D">>({});
  const [cur, setCur] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const [result, setResult] = useState<{ score: number; total: number; review: any[] } | null>(null);
  const [switches, setSwitches] = useState(0);
  const [started, setStarted] = useState(false);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => { startedAt.current = Date.now(); setSecondsLeft(durationSec); }, [data?.subject?.id, durationSec]);

  useEffect(() => {
    if (result || !started) return;
    const t = setInterval(() => setSecondsLeft((s) => {
      if (s <= 1) { clearInterval(t); submit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Anti-cheat: count tab switches; auto-submit at 3
  useEffect(() => {
    if (result || !started) return;
    function onHide() {
      if (document.hidden) {
        setSwitches((n) => {
          const next = n + 1;
          if (next >= 3) { toast.error("Auto-submitting — too many tab switches."); submit(); }
          else toast.warning(`Warning: tab switch detected (${next}/3). Stay on this page.`);
          return next;
        });
      }
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  async function enterFullscreen() {
    try { await document.documentElement.requestFullscreen(); } catch { /* user denied */ }
  }

  const submitMut = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(answers).map(([questionId, choice]) => ({ questionId, choice }));
      return submitFn({ data: { subjectSlug: slug, answers: payload, durationSeconds: Math.round((Date.now() - startedAt.current)/1000) } });
    },
    onSuccess: (r) => { setResult(r); toast.success(`Score: ${r.score}/${r.total}`); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); },
    onError: (e: any) => toast.error(e.message ?? "Submission failed"),
  });
  const submit = () => { if (!submitMut.isPending && !result) submitMut.mutate(); };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const questions: Question[] = data?.questions ?? [];
  const q = questions[cur];
  const answered = Object.keys(answers).length;
  const pct = useMemo(() => questions.length ? Math.round((answered / questions.length) * 100) : 0, [answered, questions.length]);

  if (isLoading) return <DashboardShell><div className="p-10 text-muted-foreground">Loading drill…</div></DashboardShell>;
  if (!data || !questions.length) return <DashboardShell><div className="p-10">No questions available. <Link to="/dashboard/cbt" className="text-primary">Back</Link></div></DashboardShell>;

  if (!started && !result) {
    const subj = data.subject as any;
    return (
      <DashboardShell>
        <div className="p-4 sm:p-6 lg:p-10 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest font-ui font-bold text-muted-foreground">{subj.exam_type} · Instructions</p>
            <h1 className="font-display text-3xl font-black mt-1 mb-4">{subj.name}</h1>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-ui font-semibold"><Timer className="size-3.5" /> {subj.duration_minutes ?? 10} minutes</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-ui font-semibold">{questions.length} questions</span>
            </div>
            {subj.guidelines ? (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed mb-6">{subj.guidelines}</p>
            ) : (
              <ul className="text-sm text-foreground/80 space-y-1.5 mb-6 list-disc pl-5">
                <li>Do not switch tabs — 3 switches auto-submit your drill.</li>
                <li>The timer starts once you click Begin.</li>
                <li>You may enable fullscreen for a distraction-free experience.</li>
              </ul>
            )}
            <div className="flex gap-2">
              <Button onClick={() => { setStarted(true); startedAt.current = Date.now(); }} className="rounded-lg">Begin drill</Button>
              <Button asChild variant="outline" className="rounded-lg"><Link to="/dashboard/cbt">Cancel</Link></Button>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }


  if (result) {
    const passed = result.score / result.total >= 0.5;
    return (
      <DashboardShell>
        <div className="p-4 sm:p-6 lg:p-10 max-w-3xl">
          <div className={`rounded-2xl border-2 p-8 text-center ${passed ? "border-secondary bg-secondary/5" : "border-highlight bg-highlight/5"}`}>
            <Trophy className={`size-12 mx-auto mb-3 ${passed ? "text-secondary" : "text-highlight"}`} />
            <p className="text-sm uppercase tracking-widest font-ui font-bold text-muted-foreground">Drill complete</p>
            <h1 className="font-display text-5xl font-black mt-1">{result.score} / {result.total}</h1>
            <p className="text-muted-foreground mt-2">{passed ? "Strong work — keep the momentum." : "Review your weak spots and try again."}</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <Button asChild className="rounded-lg"><Link to="/dashboard/cbt">Pick another subject</Link></Button>
              <Button asChild variant="outline" className="rounded-lg"><Link to="/dashboard/leaderboard">View leaderboard</Link></Button>
            </div>
          </div>
          <h2 className="font-ui font-bold text-xl mt-10 mb-4">Review</h2>
          <ol className="space-y-3">
            {result.review.map((r, i) => (
              <li key={r.questionId} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start gap-2">
                  {r.correct ? <CheckCircle2 className="size-5 text-secondary shrink-0 mt-0.5" /> : <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-ui font-semibold text-sm">{i+1}. {r.question}</p>
                    <p className="text-xs mt-1.5 text-muted-foreground">Your answer: <b className={r.correct ? "text-secondary" : "text-destructive"}>{r.choice}</b> · Correct: <b className="text-secondary">{r.correct_option}</b></p>
                    {r.explanation && <p className="text-xs mt-2 text-foreground/80">{r.explanation}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="p-4 sm:p-6 lg:p-10 max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest font-ui font-bold text-muted-foreground">{data.subject.exam_type} · {data.subject.name}</p>
            <h1 className="font-display text-2xl font-black">Question {cur + 1} of {questions.length}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={enterFullscreen} className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted">Fullscreen</button>
            {switches > 0 && <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-ui font-semibold">⚠ {switches}/3</span>}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold tabular-nums ${secondsLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
              <Timer className="size-4" /> {mm}:{ss}
            </div>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <p className="font-ui font-semibold text-lg leading-relaxed mb-6">{q.question}</p>
          <div className="grid gap-3">
            {(["A","B","C","D"] as const).map((opt) => {
              const text = (q as any)[`option_${opt.toLowerCase()}`] as string;
              const selected = answers[q.id] === opt;
              return (
                <button key={opt} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))} className={`text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}>
                  <span className={`size-8 rounded-full grid place-items-center font-bold shrink-0 ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"}`}>{opt}</span>
                  <span className="flex-1">{text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setCur((c) => Math.max(0, c-1))} disabled={cur === 0} className="rounded-lg"><ArrowLeft className="size-4 mr-1" /> Previous</Button>
          <p className="text-sm text-muted-foreground">{answered} / {questions.length} answered</p>
          {cur < questions.length - 1 ? (
            <Button onClick={() => setCur((c) => Math.min(questions.length-1, c+1))} className="rounded-lg">Next <ArrowRight className="size-4 ml-1" /></Button>
          ) : (
            <Button onClick={submit} disabled={submitMut.isPending} className="rounded-lg bg-secondary text-secondary-foreground hover:brightness-110">{submitMut.isPending ? "Submitting…" : "Submit drill"}</Button>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
