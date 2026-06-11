"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, Sparkles, Wand2 } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Sparkles,
    title: "Describe your world",
    desc: "Enter a prompt. AI suggests genre, style, and audience tags tailored to your vision — or define your own.",
  },
  {
    step: "02",
    icon: Bot,
    title: "Agents forge the universe",
    desc: "Lore, characters, consistency checks, and narrative run in sequence — streamed live as your world takes shape.",
  },
  {
    step: "03",
    icon: Wand2,
    title: "Explore & expand",
    desc: "Navigate the graph, scrub timelines, generate quests, debate in council, and keep building with Forge More.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 border-y border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-cyan-950/20" />
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-violet-400/80 mb-3">Workflow</p>
          <h2 className="font-[family-name:var(--font-cinzel)] text-4xl font-bold text-white">
            From prompt to living universe
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-4 top-12 hidden h-6 w-6 text-white/10 md:block" />
              )}
              <div className="glass rounded-2xl p-8 h-full">
                <span className="font-mono text-4xl font-bold text-white/10">{s.step}</span>
                <s.icon className="mt-4 mb-4 h-8 w-8 text-violet-400" />
                <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
