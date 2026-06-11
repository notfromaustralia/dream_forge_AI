"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  MessageSquare,
  Scroll,
  Skull,
  Sparkles,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Story } from "@/lib/api";
import {
  parseStoryContent,
  type ParsedContent,
  type ParsedQuest,
  type ParsedStory,
  type ParsedDialogue,
  type ParsedPlain,
} from "@/lib/story-parser";
import { dicebearAvatarUrl, pollinationsBannerUrl, storyBannerPrompt } from "@/lib/visual-prompts";

type StoryCardProps = {
  story: Story;
  index?: number;
  expanded?: boolean;
  hideBanner?: boolean;
};

function Banner({ story, parsed }: { story: Story; parsed: ParsedContent }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return <div className="h-40 rounded-t-2xl bg-gradient-to-br from-violet-900/40 to-cyan-900/20" />;
  }
  return (
    <div className="relative h-40 overflow-hidden rounded-t-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pollinationsBannerUrl(storyBannerPrompt(parsed), story.id)}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setErrored(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
    </div>
  );
}

function Section({ icon: Icon, label, children }: { icon: typeof Sparkles; label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
        <Icon className="h-3.5 w-3.5" /> {label}
      </h4>
      {children}
    </div>
  );
}

function QuestBody({ parsed, expanded }: { parsed: ParsedQuest; expanded: boolean }) {
  const objectivesShown = expanded ? parsed.objectives : parsed.objectives.slice(0, 3);
  return (
    <div className="space-y-4">
      {parsed.synopsis && <p className="text-sm text-white/70">{parsed.synopsis}</p>}

      {parsed.questGiver && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-white/50">Quest giver:</span>
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
            {parsed.questGiver}
          </Badge>
        </div>
      )}

      {objectivesShown.length > 0 && (
        <Section icon={CheckCircle2} label="Objectives">
          <ol className="space-y-2">
            {objectivesShown.map((obj, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-300">
                  {i + 1}
                </span>
                {obj}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {expanded && parsed.obstacles.length > 0 && (
        <Section icon={Skull} label="Obstacles">
          <div className="space-y-2">
            {parsed.obstacles.map((o) => (
              <div key={o.name} className="rounded-lg border border-red-500/20 bg-red-500/5 p-2">
                <p className="text-sm font-medium text-red-200">{o.name}</p>
                {o.description && <p className="mt-1 text-xs text-white/60">{o.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {parsed.locations.length > 0 && (
        <Section icon={MapPin} label="Locations">
          <div className="flex flex-wrap gap-2">
            {parsed.locations.map((loc) => (
              <Badge key={loc} variant="secondary">{loc}</Badge>
            ))}
          </div>
        </Section>
      )}

      {parsed.rewards.length > 0 && (
        <Section icon={Sparkles} label="Rewards">
          <div className="flex flex-wrap gap-2">
            {parsed.rewards.map((r) => (
              <Badge key={r} className="bg-amber-500/20 text-amber-200 hover:bg-amber-500/30">
                {r}
              </Badge>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function StoryBody({ parsed }: { parsed: ParsedStory }) {
  return (
    <div className="space-y-4">
      {parsed.synopsis && <p className="text-sm text-white/70">{parsed.synopsis}</p>}
      {parsed.setting && <p className="text-xs text-white/50 italic">{parsed.setting}</p>}

      {parsed.characters.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {parsed.characters.map((c) => (
            <div key={c.name} className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dicebearAvatarUrl(c.name)} alt="" className="h-8 w-8 rounded-full" />
              <div>
                <p className="text-xs font-medium">{c.name}</p>
                {c.role && <p className="text-[10px] text-white/40">{c.role}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {parsed.beats.length > 0 && (
        <div className="space-y-5 border-l border-violet-500/30 pl-4">
          {parsed.beats.map((b, i) => (
            <div key={i}>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">
                {b.label || `Beat ${i + 1}`}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {parsed.themes.length > 0 && (
        <Section icon={Sparkles} label="Themes">
          <div className="flex flex-wrap gap-2">
            {parsed.themes.map((t) => (
              <Badge key={t} variant="outline" className="border-violet-500/30 text-violet-200">
                {t}
              </Badge>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function DialogueBody({ parsed }: { parsed: ParsedDialogue }) {
  return (
    <div className="space-y-4">
      {parsed.synopsis && <p className="text-sm text-white/70">{parsed.synopsis}</p>}
      {parsed.setting && <p className="text-xs text-white/50 italic">{parsed.setting}</p>}

      {parsed.lines.length > 0 && (
        <Section icon={MessageSquare} label="Dialogue">
          <div className="space-y-2">
            {parsed.lines.map((d, i) => (
              <blockquote key={i} className="rounded-lg border-l-2 border-violet-500/50 bg-white/5 px-3 py-2">
                <p className="text-xs font-medium text-violet-300">{d.character}</p>
                <p className="text-sm italic text-white/70">&ldquo;{d.line}&rdquo;</p>
              </blockquote>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function PlainBody({ parsed }: { parsed: ParsedPlain }) {
  return <p className="text-sm text-white/70 whitespace-pre-wrap">{parsed.text}</p>;
}

export function StoryCard({ story, index = 0, expanded: expandedProp, hideBanner = false }: StoryCardProps) {
  const [expandedState, setExpandedState] = useState(false);
  const expanded = expandedProp ?? expandedState;
  const parsed = parseStoryContent(story.title, story.synopsis, story.content_json);

  const accent =
    story.arc_type === "side" ? "text-cyan-400" :
    story.arc_type === "scene" ? "text-pink-400" :
    "text-violet-400";

  const canExpand =
    (parsed.kind === "quest" && (parsed.objectives.length > 3 || parsed.obstacles.length > 0)) ||
    (parsed.kind === "plain" && parsed.text.length > 200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/5">
        {!hideBanner && <Banner story={story} parsed={parsed} />}
        <CardContent className="p-5">
          <div className={`mb-4 flex items-start justify-between gap-2 ${hideBanner ? "" : ""}`}>
            <div className="flex items-start gap-2">
              <Scroll className={`mt-0.5 h-5 w-5 shrink-0 ${accent}`} />
              {!hideBanner && <h3 className="text-lg font-semibold">{parsed.title}</h3>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="outline" className={story.arc_type === "side" ? "border-cyan-500/40 text-cyan-300" : ""}>
                {story.arc_type}
              </Badge>
              <Badge variant="secondary">{story.status}</Badge>
            </div>
          </div>

          {parsed.kind === "quest" && <QuestBody parsed={parsed} expanded={expanded} />}
          {parsed.kind === "story" && <StoryBody parsed={parsed} />}
          {parsed.kind === "dialogue" && <DialogueBody parsed={parsed} />}
          {parsed.kind === "plain" && <PlainBody parsed={parsed} />}

          {canExpand && expandedProp === undefined && (
            <button
              type="button"
              onClick={() => setExpandedState(!expandedState)}
              className="mt-4 flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
            >
              {expanded ? (
                <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" /> Show more</>
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
