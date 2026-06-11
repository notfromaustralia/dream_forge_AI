"use client";

import Link from "next/link";
import { Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PollinationsImage } from "@/components/ui/PollinationsImage";
import type { Faction } from "@/lib/api";
import { factionEmblemPrompt, pollinationsEmblemUrl } from "@/lib/visual-prompts";

function powerColor(level: string) {
  const l = level.toLowerCase();
  if (l.includes("dominant") || l.includes("high") || l.includes("major")) return "border-red-500/40 text-red-300";
  if (l.includes("moderate") || l.includes("medium")) return "border-amber-500/40 text-amber-300";
  return "border-slate-500/40 text-slate-300";
}

export function FactionPreview({
  universeId,
  factions,
  genre,
  memberCounts,
}: {
  universeId: string;
  factions: Faction[];
  genre: string;
  memberCounts: Record<string, number>;
}) {
  const preview = factions.slice(0, 3);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-[family-name:var(--font-cinzel)] text-lg font-semibold text-white">
          <Swords className="h-5 w-5 text-amber-400" /> Power Structure
        </h3>
        <Link href={`/universe/${universeId}/factions`} className="text-xs text-violet-400 hover:text-violet-300">
          View all factions →
        </Link>
      </div>
      {preview.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
          No factions forged yet. Use Forge More to add political blocs.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {preview.map((fac) => (
            <Link
              key={fac.id}
              href={`/universe/${universeId}/factions/${fac.id}`}
              className="group flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-amber-500/30"
            >
              <PollinationsImage
                src={pollinationsEmblemUrl(factionEmblemPrompt(fac, genre), fac.id)}
                alt={`${fac.name} emblem`}
                className="h-14 w-14 shrink-0 rounded-lg"
                fallbackClassName="h-14 w-14 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium text-white group-hover:text-amber-200">{fac.name}</p>
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${powerColor(fac.power_level)}`}>
                    {fac.power_level}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-white/50">{fac.ideology}</p>
                {(memberCounts[fac.id] ?? 0) > 0 && (
                  <p className="mt-2 text-[10px] text-white/30">{memberCounts[fac.id]} members</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
