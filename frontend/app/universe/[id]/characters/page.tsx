"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CharacterCard } from "@/components/characters/CharacterCard";
import { api } from "@/lib/api";

export default function CharactersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters", id],
    queryFn: () => api.getCharacters(id),
  });
  const { data: factions } = useQuery({
    queryKey: ["factions", id],
    queryFn: () => api.getFactions(id),
  });

  const factionMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    factions?.forEach((f) => { map[f.id] = f.name; });
    return map;
  }, [factions]);

  const { data: locations } = useQuery({
    queryKey: ["locations", id],
    queryFn: () => api.getLocations(id),
  });

  const locationMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    locations?.forEach((l) => { map[l.id] = l.name; });
    return map;
  }, [locations]);

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {characters?.map((char) => (
        <CharacterCard
          key={char.id}
          character={char}
          universeId={id}
          factionName={char.faction_id ? factionMap[char.faction_id] : undefined}
          locationName={char.location_id ? locationMap[char.location_id] : undefined}
        />
      ))}
    </div>
  );
}
