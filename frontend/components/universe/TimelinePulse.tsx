"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { EntityBanner } from "@/components/ui/EntityBanner";
import type { TimelineEntry } from "@/lib/api";
import type { UniverseVisualContext } from "@/lib/visual-prompts";

export function TimelinePulse({
  universeId,
  entries,
  visualContext,
}: {
  universeId: string;
  entries: TimelineEntry[];
  visualContext: UniverseVisualContext;
}) {
  if (!entries.length) return null;

  const sorted = [...entries].sort((a, b) => a.era_year - b.era_year);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-[family-name:var(--font-cinzel)] text-lg font-semibold text-white">
          <Clock className="h-5 w-5 text-cyan-400" /> Timeline
        </h3>
        <Link href={`/universe/${universeId}/timeline`} className="text-xs text-cyan-400 hover:text-cyan-300">
          Enter Time Machine →
        </Link>
      </div>
      <div className="relative flex items-center gap-0 overflow-x-auto pb-2">
        <div className="absolute left-4 right-4 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        {sorted.map((entry, i) => (
          <Link
            key={entry.id}
            href={`/universe/${universeId}/timeline`}
            className="relative z-10 flex min-w-[100px] flex-col items-center px-3"
          >
            <div className="relative h-12 w-16 overflow-hidden rounded-md ring-2 ring-cyan-500/40">
              <EntityBanner
                seed={entry.id}
                variant="era"
                title={entry.label}
                subtitle={String(entry.era_year)}
                genre={visualContext.genre}
                style={visualContext.style}
                className="h-full w-full"
                compact
              />
            </div>
            <span className="mt-2 text-xs font-mono text-cyan-300">{entry.era_year}</span>
            <span className="mt-0.5 max-w-[90px] truncate text-[10px] text-white/40">{entry.label}</span>
            {i < sorted.length - 1 && <span className="sr-only">→</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
