"use client";

import { motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

const MARKERS = [
  { label: "Dawn of Ages", year: 0, pos: 8 },
  { label: "Present", year: 847, pos: 52 },
  { label: "Future Echoes", year: 1200, pos: 92 },
];

export function TimelineDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass rounded-2xl p-5 border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
    >
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">Timeline</p>

      <div className="relative h-2 rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 w-[52%] rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
          style={{ left: "52%" }}
        />
        {MARKERS.map((m) => (
          <div
            key={m.label}
            className="absolute top-4 -translate-x-1/2 text-center"
            style={{ left: `${m.pos}%` }}
          >
            <span className={`block text-[9px] font-mono ${m.pos === 52 ? "text-cyan-300" : "text-white/40"}`}>
              {m.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button type="button" className="text-white/40 hover:text-white transition-colors" aria-label="Skip back">
          <SkipBack className="h-4 w-4" />
        </button>
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300" aria-label="Play">
          <Play className="h-4 w-4 ml-0.5" />
        </button>
        <button type="button" className="text-white/40 hover:text-white transition-colors" aria-label="Pause">
          <Pause className="h-4 w-4" />
        </button>
        <button type="button" className="text-white/40 hover:text-white transition-colors" aria-label="Skip forward">
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
