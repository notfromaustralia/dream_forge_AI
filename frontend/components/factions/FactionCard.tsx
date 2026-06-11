"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PollinationsImage } from "@/components/ui/PollinationsImage";
import type { Faction } from "@/lib/api";
import { factionEmblemPrompt, pollinationsEmblemUrl } from "@/lib/visual-prompts";

function powerColor(level: string) {
  const l = level.toLowerCase();
  if (l.includes("dominant") || l.includes("high") || l.includes("major")) return "bg-red-500/20 text-red-300 border-red-500/30";
  if (l.includes("moderate") || l.includes("medium")) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return "bg-slate-500/20 text-slate-300 border-slate-500/30";
}

export function FactionCard({
  faction,
  universeId,
  genre,
  memberCount = 0,
}: {
  faction: Faction;
  universeId: string;
  genre: string;
  memberCount?: number;
}) {
  return (
    <Link href={`/universe/${universeId}/factions/${faction.id}`}>
      <Card className="group h-full transition-all hover:border-amber-500/30 hover:shadow-amber-500/5 hover:shadow-lg">
        <CardHeader className="flex flex-row gap-4">
          <PollinationsImage
            src={pollinationsEmblemUrl(factionEmblemPrompt(faction, genre), faction.id)}
            alt={`${faction.name} emblem`}
            className="h-16 w-16 shrink-0 rounded-xl"
            fallbackClassName="h-16 w-16 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="group-hover:text-amber-200">{faction.name}</CardTitle>
              <Badge variant="outline" className={`shrink-0 text-[10px] ${powerColor(faction.power_level)}`}>
                {faction.power_level}
              </Badge>
            </div>
            <CardDescription className="mt-1 line-clamp-2">{faction.ideology}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-white/50">Territory: {faction.territory || "Unknown"}</p>
          {memberCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Users className="h-3 w-3" /> {memberCount}
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
