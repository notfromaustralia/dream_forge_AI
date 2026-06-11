"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wand2,
  Shield,
  Globe,
  Users,
  BookOpen,
  Sparkles,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRings } from "@/components/universe/ScoreRings";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const queryClient = useQueryClient();
  const { data: universe, refetch: refetchUniverse } = useQuery({
    queryKey: ["universe", id],
    queryFn: () => api.getUniverse(id),
  });
  const { data: scores, refetch: refetchScores } = useQuery({
    queryKey: ["scores", id],
    queryFn: () => api.getScores(id),
  });

  const [editingOverview, setEditingOverview] = useState(false);
  const [overviewDraft, setOverviewDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const counts = universe?.entity_counts;
  const isWorldEmpty = (counts?.factions ?? 0) === 0 && (counts?.locations ?? 0) === 0;
  const hasCharactersOnly = (counts?.characters ?? 0) > 0 && isWorldEmpty;

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["universe", id] }),
      queryClient.invalidateQueries({ queryKey: ["scores", id] }),
      queryClient.invalidateQueries({ queryKey: ["characters", id] }),
      queryClient.invalidateQueries({ queryKey: ["factions", id] }),
      queryClient.invalidateQueries({ queryKey: ["locations", id] }),
      queryClient.invalidateQueries({ queryKey: ["events", id] }),
      queryClient.invalidateQueries({ queryKey: ["stories", id] }),
      queryClient.invalidateQueries({ queryKey: ["timeline", id] }),
    ]);
  };

  const handleValidate = async () => {
    const result = (await api.validate(id)) as { passed?: boolean; score?: number };
    toast.success(`Consistency check: ${result.passed ? "Passed" : "Issues found"} (${result.score ?? 0}%)`);
    refetchScores();
  };

  const handleGenerateCharacter = async () => {
    setBusy("character");
    try {
      await api.generateCharacter(id, universe?.prompt || "Create compelling characters for this world");
      toast.success("Characters generated!");
      await invalidateAll();
    } catch {
      toast.error("Failed to generate characters");
    } finally {
      setBusy(null);
    }
  };

  const handleGenerateLore = async () => {
    setBusy("lore");
    try {
      const result = await api.generateLore(id, universe?.prompt);
      const created = result.created;
      toast.success(
        `World lore built: ${created?.factions?.length ?? 0} factions, ${created?.locations?.length ?? 0} locations, ${created?.events?.length ?? 0} events`
      );
      await invalidateAll();
    } catch {
      toast.error("Failed to build world lore");
    } finally {
      setBusy(null);
    }
  };

  const handleGenerateWorld = async () => {
    setBusy("world");
    try {
      const res = await api.generateWorld(id, {
        prompt: universe?.prompt,
        character_prompt: "Create compelling characters grounded in this world's factions and locations",
        quest_count: 2,
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      const progress: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.event === "agent_complete") {
              const agent = event.agent_id;
              const result = event.result ?? {};
              if (agent === "lore" && result.created) {
                progress.push(
                  `Lore: ${result.created.factions?.length ?? 0} factions, ${result.created.locations?.length ?? 0} locations`
                );
              } else if (agent === "character") {
                progress.push(`Characters: ${result.count ?? 0} created`);
              } else if (agent === "narrative") {
                progress.push(`Quest: ${result.title ?? result.data?.title ?? "created"}`);
              }
            }
          } catch {
            // skip
          }
        }
      }

      toast.success(progress.length ? progress.join(" · ") : "Full world rebuild complete!");
      await invalidateAll();
    } catch {
      toast.error("Failed to rebuild world");
    } finally {
      setBusy(null);
    }
  };

  const handleSaveOverview = async () => {
    setBusy("overview");
    try {
      await api.updateUniverse(id, { overview: overviewDraft });
      toast.success("Overview updated");
      setEditingOverview(false);
      refetchUniverse();
    } catch {
      toast.error("Failed to save overview");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      {hasCharactersOnly && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-medium text-amber-200">This universe has characters but no world lore yet</p>
              <p className="mt-1 text-sm text-amber-200/70">
                Run <strong>Build World Lore</strong> to create factions, locations, events, and timeline entries.
                Or use <strong>Run Full Rebuild</strong> for lore, characters, and quests in one pass.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>World Overview</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setOverviewDraft(universe?.overview || universe?.prompt || "");
              setEditingOverview((v) => !v);
            }}
          >
            <Pencil className="h-3 w-3" />
            {editingOverview ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent>
          {editingOverview ? (
            <div className="space-y-3">
              <textarea
                value={overviewDraft}
                onChange={(e) => setOverviewDraft(e.target.value)}
                className="min-h-[160px] w-full rounded-lg border border-white/10 bg-white/5 p-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Button variant="aurora" size="sm" onClick={handleSaveOverview} disabled={busy === "overview"}>
                Save Overview
              </Button>
            </div>
          ) : (
            <p className="leading-relaxed text-white/80">{universe?.overview || universe?.prompt}</p>
          )}
        </CardContent>
      </Card>

      {scores && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreRings scores={scores} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Entity Counts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Count label="Characters" value={counts?.characters ?? 0} />
            <Count label="Factions" value={counts?.factions ?? 0} />
            <Count label="Locations" value={counts?.locations ?? 0} />
            <Count label="Events" value={counts?.events ?? 0} />
            <Count label="Stories" value={counts?.stories ?? 0} />
            <Count label="Graph edges" value={counts?.graph_edges ?? 0} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          icon={Globe}
          title="Build World Lore"
          desc="Create factions, locations, events, timeline, and overview"
          action="Build Lore"
          loading={busy === "lore"}
          onClick={handleGenerateLore}
          highlight={isWorldEmpty}
        />
        <ActionCard
          icon={Sparkles}
          title="Run Full Rebuild"
          desc="Lore + characters + 2 quests + consistency check"
          action="Rebuild"
          loading={busy === "world"}
          onClick={handleGenerateWorld}
        />
        <ActionCard
          icon={Users}
          title="Generate Characters"
          desc="Add characters linked to existing factions"
          action="Generate"
          loading={busy === "character"}
          onClick={handleGenerateCharacter}
        />
        <ActionCard
          icon={BookOpen}
          title="Generate Quests"
          desc="Create side quests on the Stories page"
          action="Go to Stories"
          href={`/universe/${id}/stories`}
        />
        <ActionCard
          icon={Shield}
          title="Validate Lore"
          desc="Check timeline and consistency"
          action="Check"
          onClick={handleValidate}
        />
        <ActionCard
          icon={Wand2}
          title="Time Machine"
          desc="Explore world state by era"
          action="Open Timeline"
          href={`/universe/${id}/timeline`}
        />
      </div>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-xs text-white/40">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  action,
  onClick,
  href,
  loading,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  action: string;
  onClick?: () => void;
  href?: string;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-violet-500/40 ring-1 ring-violet-500/20" : undefined}>
      <CardContent className="flex flex-col gap-3 p-6">
        <Icon className="h-8 w-8 text-violet-400" />
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="mt-1 text-xs text-white/50">{desc}</p>
        </div>
        {href ? (
          <Link href={href}>
            <Button variant="outline" size="sm">{action}</Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" onClick={onClick} disabled={loading}>
            {loading ? "Working..." : action}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
