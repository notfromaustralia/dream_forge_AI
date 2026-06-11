import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <span className="font-[family-name:var(--font-cinzel)] text-lg font-bold text-white">DreamForge</span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/60">
            Build Deep · Stay Connected · Create Without Limits
          </p>

          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/universe/new" className="hover:text-white transition-colors">Create</Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/25">
          © {new Date().getFullYear()} DreamForge — AI Universe Creation Platform
        </p>
      </div>
    </footer>
  );
}
