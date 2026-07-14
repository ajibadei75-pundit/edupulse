import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, PageTitle } from "@/components/dashboard/DashboardShell";
import { createPost, getMyCommunityFeed, likePost } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/community/")({
  head: () => ({ meta: [{ title: "Community — EduPulse" }] }),
  component: CommunityDash,
});

function CommunityDash() {
  const feedFn = useServerFn(getMyCommunityFeed);
  const postFn = useServerFn(createPost);
  const likeFn = useServerFn(likePost);
  const qc = useQueryClient();
  const { data: posts = [] } = useQuery({ queryKey: ["feed"], queryFn: () => feedFn() });
  const [content, setContent] = useState("");

  const post = useMutation({
    mutationFn: () => postFn({ data: { content } }),
    onSuccess: () => { setContent(""); toast.success("Posted."); qc.invalidateQueries({ queryKey: ["feed"] }); },
    onError: (e: any) => toast.error(e.message ?? "Could not post"),
  });
  const like = useMutation({
    mutationFn: (postId: string) => likeFn({ data: { postId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  return (
    <DashboardShell>
      <div className="p-4 sm:p-6 lg:p-10 max-w-3xl">
        <PageTitle title="Community" subtitle="Share progress, ask questions, find your people." />
        <form className="bg-card border border-border rounded-2xl p-5 mb-6" onSubmit={(e) => { e.preventDefault(); if (content.trim()) post.mutate(); }}>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={1000} rows={3} placeholder="What are you studying today?" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary resize-none" />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-muted-foreground">{content.length}/1000</span>
            <Button type="submit" size="sm" disabled={post.isPending || !content.trim()} className="rounded-lg">Post</Button>
          </div>
        </form>

        <div className="space-y-4">
          {(posts as any[]).map((p) => (
            <article key={p.id} className="bg-card border border-border rounded-2xl p-5">
              <header className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-primary/10 text-primary font-bold grid place-items-center">{(p.profiles?.full_name ?? "?").charAt(0).toUpperCase()}</div>
                <div>
                  <p className="font-ui font-semibold text-sm">{p.profiles?.full_name ?? "Student"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                </div>
              </header>
              <p className="leading-relaxed whitespace-pre-wrap">{p.content}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <button onClick={() => like.mutate(p.id)} className="inline-flex items-center gap-1.5 hover:text-highlight transition-colors"><Heart className="size-4" /> {p.likes_count ?? 0}</button>
                <span className="inline-flex items-center gap-1.5"><MessageCircle className="size-4" /> {p.comments_count ?? 0}</span>
              </div>
            </article>
          ))}
          {(posts as any[]).length === 0 && <p className="text-sm text-muted-foreground text-center py-10">Be the first to share something.</p>}
        </div>
      </div>
    </DashboardShell>
  );
}
