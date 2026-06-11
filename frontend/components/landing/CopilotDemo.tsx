"use client";

import { motion } from "framer-motion";
import { Code2, Sparkles } from "lucide-react";

export function CopilotDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="glass rounded-2xl overflow-hidden border-emerald-500/20"
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/80 px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="ml-2 font-mono text-[10px] text-white/40">world-lore.md — DreamForge MCP</span>
        <Code2 className="ml-auto h-4 w-4 text-emerald-400" />
      </div>

      <div className="p-4 font-mono text-[11px] leading-relaxed">
        <p className="text-white/30">{"// Generate a quest for the Shadow Isles"}</p>
        <p className="text-emerald-400">await generate_quest({"{"}</p>
        <p className="pl-4 text-cyan-300">prompt: <span className="text-amber-200">&quot;Rescue the lost oracle&quot;</span>,</p>
        <p className="pl-4 text-cyan-300">faction_name: <span className="text-amber-200">&quot;Tide Wardens&quot;</span></p>
        <p className="text-emerald-400">{"})"}</p>
      </div>

      <div className="mx-4 mb-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[10px] font-medium text-violet-300">GitHub Copilot</span>
        </div>
        <p className="text-xs text-white/60">
          Extend your world, write lore, generate quests, and more — right from VS Code.
        </p>
      </div>
    </motion.div>
  );
}
