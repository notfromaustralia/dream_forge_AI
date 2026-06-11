"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  MapPin,
  Network,
  Scroll,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import type { Universe } from "@/lib/api";

const TILES = [
  { key: "characters", label: "Characters", icon: Users, href: "characters" },
  { key: "factions", label: "Factions", icon: Swords, href: "factions" },
  { key: "locations", label: "Locations", icon: MapPin, href: "locations" },
  { key: "events", label: "Events", icon: Scroll, href: "events" },
  { key: "stories", label: "Stories", icon: BookOpen, href: "stories" },
  { key: "religions", label: "Faiths", icon: Sparkles, href: "overview#forge-more" },
  { key: "magic_systems", label: "Magic", icon: Sparkles, href: "overview#forge-more" },
  { key: "graph_edges", label: "Relations", icon: Network, href: "graph" },
] as const;

export function EntityAtlas({ universeId, counts }: { universeId: string; counts?: Universe["entity_counts"] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold text-white">World Atlas</h3>
        <Link href={`/universe/${universeId}/timeline`} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
          <Clock className="h-3.5 w-3.5" /> Time Machine
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TILES.map((tile, i) => {
          const count = counts?.[tile.key as keyof NonNullable<typeof counts>] ?? 0;
          const Icon = tile.icon;
          return (
            <motion.div
              key={tile.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/universe/${universeId}/${tile.href}`}
                className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-violet-500/30 hover:bg-violet-500/5"
              >
                <Icon className="h-5 w-5 text-violet-400 group-hover:text-violet-300" />
                <span className="text-2xl font-bold text-white">{count}</span>
                <span className="text-xs text-white/50">{tile.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
