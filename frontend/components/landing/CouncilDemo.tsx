"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const COUNCIL = [
  { name: "Elder", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
  { name: "Seer", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
  { name: "Knight", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" },
  { name: "Shadow", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
];

export function CouncilDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75 }}
      className="glass rounded-2xl p-5 border-violet-500/20"
    >
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-violet-400/80">AI Council</p>

      <div className="flex -space-x-2 mb-4">
        {COUNCIL.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-slate-950"
          >
            <Image src={c.img} alt={c.name} fill className="object-cover" sizes="40px" />
          </motion.div>
        ))}
      </div>

      <p className="text-sm italic text-white/70 leading-relaxed">
        &ldquo;Should the Northern Alliance accept the dragon&apos;s pact?&rdquo;
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Argue For", "Argue Against", "Propose Alternative"].map((label) => (
          <button
            key={label}
            type="button"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/60 hover:border-violet-500/30 hover:text-violet-200 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
