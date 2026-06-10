"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

const GENRES = ["fantasy", "sci-fi", "cyberpunk", "horror", "solarpunk", "dark fantasy"];
const STYLES = ["epic", "gritty", "whimsical", "noir", "mythic"];
const AUDIENCES = ["general", "young adult", "mature", "all ages"];

export default function CreateUniversePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("I want a dark fantasy world where dragons disappeared 1000 years ago.");
  const [genre, setGenre] = useState("dark fantasy");
  const [style, setStyle] = useState("epic");
  const [audience, setAudience] = useState("general");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress([]);
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
              setProgress((p) => [...p, `Running ${event.agent_id}...`]);
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
                {step === 2 && "Set Genre & Style"}
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
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/60">Genre</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {GENRES.map((g) => (
                        <Button key={g} variant={genre === g ? "default" : "outline"} size="sm" onClick={() => setGenre(g)}>
                          {g}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Style</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {STYLES.map((s) => (
                        <Button key={s} variant={style === s ? "default" : "outline"} size="sm" onClick={() => setStyle(s)}>
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Audience</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {AUDIENCES.map((a) => (
                        <Button key={a} variant={audience === a ? "default" : "outline"} size="sm" onClick={() => setAudience(a)}>
                          {a}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 text-sm text-white/80">
                  <p><strong>Prompt:</strong> {prompt}</p>
                  <p><strong>Genre:</strong> {genre} | <strong>Style:</strong> {style} | <strong>Audience:</strong> {audience}</p>
                  {generating && (
                    <div className="space-y-2">
                      {progress.map((p, i) => (
                        <p key={i} className="flex items-center gap-2 text-violet-300">
                          <Loader2 className="h-3 w-3 animate-spin" /> {p}
                        </p>
                      ))}
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
