import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { History, Clapperboard, Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { EvaluationResult } from "@/lib/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-primary";
  if (score >= 50) return "text-yellow-400";
  return "text-destructive";
}

export default async function HistoryPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/login");

  const supabase = await createServerSupabaseClient();
  const { data: generationsData } = await supabase
    .from("generations")
    .select("*, iterations(*)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const generations = generationsData ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
          <History className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-bold">Generation History</h1>
          <p className="text-sm text-muted-foreground">All your past pipeline runs</p>
        </div>
        <Badge className="ml-auto bg-primary/15 text-primary border-primary/25 text-sm">
          {generations.length} runs
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="h-20 w-20 rounded-3xl bg-card border border-border flex items-center justify-center mb-5">
              <Clapperboard className="h-9 w-9 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground/60 mb-2">No runs yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Head to the{" "}
              <Link href="/dashboard" className="text-primary font-semibold hover:underline">Playground</Link>{" "}
              and generate your first video.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {generations.map((gen: Record<string, unknown>) => {
              const iterations = (gen.iterations as Record<string, unknown>[]) ?? [];
              const bestScore = gen.best_score as number | null;
              const iterCount = iterations.length;
              const latestVideo = (iterations[iterations.length - 1]?.video_url as string) ?? null;
              const hasHealed = iterations.some((it) => it.healed);

              return (
                <div key={gen.id as string} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/25 transition-colors group">
                  <div className="px-5 py-4 flex items-start gap-4">
                    <div className="h-14 w-24 rounded-xl bg-background overflow-hidden shrink-0 border border-border">
                      {latestVideo ? (
                        <video src={latestVideo} muted className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Clapperboard className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">{gen.prompt as string}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{timeAgo(new Date(gen.created_at as string))}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground">{iterCount} iteration{iterCount !== 1 ? "s" : ""}</span>
                        {hasHealed && <Badge className="text-xs h-5 px-2 bg-accent/15 text-accent border-accent/25">Healed</Badge>}
                        <Badge className={`text-xs h-5 px-2 ${gen.status === "done" ? "bg-primary/15 text-primary border-primary/25" : "bg-muted text-muted-foreground border-border"}`}>{gen.status as string}</Badge>
                      </div>
                    </div>
                    {bestScore != null && (
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="h-3.5 w-3.5 text-primary" />
                          <span className={`text-lg font-bold font-mono ${scoreColor(bestScore)}`}>{bestScore}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">best score</p>
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 mt-1 transition-colors" />
                  </div>
                  {iterations.length > 0 && (
                    <div className="px-5 pb-4 flex gap-2 overflow-x-auto">
                      {iterations.map((it) => {
                        const scores = it.scores as EvaluationResult;
                        return (
                          <div key={it.id as string} className="shrink-0 rounded-xl border border-border bg-background overflow-hidden w-32">
                            <video src={it.video_url as string} muted className="w-full aspect-video object-cover" />
                            <div className="px-2 py-1.5 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-mono">#{it.iteration_num as number}</span>
                              <span className={`text-xs font-bold font-mono ${scoreColor(scores.overall)}`}>{scores.overall}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
