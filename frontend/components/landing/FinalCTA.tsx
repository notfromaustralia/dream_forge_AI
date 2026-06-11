"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1600&q=80"
          alt=""
          fill
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-3xl px-6 text-center"
      >
        <h2 className="font-[family-name:var(--font-cinzel)] text-4xl md:text-5xl font-bold text-white">
          Ready to forge your universe?
        </h2>
        <p className="mt-4 text-lg text-white/60">
          Join writers and game masters building interconnected worlds with AI.
          Start with a single prompt — the agents handle the rest.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/universe/new">
            <Button variant="aurora" size="lg" className="shadow-[0_0_40px_rgba(139,92,246,0.35)]">
              <Sparkles className="h-5 w-5" />
              Create Your Universe
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="border-white/20 bg-white/5">
              Explore Demo Worlds
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
