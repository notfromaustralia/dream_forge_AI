"use client";

import { motion } from "framer-motion";
import { BookOpen, Clock, Globe, Mountain, Shield, Sparkles, Users } from "lucide-react";

const NODES = [
  { id: "core", label: "World Core", icon: Sparkles, x: 50, y: 50, color: "text-violet-300", glow: "shadow-violet-500/50" },
  { id: "geo", label: "Geography", icon: Mountain, x: 22, y: 28, color: "text-emerald-300", glow: "shadow-emerald-500/40" },
  { id: "fac", label: "Factions", icon: Shield, x: 78, y: 25, color: "text-red-300", glow: "shadow-red-500/40" },
  { id: "char", label: "Characters", icon: Users, x: 82, y: 58, color: "text-fuchsia-300", glow: "shadow-fuchsia-500/40" },
  { id: "time", label: "Timelines", icon: Clock, x: 18, y: 62, color: "text-cyan-300", glow: "shadow-cyan-500/40" },
  { id: "story", label: "Stories", icon: BookOpen, x: 50, y: 82, color: "text-blue-300", glow: "shadow-blue-500/40" },
  { id: "hist", label: "History", icon: Globe, x: 50, y: 18, color: "text-amber-300", glow: "shadow-amber-500/40" },
] as const;

const EDGES: [string, string][] = [
  ["core", "geo"],
  ["core", "fac"],
  ["core", "char"],
  ["core", "time"],
  ["core", "story"],
  ["core", "hist"],
  ["geo", "time"],
  ["fac", "char"],
  ["story", "hist"],
];

export function KnowledgeGraph() {
  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <div className="relative aspect-square w-full max-w-md mx-auto">
      <div className="absolute inset-0 rounded-full border border-violet-500/10 landing-pulse-ring" />
      <div className="absolute inset-4 rounded-full border border-cyan-500/10 landing-orbit-slow" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        {EDGES.map(([a, b], i) => {
          const na = nodeMap[a];
          const nb = nodeMap[b];
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke="url(#edgeGrad)"
              strokeWidth="0.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
            />
          );
        })}
        <defs>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {NODES.map((node, i) => {
        const Icon = node.icon;
        const isCore = node.id === "core";
        return (
          <motion.div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
          >
            <div
              className={`flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 backdrop-blur-md shadow-lg ${node.glow} ${
                isCore ? "scale-110 border-violet-500/40" : ""
              }`}
            >
              <Icon className={`h-4 w-4 ${node.color}`} />
              <span className="whitespace-nowrap text-[9px] font-medium text-white/70">{node.label}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
