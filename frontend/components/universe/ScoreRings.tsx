"use client";

import { motion } from "framer-motion";

interface Scores {
  consistency: number;
  creativity: number;
  completeness: number;
  wow_factor?: number;
  wow_score?: number;
}

const METRICS = [
  { key: "consistency" as const, label: "Consistency", color: "#8b5cf6" },
  { key: "creativity" as const, label: "Creativity", color: "#06b6d4" },
  { key: "completeness" as const, label: "Completeness", color: "#10b981" },
];

export function ScoreRings({ scores }: { scores: Scores }) {
  const wow = scores.wow_factor ?? scores.wow_score ?? 0;

  return (
    <div className="flex flex-wrap gap-6">
      {[...METRICS, { key: "wow" as const, label: "Wow Factor", color: "#f59e0b" }].map((metric, i) => {
        const value = metric.key === "wow" ? wow : scores[metric.key];
        const pct = Math.min(100, value);
        const circumference = 2 * Math.PI * 36;
        const offset = circumference - (pct / 100) * circumference;

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke={metric.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1, delay: i * 0.15 }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {Math.round(pct)}
              </span>
            </div>
            <span className="text-xs text-white/50">{metric.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
