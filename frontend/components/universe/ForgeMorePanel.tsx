"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Focus = "all" | "factions" | "timeline" | "locations";

export function ForgeMorePanel({ universeId }: { universeId: string }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState<Focus | "story" | null>(null);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["universe", universeId] });
    queryClient.invalidateQueries({ queryKey: ["factions", universeId] });
    queryClient.invalidateQueries({ queryKey: ["stories", universeId] });
    queryClient.invalidateQueries({ queryKey: ["timeline", universeId] });
    queryClient.invalidateQueries({ queryKey: ["events", universeId] });
    queryClient.invalidateQueries({ queryKey: ["characters", universeId] });
  };

  const run = async (action: Focus | "story") => {
    if (!prompt.trim()) {
      toast.error("Describe what you want to add or change");
      return;
    }
    setLoading(action);
    try {
      if (action === "story") {
        await api.expandStory(universeId, prompt);
        toast.success("Story expanded!");
      } else {
        await api.expandLore(universeId, prompt, action);
        toast.success("Lore expanded!");
      }
      setPrompt("");
      invalidate();
    } catch {
      toast.error("Expansion failed");
    } finally {
      setLoading(null);
    }
  };

  const actions: { id: Focus | "story"; label: string }[] = [
    { id: "all", label: "Expand Lore" },
    { id: "factions", label: "Add Factions" },
    { id: "timeline", label: "Add Timeline" },
    { id: "locations", label: "Add Locations" },
    { id: "story", label: "Grow Story" },
  ];

  return (
    <Card className="border-violet-500/20 bg-violet-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-violet-400" /> Forge More
        </CardTitle>
        <p className="text-sm text-white/50">
          Continue building your universe — expand lore, factions, timeline, or story.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Add a secret society that opposes the ruling council, or extend the timeline with a great war..."
          className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[90px]"
        />
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button
              key={a.id}
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() => run(a.id)}
              className="gap-1"
            >
              {loading === a.id && <Loader2 className="h-3 w-3 animate-spin" />}
              {a.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
