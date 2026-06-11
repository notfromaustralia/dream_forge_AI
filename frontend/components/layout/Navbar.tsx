"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar({ landing = false }: { landing?: boolean }) {
  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all",
        landing
          ? "border-b border-white/5 bg-slate-950/40 backdrop-blur-xl"
          : "border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <Sparkles className="h-6 w-6 text-violet-400 group-hover:text-violet-300 transition-colors" />
          <span className="font-[family-name:var(--font-cinzel)] text-xl font-bold tracking-wide text-white">
            DREAMFORGE
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
              Dashboard
            </Button>
          </Link>
          <Link href="/universe/new">
            <Button variant="aurora" size="sm">
              Create Universe
            </Button>
          </Link>
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
