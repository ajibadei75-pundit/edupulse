import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { PageFade } from "@/components/dashboard/PageFade";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Plus, Trash2, Loader2, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { listConversations, createConversation, getMessages, saveMessage, deleteConversation } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/dashboard/ai-tutor/")({
  head: () => ({ meta: [{ title: "AI Study Assistant — EduPulse" }] }),
  component: AiTutor,
});

const QUICK = [
  "Explain photosynthesis to a JAMB candidate.",
  "Generate a 5-question quiz on quadratic equations.",
  "Summarize the causes of World War 1 for WAEC.",
  "Give me a study plan for the next 2 weeks.",
];

function AiTutor() {
  const qc = useQueryClient();
  const listFn = useServerFn(listConversations);
  const createFn = useServerFn(createConversation);
  const messagesFn = useServerFn(getMessages);
  const saveFn = useServerFn(saveMessage);
  const delFn = useServerFn(deleteConversation);

  const { data: conversations } = useQuery({ queryKey: ["ai","convos"], queryFn: () => listFn() });
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId && conversations && conversations.length) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  const { data: history } = useQuery({
    queryKey: ["ai","msgs",activeId],
    queryFn: () => messagesFn({ data: { conversationId: activeId! } }),
    enabled: !!activeId,
  });

  const seed = (history ?? []).map((m) => ({
    id: m.id, role: m.role as "user" | "assistant" | "system",
    parts: [{ type: "text" as const, text: m.content }],
  }));

  return (
    <DashboardShell>
      <PageFade>
      <div className="p-4 sm:p-6 max-w-7xl">
        <PageTitle
          title="AI Study Assistant"
          subtitle="Ask anything. Get explanations, quizzes, summaries and study plans — instantly."
        />

        <div className="grid md:grid-cols-[260px_1fr] gap-4 h-[calc(100dvh-220px)] min-h-[500px]">
          <aside className="bg-card border border-border rounded-2xl p-3 overflow-y-auto">
            <Button
              onClick={async () => {
                const c = await createFn({ data: { title: "New chat" } });
                await qc.invalidateQueries({ queryKey: ["ai","convos"] });
                setActiveId(c.id);
              }}
              className="w-full rounded-lg gap-2 mb-3"
            >
              <Plus className="size-4" /> New chat
            </Button>
            <div className="space-y-1">
              {(conversations ?? []).map((c) => (
                <div key={c.id} className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer ${activeId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`} onClick={() => setActiveId(c.id)}>
                  <span className="truncate">{c.title}</span>
                  <button onClick={async (e) => { e.stopPropagation(); await delFn({ data: { conversationId: c.id } }); qc.invalidateQueries({ queryKey: ["ai","convos"] }); if (activeId === c.id) setActiveId(null); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                </div>
              ))}
              {!conversations?.length && (
                <p className="text-xs text-muted-foreground px-2 py-4">No chats yet. Start a new one.</p>
              )}
            </div>
          </aside>

          {activeId ? (
            <ChatPanel
              key={activeId}
              conversationId={activeId}
              seed={seed}
              onPersist={(role, content) => saveFn({ data: { conversationId: activeId, role, content } })}
              onFirstUser={async (firstText) => {
                // rename conversation to first ~40 chars
                const title = firstText.slice(0, 40);
                await qc.invalidateQueries({ queryKey: ["ai","convos"] });
                // best-effort title update via direct fn
              }}
            />
          ) : (
            <EmptyState onStart={async () => {
              const c = await createFn({ data: { title: "New chat" } });
              await qc.invalidateQueries({ queryKey: ["ai","convos"] });
              setActiveId(c.id);
            }} />
          )}
        </div>
      </div>
      </PageFade>
    </DashboardShell>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-10 grid place-items-center text-center">
      <Sparkles className="size-10 text-primary mb-3" />
      <h2 className="font-display text-2xl font-black mb-1">Your AI tutor is ready.</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-md">Powered by Lovable AI — ask in plain English. Free with your account.</p>
      <Button onClick={onStart} className="rounded-lg gap-2"><Plus className="size-4" /> Start a chat</Button>
    </div>
  );
}

function ChatPanel({ conversationId, seed, onPersist, onFirstUser }: {
  conversationId: string;
  seed: any[];
  onPersist: (role: "user" | "assistant", content: string) => Promise<unknown>;
  onFirstUser: (text: string) => Promise<void>;
}) {
  const persistedAssistant = useRef<Set<string>>(new Set());
  const sentFirst = useRef<boolean>(seed.length > 0);

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    messages: seed,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message ?? "AI error"),
    onFinish: async ({ message }) => {
      if (message.role !== "assistant" || persistedAssistant.current.has(message.id)) return;
      persistedAssistant.current.add(message.id);
      const text = message.parts.map((p: any) => p.type === "text" ? p.text : "").join("");
      if (text) await onPersist("assistant", text);
    },
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  async function submit(text: string) {
    if (!text.trim() || busy) return;
    await onPersist("user", text);
    if (!sentFirst.current) { sentFirst.current = true; onFirstUser(text); }
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Try one of these:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => submit(q)} className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`size-8 rounded-full grid place-items-center shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.parts.map((p: any, i: number) => p.type === "text" ? <span key={i}>{p.text}</span> : null)}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-3"><div className="size-8 rounded-full grid place-items-center bg-secondary text-secondary-foreground"><Bot className="size-4" /></div>
            <div className="rounded-2xl px-4 py-2.5 bg-muted inline-flex gap-1.5 items-center"><Loader2 className="size-3.5 animate-spin" /><span className="text-sm">Thinking…</span></div>
          </div>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="border-t border-border p-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything — explain, summarize, quiz me…"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <Button type="submit" disabled={busy || !input.trim()} className="rounded-lg gap-2"><Send className="size-4" /></Button>
      </form>
    </div>
  );
}
