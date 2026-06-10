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

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {characters?.map((char) => (
        <CharacterCard key={char.id} character={char} universeId={id} />
      ))}
    </div>
  );
}
