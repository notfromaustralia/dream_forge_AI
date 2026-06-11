"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Brain,
  Clock,
  GitBranch,
  Network,
  Search,
  Sparkles,
  Swords,
  Wand2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Wand2,
    title: "Universe Generation",
    desc: "One prompt spawns lore, factions, magic systems, timeline events, and characters — all consistency-checked by AI agents.",
    accent: "from-violet-600/20 to-violet-900/10",
    border: "border-violet-500/20",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    desc: "Every character, faction, and event lives in an interconnected intelligence network you can explore visually.",
    accent: "from-cyan-600/20 to-cyan-900/10",
    border: "border-cyan-500/20",
  },
  {
    icon: Clock,
    title: "Time Machine",
    desc: "Scrub through eras — watch factions rise, characters age, and history unfold with a futuristic temporal interface.",
    accent: "from-fuchsia-600/20 to-fuchsia-900/10",
    border: "border-fuchsia-500/20",
  },
  {
    icon: Brain,
    title: "AI World Council",
    desc: "Multiple AI agents debate story decisions with visible reasoning — like a writers' room that never sleeps.",
    accent: "from-amber-600/20 to-amber-900/10",
    border: "border-amber-500/20",
  },
  {
    icon: Swords,
    title: "Context-Aware Quests",
    desc: "Generate side quests that reference your actual factions, locations, and lore — not generic templates.",
    accent: "from-red-600/20 to-red-900/10",
    border: "border-red-500/20",
  },
  {
    icon: GitBranch,
    title: "Lore Consistency",
    desc: "Automatic validation catches timeline conflicts, contradictions, and broken continuity before they spread.",
    accent: "from-emerald-600/20 to-emerald-900/10",
    border: "border-emerald-500/20",
  },
  {
    icon: Search,
    title: "Semantic Lore Search",
    desc: "Query your universe in natural language — find characters, events, and factions by meaning, not just keywords.",
    accent: "from-blue-600/20 to-blue-900/10",
    border: "border-blue-500/20",
  },
  {
    icon: Sparkles,
    title: "VS Code + Copilot",
    desc: "Extend worlds from your editor via MCP — generate quests, characters, dialogue, and search lore without leaving code.",
    accent: "from-violet-600/20 to-cyan-900/10",
    border: "border-violet-500/20",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0 landing-grid-bg opacity-20" />
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80 mb-3">Capabilities</p>
          <h2 className="font-[family-name:var(--font-cinzel)] text-4xl font-bold text-white md:text-5xl">
            Everything a universe needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/50">
            Built for game masters, novelists, and worldbuilders who want depth without the spreadsheet grind.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`group rounded-2xl border ${f.border} bg-gradient-to-br ${f.accent} p-6 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <f.icon className="mb-4 h-8 w-8 text-white/80 group-hover:text-white transition-colors" />
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ShowcaseSection() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-violet-400 mb-3">For Writers</p>
            <h2 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-white mb-4">
              Your story bible, alive and searchable
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Stop juggling Notion pages and wiki tabs. DreamForge keeps every character motivation,
              faction ideology, and timeline event in one interconnected system — expand lore with a prompt,
              forge side quests that actually fit, and let AI agents debate your plot twists.
            </p>
            <ul className="space-y-3 text-sm text-white/50">
              {["Expand lore & timeline with natural language", "Generate quests tied to your factions", "Council debates for narrative decisions"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10"
          >
            <Image
              src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80"
              alt="Writer crafting a story"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 glass rounded-xl p-4">
              <p className="text-sm italic text-white/80">
                &ldquo;Add a secret society that opposes the ruling council...&rdquo;
              </p>
              <p className="mt-2 text-xs text-emerald-400">+ 2 factions, 3 events, 1 timeline era added</p>
            </div>
          </motion.div>
        </div>

        <div className="mt-24 grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 lg:order-1"
          >
            <Image
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"
              alt="Gaming setup"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 glass rounded-xl p-4">
              <p className="font-mono text-xs text-cyan-400 mb-1">ERA 847 · The Sundering</p>
              <p className="text-sm text-white/80">3 factions active · 12 characters · 7 events</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:order-2"
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400 mb-3">For Gamers</p>
            <h2 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-white mb-4">
              Campaign worlds that feel real
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Build RPG settings with political depth, temporal history, and context-aware side quests.
              Scrub the Time Machine to see who existed in any era. Generate quests involving your actual
              factions — not recycled demo content.
            </p>
            <ul className="space-y-3 text-sm text-white/50">
              {["Faction power blocs with ideology & territory", "Futuristic timeline scrubber", "Pollinations-generated character portraits"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
