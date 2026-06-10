"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Scroll,
  Skull,
  Sparkles,
  Swords,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Story } from "@/lib/api";
import { parseStoryContent, type ParsedStory } from "@/lib/story-parser";
import { dicebearAvatarUrl, pollinationsBannerUrl, storyBannerPrompt } from "@/lib/visual-prompts";

type StoryCardProps = {
  story: Story;
  index?: number;
};

function StoryBanner({ story, parsed }: { story: Story; parsed: ParsedStory }) {
  const [bannerError, setBannerError] = useState(false);
  const prompt = storyBannerPrompt(parsed);
  const bannerUrl = pollinationsBannerUrl(prompt, story.id);

  if (bannerError) {
    return (
      <div className="h-40 rounded-t-2xl bg-gradient-to-br from-violet-900/40 to-cyan-900/20" />
    );
  }

  return (
    <div className="relative h-40 overflow-hidden rounded-t-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerUrl}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setBannerError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
    </div>
  );
}

function QuestCardBody({ parsed, expanded }: { parsed: Extract<ParsedStory, { kind: "quest" }>; expanded: boolean }) {
  return (
    <div className="space-y-4">
      {parsed.description && (
        <p className="text-sm text-white/70">{parsed.description}</p>
      )}
      {parsed.questGiver && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-white/50">Quest giver:</span>
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
            {parsed.questGiver}
          </Badge>
        </div>
      )}
      {parsed.objectives.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
            <CheckCircle2 className="h-3.5 w-3.5" /> Objectives
          </h4>
          <ol className="space-y-2">
            {(expanded ? parsed.objectives : parsed.objectives.slice(0, 3)).map((obj, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-300">
                  {i + 1}
                </span>
                {obj}
              </li>
            ))}
          </ol>
        </div>
      )}
      {parsed.locations.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
            <MapPin className="h-3.5 w-3.5" /> Locations
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {parsed.locations.map((loc) => (
              <Badge key={loc} variant="secondary" className="shrink-0">
                {loc}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {parsed.rewards.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
            <Sparkles className="h-3.5 w-3.5" /> Rewards
          </h4>
          <div className="flex flex-wrap gap-2">
            {parsed.rewards.map((r) => (
              <Badge key={r} className="bg-amber-500/20 text-amber-200 hover:bg-amber-500/30">
                {r}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {expanded && parsed.enemies && parsed.enemies.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
            <Skull className="h-3.5 w-3.5" /> Enemies
          </h4>
          <div className="flex flex-wrap gap-2">
            {parsed.enemies.map((e) => (
              <Badge key={e.name} variant="outline" className="gap-1 border-red-500/30 text-red-200">
                <Swords className="h-3 w-3" />
                {e.name}
                {e.count ? ` ×${e.count}` : ""}
                {e.difficulty ? ` (${e.difficulty})` : ""}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NarrativeCardBody({ parsed, expanded }: { parsed: Extract<ParsedStory, { kind: "narrative" }>; expanded: boolean }) {
  const plotSteps = [
    { key: "introduction", label: "Introduction", text: parsed.plot.introduction },
    { key: "conflict", label: "Conflict", text: parsed.plot.conflict },
    { key: "climax", label: "Climax", text: parsed.plot.climax },
    { key: "resolution", label: "Resolution", text: parsed.plot.resolution },
  ].filter((s) => s.text);

  return (
    <div className="space-y-4">
      {(parsed.setting.world || parsed.setting.location) && (
        <p className="text-sm text-white/60">
          {[parsed.setting.world, parsed.setting.location, parsed.setting.era].filter(Boolean).join(" · ")}
        </p>
      )}
      {parsed.characters.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {parsed.characters.map((c) => (
            <div key={c.name} className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dicebearAvatarUrl(c.name)}
                alt=""
                className="h-8 w-8 rounded-full"
              />
              <div>
                <p className="text-xs font-medium">{c.name}</p>
                {c.role && <p className="text-[10px] text-white/40">{c.role}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {plotSteps.length > 0 && (
        <div className="space-y-3 border-l border-violet-500/30 pl-4">
          {(expanded ? plotSteps : plotSteps.slice(0, 2)).map((step) => (
            <div key={step.key}>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">{step.label}</p>
              <p className="mt-1 text-sm text-white/75">{step.text}</p>
            </div>
          ))}
        </div>
      )}
      {expanded && parsed.dialogue && parsed.dialogue.length > 0 && (
        <div className="space-y-2">
          {parsed.dialogue.map((d, i) => (
            <blockquote
              key={i}
              className="rounded-lg border-l-2 border-violet-500/50 bg-white/5 px-3 py-2"
            >
              <p className="text-xs font-medium text-violet-300">{d.character}</p>
              <p className="text-sm italic text-white/70">&ldquo;{d.line}&rdquo;</p>
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}

function PlainCardBody({ parsed }: { parsed: Extract<ParsedStory, { kind: "plain" }> }) {
  return <p className="text-sm text-white/70 whitespace-pre-wrap">{parsed.text}</p>;
}

export function StoryCard({ story, index = 0 }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const parsed = parseStoryContent(story.title, story.synopsis, story.content_json);
  const scrollAccent = story.arc_type === "side" ? "text-cyan-400" : "text-violet-400";
  const needsExpand =
    parsed.kind === "quest"
      ? (parsed.objectives.length > 3 || (parsed.enemies?.length ?? 0) > 0)
      : parsed.kind === "narrative"
        ? true
        : parsed.text.length > 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/5">
        <StoryBanner story={story} parsed={parsed} />
        <CardContent className="p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Scroll className={`mt-0.5 h-5 w-5 shrink-0 ${scrollAccent}`} />
              <div>
                <h3 className="text-lg font-semibold">{parsed.title}</h3>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="outline" className={story.arc_type === "side" ? "border-cyan-500/40 text-cyan-300" : ""}>
                {story.arc_type}
              </Badge>
              <Badge variant="secondary">{story.status}</Badge>
            </div>
          </div>

          {parsed.kind === "quest" && <QuestCardBody parsed={parsed} expanded={expanded} />}
          {parsed.kind === "narrative" && <NarrativeCardBody parsed={parsed} expanded={expanded} />}
          {parsed.kind === "plain" && <PlainCardBody parsed={parsed} />}

          {needsExpand && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-4 flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> Show more
                </>
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
