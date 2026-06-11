"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorldEmptyState({
  universeId,
  icon: Icon,
  title,
  description,
  accentClass = "text-violet-400",
  borderClass = "border-violet-500/20",
  bgClass = "bg-violet-500/5",
}: {
  universeId: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accentClass?: string;
  borderClass?: string;
  bgClass?: string;
}) {
  return (
    <div className={`rounded-2xl border border-dashed ${borderClass} ${bgClass} p-12 text-center`}>
      <Icon className={`mx-auto h-12 w-12 ${accentClass} opacity-40`} />
      <p className="mt-4 font-medium text-white/70">{title}</p>
      <p className="mt-2 max-w-md mx-auto text-sm text-white/40">{description}</p>
      <Link href={`/universe/${universeId}/overview`} className="mt-6 inline-block">
        <Button variant="aurora" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Go to Overview — Forge More
        </Button>
      </Link>
    </div>
  );
}
