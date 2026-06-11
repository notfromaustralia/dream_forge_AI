"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type ExpandLoreResponse } from "@/lib/api";
import { toast } from "sonner";

type Focus = "all" | "factions" | "timeline" | "locations";

const FOCUS_PLACEHOLDERS: Record<Focus | "story", string> = {
  all: "e.g. Expand the world with new political tensions and a hidden religion...",
  factions: "e.g. Add a secret merchant guild that controls the undercity black markets...",
  timeline: "e.g. Add an era called The Sundering — a 50-year war that reshaped borders...",
  locations: "e.g. Add a mist-shrouded archipelago of floating ruins off the northern coast...",
  story: "e.g. Introduce a civil war subplot between two rival factions...",
};

function summarizeCreated(result: ExpandLoreResponse): string {
  const c = result.created;
  if (!c) return "";
  const parts: string[] = [];
  if (c.factions?.length) parts.push(`${c.factions.length} faction(s)`);
  if (c.locations?.length) parts.push(`${c.locations.length} location(s)`);
  if (c.events?.length) parts.push(`${c.events.length} event(s)`);
  if (c.timeline?.length) parts.push(`${c.timeline.length} era(s)`);
  return parts.join(", ");
}

export function ForgeMorePanel({ universeId }: { universeId: string }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState<Focus | "story" | null>(null);
  const [lastFocus, setLastFocus] = useState<Focus | "story">("all");
  const queryClient = useQueryClient();

  const invalidate = (focus: Focus | "story") => {
    queryClient.invalidateQueries({ queryKey: ["universe", universeId] });
    queryClient.invalidateQueries({ queryKey: ["factions", universeId] });
    queryClient.invalidateQueries({ queryKey: ["locations", universeId] });
    queryClient.invalidateQueries({ queryKey: ["stories", universeId] });
    queryClient.invalidateQueries({ queryKey: ["timeline", universeId] });
    queryClient.invalidateQueries({ queryKey: ["events", universeId] });
    queryClient.invalidateQueries({ queryKey: ["characters", universeId] });
    if (focus === "story") {
      queryClient.invalidateQueries({ queryKey: ["stories", universeId] });
    }
  };

  const run = async (action: Focus | "story") => {
    if (!prompt.trim()) {
      toast.error("Describe what you want to add or change");
      return;
    }
    setLoading(action);
    setLastFocus(action);
    try {
      if (action === "story") {
        await api.expandStory(universeId, prompt);
        toast.success("Story expanded!");
        setPrompt("");
        invalidate(action);
        return;
      }

      const result = await api.expandLore(universeId, prompt, action);
      if (result.error) {
        toast.error(`Expansion failed: ${result.error}`);
        return;
      }

      const summary = summarizeCreated(result);
      if (!summary) {
        toast.warning(
          "No new entities were added. Try a more specific prompt or check that your LLM API key is configured."
        );
      } else {
        toast.success(`Added ${summary}`);
      }
      setPrompt("");
      invalidate(action);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Expansion failed");
    } finally {
      setLoading(null);
    }
  };

  const actions: { id: Focus | "story"; label: string; hint: string }[] = [
    { id: "all", label: "Expand Lore", hint: "General world-building" },
    { id: "factions", label: "Add Factions", hint: "Political groups" },
    { id: "timeline", label: "Add Timeline", hint: "Eras & events" },
    { id: "locations", label: "Add Locations", hint: "Places & regions" },
    { id: "story", label: "Grow Story", hint: "Narrative arcs" },
  ];

  return (
    <Card className="border-violet-500/20 bg-violet-500/5" id="forge-more">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-violet-400" /> Forge More
        </CardTitle>
        <p className="text-sm text-white/50">
          Continue building your universe. AI uses existing lore as context — new content merges into your world.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={FOCUS_PLACEHOLDERS[lastFocus]}
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
              title={a.hint}
            >
              {loading === a.id && <Loader2 className="h-3 w-3 animate-spin" />}
              {a.label}
            </Button>
          ))}
        </div>
        <p className="text-[11px] text-white/30">
          After forging, check Factions, Locations, Events, or Time Machine to see new content.
        </p>
      </CardContent>
    </Card>
  );
}
