"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, GitBranch, Clock, Sparkles, Wand2, Network } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  { icon: Wand2, title: "Universe Generation", desc: "AI creates history, geography, factions, and magic systems from a single prompt." },
  { icon: Network, title: "Knowledge Graph", desc: "Visualize every character, faction, and event as an interconnected intelligence network." },
  { icon: Clock, title: "Time Machine", desc: "Drag the timeline — watch characters age, wars begin, and politics evolve." },
  { icon: Brain, title: "AI World Council", desc: "Multiple AI agents debate story decisions with visible reasoning." },
  { icon: GitBranch, title: "Lore Consistency", desc: "Automatic validation of timeline conflicts and contradictions." },
  { icon: Sparkles, title: "Copilot Integration", desc: "Generate quests and dialogue from VS Code via MCP server." },
];

export default function LandingPage() {
  return (
    <div className="aurora-bg min-h-screen">
      <Navbar />
      <main className="pt-16">
        <section className="mx-auto max-w-7xl px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-violet-400">
              AI Universe Creation Platform
            </p>
            <h1 className="font-[family-name:var(--font-cinzel)] text-5xl font-bold leading-tight text-white md:text-7xl">
              Forge Worlds
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Beyond Imagination
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
              Notion for storytelling. Figma for worldbuilding. GitHub Copilot for creativity.
              Build living universes with AI-assisted workflows.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/universe/new">
                <Button variant="aurora" size="lg">
                  <Sparkles className="h-5 w-5" />
                  Create Your Universe
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">Explore Demo Worlds</Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Card className="h-full transition-all hover:border-violet-500/20">
                  <CardHeader>
                    <f.icon className="mb-2 h-8 w-8 text-violet-400" />
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/60">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 text-center">
          <Card className="border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-cyan-950/30 p-8">
            <h2 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold text-white">
              Ready to build your universe?
            </h2>
            <p className="mt-4 text-white/60">
              5 demo universes with 50 characters, 20 factions, and 100 events await.
            </p>
            <Link href="/dashboard" className="mt-6 inline-block">
              <Button variant="aurora" size="lg">Enter DreamForge</Button>
            </Link>
          </Card>
        </section>
      </main>
    </div>
  );
}
