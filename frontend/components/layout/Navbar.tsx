"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-400" />
          <span className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-white">
            DreamForge
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
          <Link href="/universe/new">
            <Button variant="aurora" size="sm">Create Universe</Button>
          </Link>
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
