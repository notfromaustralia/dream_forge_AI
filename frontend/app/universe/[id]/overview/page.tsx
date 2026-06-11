"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { EntityAtlas } from "@/components/universe/EntityAtlas";
import { FactionPreview } from "@/components/universe/FactionPreview";
import { ForgeMorePanel } from "@/components/universe/ForgeMorePanel";
import { TimelinePulse } from "@/components/universe/TimelinePulse";
import { UniverseHero } from "@/components/universe/UniverseHero";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: universe } = useQuery({ queryKey: ["universe", id], queryFn: () => api.getUniverse(id) });
  const { data: factions } = useQuery({ queryKey: ["factions", id], queryFn: () => api.getFactions(id) });
  const { data: characters } = useQuery({ queryKey: ["characters", id], queryFn: () => api.getCharacters(id) });
  const { data: timeline } = useQuery({ queryKey: ["timeline", id], queryFn: () => api.getTimeline(id) });

  const memberCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    characters?.forEach((c) => {
      if (c.faction_id) counts[c.faction_id] = (counts[c.faction_id] ?? 0) + 1;
    });
    return counts;
  }, [characters]);

  if (!universe) {
    return <div className="animate-pulse h-96 rounded-2xl bg-white/5" />;
  }

  return (
    <div className="space-y-8">
      <UniverseHero universe={universe} />

      <Card className="border-white/10 bg-white/[0.02]">
        <CardContent className="p-6 md:p-8">
          <h3 className="mb-3 font-[family-name:var(--font-cinzel)] text-lg font-semibold text-white">World Synopsis</h3>
          <p className="text-white/75 leading-relaxed text-base md:text-lg">
            {universe.overview || universe.prompt}
          </p>
        </CardContent>
      </Card>

      <EntityAtlas universeId={id} counts={universe.entity_counts} />

      <FactionPreview
        universeId={id}
        factions={factions ?? []}
        genre={universe.genre}
        memberCounts={memberCounts}
      />

      {timeline && timeline.length > 0 && (
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="p-6">
            <TimelinePulse universeId={id} entries={timeline} />
          </CardContent>
        </Card>
      )}

      <ForgeMorePanel universeId={id} />
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
