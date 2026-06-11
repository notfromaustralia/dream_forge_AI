"use client";

import { motion } from "framer-motion";

const STATS = [
  { value: "5", label: "Demo universes" },
  { value: "50+", label: "Characters" },
  { value: "20+", label: "Factions" },
  { value: "100+", label: "Timeline events" },
];

export function StatsSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-[family-name:var(--font-cinzel)] text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-white/40">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
