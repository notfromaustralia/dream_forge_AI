"use client";

import { Badge } from "@/components/ui/badge";
import { PollinationsImage } from "@/components/ui/PollinationsImage";
import type { Universe } from "@/lib/api";
import { pollinationsBannerUrl, universeBannerPrompt } from "@/lib/visual-prompts";

export function UniverseHero({ universe }: { universe: Universe }) {
  const bannerSrc = pollinationsBannerUrl(universeBannerPrompt(universe), universe.id);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <PollinationsImage
        src={bannerSrc}
        alt={`${universe.name} world banner`}
        className="h-56 md:h-72"
        fallbackClassName="h-56 md:h-72"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className="bg-violet-600/80 text-white border-0">{universe.genre}</Badge>
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">{universe.style}</Badge>
          <Badge variant="outline" className="border-white/20 text-white/70">{universe.audience}</Badge>
        </div>
        <h2 className="font-[family-name:var(--font-cinzel)] text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
          {universe.name}
        </h2>
      </div>
    </div>
  );
}
