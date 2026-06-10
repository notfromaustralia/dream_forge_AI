"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface DebateMessage {
  agent: string;
  stance: string;
  reasoning: string;
}

const AGENT_COLORS: Record<string, string> = {
  character_agent: "from-violet-600 to-purple-500",
  narrative_agent: "from-cyan-600 to-blue-500",
  consistency_agent: "from-amber-600 to-orange-500",
};

export function CouncilDebate({ universeId }: { universeId: string }) {
  const [topic, setTopic] = useState("Should Lyra ally with the Order before the vault heist?");
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [consensus, setConsensus] = useState("");
  const [loading, setLoading] = useState(false);

  const startDebate = async () => {
    setLoading(true);
    setMessages([]);
    setConsensus("");
    try {
      const res = await api.councilDebate(universeId, topic);
      const reader = res.body?.getReader();
      if (!reader) return;
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
                { agent: event.agent, stance: event.stance, reasoning: event.reasoning },
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-400" />
            AI World Council
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Debate topic..." />
          <Button onClick={startDebate} disabled={loading} variant="aurora" className="w-full">
            <Sparkles className="h-4 w-4" />
            {loading ? "Council in session..." : "Convene Council"}
          </Button>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className={`rounded-xl border border-white/10 bg-gradient-to-r ${AGENT_COLORS[msg.agent] ?? "from-slate-600 to-slate-500"} p-0.5`}
              >
                <div className="rounded-[10px] bg-slate-900/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    {msg.agent.replace("_", " ")}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">{msg.stance}</p>
                  <p className="mt-2 text-xs text-white/60">{msg.reasoning}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            Council Consensus
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consensus ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm leading-relaxed text-white/80"
            >
              {consensus}
            </motion.p>
          ) : (
            <p className="text-sm text-white/40">
              Convene the council to see multi-agent debate and consensus.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
