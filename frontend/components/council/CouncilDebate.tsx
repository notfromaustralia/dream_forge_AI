"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Brain, MessageSquare, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface DebateMessage {
  agent: string;
  title: string;
  stance: string;
  reasoning: string;
}

const AGENT_COLORS: Record<string, string> = {
  lore_keeper: "from-amber-600 to-orange-500",
  story_architect: "from-violet-600 to-purple-500",
  continuity_judge: "from-cyan-600 to-blue-500",
};

function buildSuggestedTopics(ctx: Awaited<ReturnType<typeof api.getWorldContext>> | undefined): string[] {
  if (!ctx) return ["What should happen next in this world?"];
  const topics: string[] = [];
  if (ctx.factions.length >= 2) {
    topics.push(`Should ${ctx.factions[0].name} ally with or oppose ${ctx.factions[1].name}?`);
  }
  if (ctx.characters.length) {
    topics.push(`What is the best path forward for ${ctx.characters[0].name}?`);
  }
  if (ctx.events.length) {
    topics.push(`How should the world respond to: ${ctx.events[0].title}?`);
  }
  topics.push("What major conflict should drive the next chapter of this universe?");
  return topics.slice(0, 4);
}

export function CouncilDebate({ universeId }: { universeId: string }) {
  const { data: worldContext } = useQuery({
    queryKey: ["world-context", universeId],
    queryFn: () => api.getWorldContext(universeId),
  });
  const { data: universe } = useQuery({
    queryKey: ["universe", universeId],
    queryFn: () => api.getUniverse(universeId),
  });

  const suggested = buildSuggestedTopics(worldContext);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [consensus, setConsensus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!topic && suggested[0]) setTopic(suggested[0]);
  }, [suggested, topic]);

  const startDebate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a debate topic");
      return;
    }
    setLoading(true);
    setMessages([]);
    setConsensus("");
    try {
      const contextSummary = worldContext
        ? `Universe: ${worldContext.name}. Overview: ${worldContext.overview.slice(0, 400)}`
        : "";
      const res = await api.councilDebate(universeId, topic, contextSummary);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.event === "agent_argument") {
              setMessages((prev) => [
                ...prev,
                {
                  agent: event.agent,
                  title: event.title ?? event.agent,
                  stance: event.stance,
                  reasoning: event.reasoning,
                },
              ]);
            }
            if (event.event === "council_consensus") {
              setConsensus(event.consensus);
            }
          } catch {
            // skip malformed
          }
        }
      }
      if (!messages.length) {
        toast.success("Council session complete");
      }
    } catch (e) {
      console.error(e);
      toast.error("Council session failed. Is the backend running with an LLM API key?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Purpose explainer */}
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-slate-950 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
            <Brain className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-white">
              AI World Council
            </h2>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              The Council is your <strong className="text-white/80">writers&apos; room</strong> — three AI personas
              debate story decisions using <em>your universe&apos;s actual lore</em> (factions, characters, events).
              No new characters or stories are created during a debate; you get arguments and a consensus recommendation
              to guide your next creative move.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-amber-500/30 text-amber-300">Lore Keeper</Badge>
              <Badge variant="outline" className="border-violet-500/30 text-violet-300">Story Architect</Badge>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">Continuity Judge</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* World context snapshot */}
      {worldContext && (
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/50 flex items-center gap-2">
              <Users className="h-4 w-4" /> Council brief — {universe?.name ?? worldContext.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-white/45 leading-relaxed">
            <p className="line-clamp-2">{worldContext.overview || "No overview yet."}</p>
            <p className="mt-2">
              {worldContext.factions.length} factions · {worldContext.characters.length} characters ·{" "}
              {worldContext.locations.length} locations · {worldContext.events.length} events
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-violet-400" />
              Convene Council
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Debate topic</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What decision should the council debate?"
              />
            </div>

            <div>
              <p className="text-xs text-white/40 mb-2">Suggested from your world</p>
              <div className="flex flex-wrap gap-2">
                {suggested.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60 hover:border-violet-500/30 hover:text-violet-200 transition-colors text-left"
                  >
                    {t.length > 60 ? `${t.slice(0, 60)}…` : t}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={startDebate} disabled={loading} variant="aurora" className="w-full">
              <Sparkles className="h-4 w-4" />
              {loading ? "Council in session..." : "Start Debate"}
            </Button>

            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {messages.map((msg, i) => (
                <motion.div
                  key={`${msg.agent}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className={`rounded-xl border border-white/10 bg-gradient-to-r p-0.5 ${AGENT_COLORS[msg.agent] ?? "from-slate-600 to-slate-500"}`}
                >
                  <div className="rounded-[10px] bg-slate-900/90 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      {msg.title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">{msg.stance}</p>
                    <p className="mt-2 text-xs text-white/60 leading-relaxed">{msg.reasoning}</p>
                  </div>
                </motion.div>
              ))}
              {loading && messages.length === 0 && (
                <p className="text-sm text-white/40 animate-pulse">Council members are deliberating...</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              Council Consensus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consensus ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm leading-relaxed text-white/80">{consensus}</p>
                <p className="mt-4 text-xs text-white/35">
                  Use this recommendation to guide Forge More, quest generation, or your next story beat.
                </p>
              </motion.div>
            ) : (
              <p className="text-sm text-white/40">
                Start a debate to receive a synthesized recommendation from all three council personas,
                grounded in your universe&apos;s lore.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
