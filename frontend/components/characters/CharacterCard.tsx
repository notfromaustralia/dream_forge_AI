"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CharacterAvatar } from "./CharacterAvatar";
import { api, type Character } from "@/lib/api";
import { pollinationsPortraitUrl } from "@/lib/visual-prompts";

type CharacterCardProps = {
  character: Character;
  universeId: string;
  factionName?: string;
  locationName?: string;
};

export function CharacterCard({ character, universeId, factionName: factionNameProp, locationName: locationNameProp }: CharacterCardProps) {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: factions } = useQuery({
    queryKey: ["factions", universeId],
    queryFn: () => api.getFactions(universeId),
  });
  const { data: locations } = useQuery({
    queryKey: ["locations", universeId],
    queryFn: () => api.getLocations(universeId),
  });

  const factionName = factionNameProp ?? factions?.find((f) => f.id === character.faction_id)?.name;
  const locationName = locationNameProp ?? locations?.find((l) => l.id === character.location_id)?.name;

  const bgPortrait =
    character.portrait_prompt && character.portrait_status === "ready"
      ? pollinationsPortraitUrl(character.portrait_prompt, character.id, 256)
      : null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.generatePortrait(universeId, character.id);
      toast.success(`Portrait generated for ${character.name}`);
      await queryClient.invalidateQueries({ queryKey: ["characters", universeId] });
    } catch {
      toast.error("Failed to generate portrait");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-white/10 bg-white/5">
      {bgPortrait && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] blur-2xl"
          style={{
            backgroundImage: `url(${bgPortrait})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
      )}
      <CardHeader className="relative text-center">
        <CharacterAvatar
          character={character}
          universeId={universeId}
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
