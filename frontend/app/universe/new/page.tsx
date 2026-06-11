"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

const FALLBACK_AUDIENCES = ["general", "young adult", "mature", "all ages"];

const AGENT_STEPS = ["lore", "characters", "consistency", "narrative"] as const;
const AGENT_LABELS: Record<string, string> = {
  lore: "World Lore",
  characters: "Characters",
  consistency: "Consistency Check",
  narrative: "Main Narrative",
};

export default function CreateUniversePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("I want a dark fantasy world where dragons disappeared 1000 years ago.");
  const [genre, setGenre] = useState("dark fantasy");
  const [style, setStyle] = useState("epic");
  const [audience, setAudience] = useState("general");
  const [genreAlts, setGenreAlts] = useState<string[]>([]);
  const [styleAlts, setStyleAlts] = useState<string[]>([]);
  const [tagReasoning, setTagReasoning] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [customGenre, setCustomGenre] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [completedAgents, setCompletedAgents] = useState<string[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    if (!prompt.trim()) return;
    setSuggesting(true);
    try {
      const tags = await api.suggestTags(prompt);
      setGenre(tags.genre);
      setStyle(tags.style);
      setAudience(tags.audience);
      setGenreAlts(tags.genre_alternatives);
      setStyleAlts(tags.style_alternatives);
      setTagReasoning(tags.reasoning);
    } catch {
      setTagReasoning("AI suggestions unavailable — pick or type your own tags.");
    } finally {
      setSuggesting(false);
    }
  }, [prompt]);

  useEffect(() => {
    if (step === 2) fetchTags();
  }, [step, fetchTags]);

  const handleGenerate = async () => {
    setGenerating(true);
    setCompletedAgents([]);
    setActiveAgent(null);
    try {
      const res = await api.generateUniverse({ prompt, genre, style, audience });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let universeId = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.event === "workflow_started" && event.universe_id) {
              universeId = event.universe_id;
            }
            if (event.event === "agent_started") {
              setActiveAgent(event.agent_id);
            }
            if (event.event === "agent_complete") {
              setCompletedAgents((p) => [...p, event.agent_id]);
              setActiveAgent(null);
            }
            if (event.event === "workflow_complete" && event.universe_id) {
              universeId = event.universe_id;
            }
          } catch {
            // skip
          }
        }
      }

      if (universeId) {
        toast.success("Universe created!");
        router.push(`/universe/${universeId}/overview`);
      } else {
        const universes = await api.listUniverses();
        const latest = universes.universes[0];
        if (latest) router.push(`/universe/${latest.id}/overview`);
      }
    } catch {
      toast.error("Generation failed. Is the backend running?");
    } finally {
      setGenerating(false);
    }
  };

  const allGenreOptions = [genre, ...genreAlts].filter((v, i, a) => v && a.indexOf(v) === i);
  const allStyleOptions = [style, ...styleAlts].filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <div className="aurora-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold text-white">
            Create New Universe
          </h1>
          <p className="mt-2 text-white/60">Step {step} of 3</p>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>
                {step === 1 && "Describe Your World"}
                {step === 2 && "Genre & Style"}
                {step === 3 && "Review & Generate"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[120px]"
                  placeholder="I want a world where..."
                />
              )}

              {step === 2 && (
                <div className="space-y-5">
                  {suggesting && (
                    <p className="flex items-center gap-2 text-sm text-violet-300">
                      <Loader2 className="h-4 w-4 animate-spin" /> AI analyzing your world...
                    </p>
                  )}
                  {tagReasoning && !suggesting && (
                    <p className="text-xs text-white/40 italic">{tagReasoning}</p>
                  )}

                  <div>
                    <label className="text-sm text-white/60">Genre</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {allGenreOptions.map((g) => (
                        <Button key={g} variant={genre === g ? "default" : "outline"} size="sm" onClick={() => setGenre(g)}>
                          {g}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={customGenre}
                        onChange={(e) => setCustomGenre(e.target.value)}
                        placeholder="Or type custom genre..."
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customGenre.trim()) {
                            setGenre(customGenre.trim());
                            setCustomGenre("");
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={() => { if (customGenre.trim()) { setGenre(customGenre.trim()); setCustomGenre(""); } }}>
                        Add
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-white/60">Style</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {allStyleOptions.map((s) => (
                        <Button key={s} variant={style === s ? "default" : "outline"} size="sm" onClick={() => setStyle(s)}>
                          {s}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={customStyle}
                        onChange={(e) => setCustomStyle(e.target.value)}
                        placeholder="Or type custom style..."
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customStyle.trim()) {
                            setStyle(customStyle.trim());
                            setCustomStyle("");
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={() => { if (customStyle.trim()) { setStyle(customStyle.trim()); setCustomStyle(""); } }}>
                        Add
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-white/60">Audience</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[audience, ...FALLBACK_AUDIENCES].filter((v, i, a) => a.indexOf(v) === i).map((a) => (
                        <Button key={a} variant={audience === a ? "default" : "outline"} size="sm" onClick={() => setAudience(a)}>
                          {a}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={fetchTags} disabled={suggesting}>
                    Regenerate suggestions
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 text-sm text-white/80">
                  <p><strong>Prompt:</strong> {prompt}</p>
                  <p><strong>Genre:</strong> {genre} | <strong>Style:</strong> {style} | <strong>Audience:</strong> {audience}</p>

                  {generating && (
                    <div className="mt-4 space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                      <p className="text-xs font-mono uppercase tracking-wider text-violet-300">Forging pipeline</p>
                      {AGENT_STEPS.map((agentId) => {
                        const done = completedAgents.includes(agentId);
                        const active = activeAgent === agentId;
                        return (
                          <div key={agentId} className="flex items-center gap-2">
                            {done ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : active ? (
                              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-white/20" />
                            )}
                            <span className={done ? "text-emerald-300" : active ? "text-violet-300" : "text-white/40"}>
                              {AGENT_LABELS[agentId] ?? agentId}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)} disabled={generating}>
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button variant="aurora" onClick={() => setStep(step + 1)} className="ml-auto">
                    Continue
                  </Button>
                ) : (
                  <Button variant="aurora" onClick={handleGenerate} disabled={generating} className="ml-auto gap-2">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generating ? "Forging..." : "Generate Universe"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
