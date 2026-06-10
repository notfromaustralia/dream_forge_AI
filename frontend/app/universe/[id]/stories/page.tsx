"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryCard } from "@/components/stories/StoryCard";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function StoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [generating, setGenerating] = useState(false);
  const { data: stories, isLoading, refetch } = useQuery({
    queryKey: ["stories", id],
    queryFn: () => api.getStories(id),
  });

  const handleGenerateQuest = async () => {
    setGenerating(true);
    try {
      const result = await api.generateQuest(id, "Create a side quest involving the Shadow Guild") as { data?: { title?: string }; title?: string };
      toast.success(`Quest generated: ${result.title ?? result.data?.title ?? "New Quest"}`);
      refetch();
    } catch {
      toast.error("Failed to generate quest");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  return (
    <div className="space-y-6">
      <Button variant="aurora" onClick={handleGenerateQuest} disabled={generating} className="gap-2">
        <Sparkles className="h-4 w-4" />
        {generating ? "Generating..." : "Generate Side Quest"}
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {stories?.map((story, i) => (
          <StoryCard key={story.id} story={story} index={i} />
        ))}
      </div>
    </div>
  );
}
