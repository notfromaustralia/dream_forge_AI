"use client";

import { cn } from "@/lib/utils";
import { dicebearEmblemUrl } from "@/lib/entity-art";

export function DicebearEmblem({
  seed,
  alt,
  className,
  size = 64,
}: {
  seed: string;
  alt: string;
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dicebearEmblemUrl(seed, size)}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-xl object-cover ring-1 ring-white/10", className)}
      loading="lazy"
    />
  );
}
