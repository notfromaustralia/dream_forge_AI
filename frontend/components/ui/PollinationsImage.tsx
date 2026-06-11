"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type PollinationsImageVariant =
  | "universe"
  | "location"
  | "faction"
  | "story"
  | "event"
  | "era"
  | "character";

const VARIANT_GRADIENTS: Record<PollinationsImageVariant, string> = {
  universe: "bg-gradient-to-br from-violet-900/40 via-slate-900 to-cyan-900/20",
  location: "bg-gradient-to-br from-emerald-950/60 to-cyan-950/40",
  faction: "bg-gradient-to-br from-amber-950/50 via-slate-900 to-orange-950/30",
  story: "bg-gradient-to-br from-violet-900/40 to-cyan-900/20",
  event: "bg-gradient-to-br from-blue-950/50 via-slate-900 to-violet-950/30",
  era: "bg-gradient-to-br from-cyan-950/50 via-slate-900 to-violet-950/30",
  character: "bg-gradient-to-br from-violet-900/30 via-slate-900 to-fuchsia-900/20",
};

type PollinationsImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  variant?: PollinationsImageVariant;
};

export function PollinationsImage({
  src,
  alt,
  className,
  fallbackClassName,
  variant = "universe",
}: PollinationsImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={cn(VARIANT_GRADIENTS[variant], fallbackClassName, className)}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-violet-500/10" aria-hidden />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
