"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Swords } from "lucide-react";
import { FactionCard } from "@/components/factions/FactionCard";
import { WorldEmptyState } from "@/components/universe/WorldEmptyState";
import { api } from "@/lib/api";

export default function FactionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: universe } = useQuery({ queryKey: ["universe", id], queryFn: () => api.getUniverse(id) });
  const { data: factions, isLoading } = useQuery({
    queryKey: ["factions", id],
    queryFn: () => api.getFactions(id),
  });
  const { data: characters } = useQuery({
    queryKey: ["characters", id],
    queryFn: () => api.getCharacters(id),
  });

  const memberCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    characters?.forEach((c) => {
      if (c.faction_id) counts[c.faction_id] = (counts[c.faction_id] ?? 0) + 1;
    });
    return counts;
  }, [characters]);

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-cinzel)] text-2xl font-bold text-white">
          <Swords className="h-6 w-6 text-amber-400" /> Factions & Power Blocs
        </h2>
        <p className="mt-1 text-sm text-white/50">
          Political groups, guilds, and orders that shape your universe&apos;s conflicts and alliances.
        </p>
      </div>

      {!factions?.length ? (
        <WorldEmptyState
          universeId={id}
          icon={Swords}
          title="No factions yet"
          description='Use "Add Factions" in Forge More on the Overview page to create political groups for your world.'
          accentClass="text-amber-400"
          borderClass="border-amber-500/20"
          bgClass="bg-amber-500/5"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {factions.map((fac) => (
            <FactionCard
              key={fac.id}
              faction={fac}
              universeId={id}
              genre={universe?.genre ?? "fantasy"}
              memberCount={memberCounts[fac.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
