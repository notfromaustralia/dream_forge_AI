"use client";

import { Badge } from "@/components/ui/badge";
import { EntityBanner } from "@/components/ui/EntityBanner";
import type { Universe } from "@/lib/api";

export function UniverseHero({ universe }: { universe: Universe }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <EntityBanner
        seed={universe.id}
        variant="universe"
        title={universe.name}
        subtitle={`${universe.genre} · ${universe.style}`}
        genre={universe.genre}
        style={universe.style}
        className="h-56 md:h-72"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge className="border-0 bg-violet-600/80 text-white">{universe.genre}</Badge>
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">{universe.style}</Badge>
          <Badge variant="outline" className="border-white/20 text-white/70">{universe.audience}</Badge>
        </div>
        <h2 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-white drop-shadow-lg md:text-4xl">
          {universe.name}
        </h2>
      </div>
    </div>
  );
}
