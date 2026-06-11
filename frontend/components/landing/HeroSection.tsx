"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Clock, Code2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { TimelineDemo } from "./TimelineDemo";
import { CouncilDemo } from "./CouncilDemo";
import { CopilotDemo } from "./CopilotDemo";

const QUICK_FEATURES = [
  { icon: Clock, label: "Scrub Through Time", desc: "Era by era" },
  { icon: Search, label: "Search Lore", desc: "Semantic recall" },
  { icon: Brain, label: "AI Council", desc: "Agent debates" },
  { icon: Code2, label: "Extend in VS Code", desc: "MCP tools" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1516331138075-f3adc1e149cd?q=80&w=1508&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
        <div className="landing-hero-glow absolute inset-0" />
        <div className="landing-grid-bg absolute inset-0 opacity-40" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-32 lg:grid-cols-2 lg:items-center lg:gap-8 lg:pt-36">
        {/* Left — Copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-violet-400">
            AI Universe Creation Platform
          </p>

          <h1 className="font-[family-name:var(--font-cinzel)] text-5xl font-bold leading-[1.1] text-white md:text-6xl xl:text-7xl landing-text-glow">
            Forge Worlds
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
              Beyond Imagination
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
            Describe a world — genre, style, audience — and watch AI agents forge its history,
            geography, factions, characters, and stories. Every entity connected in a living knowledge graph.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
            {QUICK_FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
              >
                <f.icon className="h-4 w-4 shrink-0 text-violet-400" />
                <div>
                  <p className="text-xs font-medium text-white">{f.label}</p>
                  <p className="text-[10px] text-white/40">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/universe/new">
              <Button variant="aurora" size="lg" className="shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                <Sparkles className="h-5 w-5" />
                Create Your Universe
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="border-white/20 bg-white/5 backdrop-blur-sm">
                Explore Demo Worlds
              </Button>
            </Link>
          </div>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.4em] text-violet-400/50">
            One prompt · Infinite worlds
          </p>
        </motion.div>

        {/* Right — Interactive showcase */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="landing-float">
            <KnowledgeGraph />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TimelineDemo />
            <div className="space-y-4">
              <CouncilDemo />
              <CopilotDemo />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
