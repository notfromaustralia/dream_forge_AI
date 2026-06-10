"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dicebearAvatarUrl, pollinationsPortraitUrl } from "@/lib/visual-prompts";
import type { Character } from "@/lib/api";

type CharacterAvatarProps = {
  character: Character;
  universeId: string;
  size?: number;
  onGenerate?: () => Promise<void>;
  generating?: boolean;
};

export function CharacterAvatar({
  character,
  size = 112,
  onGenerate,
  generating = false,
}: CharacterAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fallbackUrl = dicebearAvatarUrl(character.id);
  const portraitUrl =
    character.portrait_prompt && character.portrait_status === "ready"
      ? pollinationsPortraitUrl(character.portrait_prompt, character.id)
      : null;

  const src = imgError || !portraitUrl ? fallbackUrl : portraitUrl;
  const showGenerate = onGenerate && !character.portrait_prompt;

  return (
    <div className="group relative mx-auto" style={{ width: size, height: size }}>
      <div
        className={`absolute inset-0 rounded-full ring-2 ring-violet-500/40 ${
          !loaded && portraitUrl ? "animate-pulse bg-violet-500/10" : ""
        }`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Portrait of ${character.name}`}
        width={size}
        height={size}
        className="relative h-full w-full rounded-full object-cover ring-2 ring-violet-500/40"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setImgError(true);
          setLoaded(true);
        }}
      />
      {showGenerate && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-xs"
            disabled={generating}
            onClick={(e) => {
              e.stopPropagation();
              void onGenerate();
            }}
          >
            <Sparkles className="h-3 w-3" />
            {generating ? "..." : "Portrait"}
          </Button>
        </div>
      )}
    </div>
  );
}
