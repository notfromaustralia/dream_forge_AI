"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PollinationsImage } from "@/components/ui/PollinationsImage";
import { StoryCard } from "@/components/stories/StoryCard";
import { api } from "@/lib/api";
import { parseStoryContent } from "@/lib/story-parser";
import { pollinationsBannerUrl, storyBannerPrompt } from "@/lib/visual-prompts";

const ARC_COLORS: Record<string, string> = {
  main: "border-violet-500/40 text-violet-300 bg-violet-500/10",
  side: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
  scene: "border-amber-500/40 text-amber-300 bg-amber-500/10",
};

export default function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string; storyId: string }>;
}) {
  const { id, storyId } = React.use(params);
  const { data: story, isLoading } = useQuery({
    queryKey: ["story", id, storyId],
    queryFn: () => api.getStory(id, storyId),
  });

  if (isLoading || !story) {
    return <div className="animate-pulse h-96 rounded-2xl bg-white/5" />;
  }

  const parsed = parseStoryContent(story.title, story.synopsis, story.content_json);
  const bannerSrc = pollinationsBannerUrl(storyBannerPrompt(parsed), story.id);
  const arcLabel = story.arc_type === "side" ? "Side Quest" : story.arc_type === "scene" ? "Scene" : "Main Arc";

  return (
    <div className="space-y-6">
      <Link href={`/universe/${id}/stories`} className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All Stories
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <PollinationsImage src={bannerSrc} alt={story.title} className="h-56 md:h-80" fallbackClassName="h-56 md:h-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <Badge variant="outline" className={`mb-3 ${ARC_COLORS[story.arc_type] ?? ARC_COLORS.main}`}>
            {arcLabel}
          </Badge>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-white">
            {story.title}
          </h1>
          {story.synopsis && (
            <p className="mt-2 max-w-2xl text-white/70">{story.synopsis}</p>
          )}
        </div>
      </div>

      <StoryCard story={story} expanded hideBanner />
    </div>
  );
}
