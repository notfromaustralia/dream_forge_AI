"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toVisualContext, type UniverseVisualContext } from "@/lib/visual-prompts";

const FALLBACK: UniverseVisualContext = {
  name: "",
  genre: "fantasy",
  style: "cinematic",
  audience: "general",
  overview: "",
  prompt: "",
};

export function useUniverseVisualContext(universeId: string): {
  visualContext: UniverseVisualContext;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["universe", universeId],
    queryFn: () => api.getUniverse(universeId),
  });

  return {
    visualContext: data ? toVisualContext(data) : FALLBACK,
    isLoading,
  };
}
