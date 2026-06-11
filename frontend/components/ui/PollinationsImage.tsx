"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type PollinationsImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function PollinationsImage({
  src,
  alt,
  className,
  fallbackClassName,
}: PollinationsImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-violet-900/40 via-slate-900 to-cyan-900/20",
          fallbackClassName,
          className
        )}
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
        className={cn("h-full w-full object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
