"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityBanner } from "@/components/ui/EntityBanner";
import { CharacterAvatar } from "./CharacterAvatar";
import { api, type Character } from "@/lib/api";
import { toVisualContext, type UniverseVisualContext } from "@/lib/visual-prompts";

type CharacterCardProps = {
  character: Character;
  universeId: string;
  visualContext?: UniverseVisualContext;
  factionName?: string;
  locationName?: string;
};

export function CharacterCard({
  character,
  universeId,
  visualContext: visualContextProp,
  factionName: factionNameProp,
  locationName: locationNameProp,
}: CharacterCardProps) {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: universe } = useQuery({
    queryKey: ["universe", universeId],
    queryFn: () => api.getUniverse(universeId),
    enabled: !visualContextProp,
  });

  const { data: factions } = useQuery({
    queryKey: ["factions", universeId],
    queryFn: () => api.getFactions(universeId),
  });
  const { data: locations } = useQuery({
    queryKey: ["locations", universeId],
    queryFn: () => api.getLocations(universeId),
  });

  const visualContext = visualContextProp ?? (universe ? toVisualContext(universe) : undefined);
  const factionName = factionNameProp ?? factions?.find((f) => f.id === character.faction_id)?.name;
  const locationName = locationNameProp ?? locations?.find((l) => l.id === character.location_id)?.name;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.generatePortrait(universeId, character.id);
      toast.success(`Enhanced portrait for ${character.name}`);
      await queryClient.invalidateQueries({ queryKey: ["characters", universeId] });
    } catch {
      toast.error("Failed to generate portrait");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-white/10 bg-white/5">
      {visualContext && (
        <EntityBanner
          seed={character.id}
          variant="character"
          title={character.name}
          subtitle={character.story_importance}
          genre={visualContext.genre}
          style={visualContext.style}
          className="h-20"
          compact
        />
      )}
      <CardHeader className="relative -mt-8 text-center">
        <CharacterAvatar
          character={character}
          visualContext={visualContext}
          factionName={factionName}
          locationName={locationName}
          onGenerate={handleGenerate}
          generating={generating}
        />
        <div className="mt-4 flex items-center justify-center gap-2">
          <CardTitle className="text-lg">{character.name}</CardTitle>
          <Badge variant={character.story_importance === "protagonist" ? "default" : "outline"}>
            {character.story_importance}
          </Badge>
        </div>
        <CardDescription className="line-clamp-3 text-left">{character.bio}</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        {(factionName || locationName) && (
          <div className="mb-2 flex flex-wrap gap-2">
            {factionName && (
              <Badge variant="secondary" className="text-xs border-amber-500/30 text-amber-200">
                Faction: {factionName}
              </Badge>
            )}
            {locationName && (
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-200">
                Location: {locationName}
              </Badge>
            )}
          </div>
        )}
        {character.motivations && (
          <p className="text-xs text-white/50">{character.motivations}</p>
        )}
        <p className="text-xs text-white/30">
          Era: {character.era_start}
          {character.era_end ? `–${character.era_end}` : "+"}
        </p>
      </CardContent>
    </Card>
  );
}
