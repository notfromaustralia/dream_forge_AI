"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryCard } from "@/components/stories/StoryCard";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function StoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questPrompt, setQuestPrompt] = useState("");
  const [factionName, setFactionName] = useState("");

  const { data: stories, isLoading, refetch } = useQuery({
    queryKey: ["stories", id],
    queryFn: () => api.getStories(id),
  });
  const { data: factions } = useQuery({
    queryKey: ["factions", id],
    queryFn: () => api.getFactions(id),
  });

  const handleGenerateQuest = async () => {
    setGenerating(true);
    try {
      const prompt = questPrompt.trim() || "Create a compelling side quest set in this universe.";
      const result = await api.generateQuest(
        id,
        prompt,
        factionName || undefined
      ) as { data?: { title?: string }; title?: string };
      toast.success(`Quest generated: ${result.title ?? result.data?.title ?? "New Quest"}`);
      setDialogOpen(false);
      setQuestPrompt("");
      setFactionName("");
      refetch();
    } catch {
      toast.error("Failed to generate quest");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-white">Stories & Quests</h2>
          <p className="text-sm text-white/50">Narratives forged from your world&apos;s lore and factions.</p>
        </div>
        <Button variant="aurora" onClick={() => setDialogOpen(true)} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Side Quest
        </Button>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-white">Generate Side Quest</h3>
            <p className="mt-1 text-sm text-white/50">
              AI will use your universe&apos;s factions, characters, and lore as context.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-white/50">Faction focus (optional)</label>
                <select
                  value={factionName}
                  onChange={(e) => setFactionName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  <option value="">Let AI choose</option>
                  {factions?.map((f) => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50">Custom prompt (optional)</label>
                <textarea
                  value={questPrompt}
                  onChange={(e) => setQuestPrompt(e.target.value)}
                  placeholder="e.g. A mystery quest involving a missing relic in the undercity..."
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/30 min-h-[80px]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generating}>
                Cancel
              </Button>
              <Button variant="aurora" onClick={handleGenerateQuest} disabled={generating} className="gap-2">
                {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                {generating ? "Forging quest..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {stories?.map((story, i) => (
          <Link key={story.id} href={`/universe/${id}/stories/${story.id}`}>
            <StoryCard story={story} index={i} />
          </Link>
        ))}
      </div>
    </div>
  );
}
