"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CharacterAvatar } from "./CharacterAvatar";
import { api, type Character } from "@/lib/api";
import { pollinationsPortraitUrl } from "@/lib/visual-prompts";

type CharacterCardProps = {
  character: Character;
  universeId: string;
};

export function CharacterCard({ character, universeId }: CharacterCardProps) {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

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
        {character.motivations && (
          <p className="text-xs text-white/50">{character.motivations}</p>
        )}
        <p className="mt-2 text-xs text-white/30">
          Era: {character.era_start}
          {character.era_end ? `–${character.era_end}` : "+"}
        </p>
      </CardContent>
    </Card>
  );
}
