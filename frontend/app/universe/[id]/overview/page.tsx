"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Wand2, Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRings } from "@/components/universe/ScoreRings";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: universe } = useQuery({ queryKey: ["universe", id], queryFn: () => api.getUniverse(id) });
  const { data: scores, refetch } = useQuery({ queryKey: ["scores", id], queryFn: () => api.getScores(id) });

  const handleValidate = async () => {
    const result = await api.validate(id) as { passed?: boolean; score?: number };
    toast.success(`Consistency check: ${result.passed ? "Passed" : "Issues found"} (${result.score ?? 0}%)`);
    refetch();
  };

  const handleGenerateCharacter = async () => {
    await api.generateCharacter(id, "Create an intriguing new character");
    toast.success("Character generated!");
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>World Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/80 leading-relaxed">{universe?.overview || universe?.prompt}</p>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6">
            <Wand2 className="h-8 w-8 text-violet-400" />
            <p className="font-medium text-white">Generate Character</p>
            <Button variant="outline" size="sm" onClick={handleGenerateCharacter}>Generate</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6">
            <Shield className="h-8 w-8 text-cyan-400" />
            <p className="font-medium text-white">Validate Lore</p>
            <Button variant="outline" size="sm" onClick={handleValidate}>Check</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6">
            <Search className="h-8 w-8 text-emerald-400" />
            <p className="font-medium text-white">Entity Counts</p>
            <p className="text-xs text-white/50">
              {universe?.entity_counts?.characters ?? 0} chars · {universe?.entity_counts?.factions ?? 0} factions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
