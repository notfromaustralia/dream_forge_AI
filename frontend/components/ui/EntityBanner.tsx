"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  Clock,
  Globe,
  MapPin,
  Scroll,
  Sparkles,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  bannerGradientStyle,
  genrePalette,
  type EntityBannerVariant,
} from "@/lib/entity-art";

const VARIANT_ICONS: Record<EntityBannerVariant, LucideIcon> = {
  universe: Globe,
  location: MapPin,
  faction: Swords,
  story: BookOpen,
  event: Calendar,
  era: Clock,
  character: Sparkles,
};

type EntityBannerProps = {
  seed: string;
  variant?: EntityBannerVariant;
  title?: string;
  subtitle?: string;
  genre?: string;
  style?: string;
  icon?: LucideIcon;
  className?: string;
  compact?: boolean;
};

export function EntityBanner({
  seed,
  variant = "universe",
  title,
  subtitle,
  genre = "fantasy",
  style = "",
  icon,
  className,
  compact = false,
}: EntityBannerProps) {
  const Icon = icon ?? VARIANT_ICONS[variant];
  const palette = genrePalette(genre, style);
  const displayTitle = title?.trim() || "";
  const watermark = displayTitle.length > 24 ? `${displayTitle.slice(0, 22)}…` : displayTitle;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={bannerGradientStyle(seed, genre, style)}
      aria-hidden={!title}
    >
      {/* mesh noise */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {watermark && !compact && (
        <p
          className="pointer-events-none absolute -right-2 top-1/2 max-w-[70%] -translate-y-1/2 select-none truncate font-[family-name:var(--font-cinzel)] text-4xl font-bold uppercase tracking-wider opacity-[0.06] md:text-5xl"
          style={{ color: palette.accent }}
        >
          {watermark}
        </p>
      )}

      <div
        className={cn(
          "absolute rounded-full opacity-40 blur-3xl",
          compact ? "h-16 w-16 -right-4 -top-4" : "h-32 w-32 -right-8 -top-8"
        )}
        style={{ background: palette.glow }}
      />

      <div
        className={cn(
          "relative flex h-full items-end gap-3",
          compact ? "p-2" : "p-4 md:p-6"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/50 backdrop-blur-sm",
            compact ? "h-8 w-8" : "h-10 w-10 md:h-12 md:w-12"
          )}
          style={{ boxShadow: `0 0 20px ${palette.accent}33` }}
        >
          <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5 md:h-6 md:w-6")} style={{ color: palette.accent }} />
        </div>

        {(title || subtitle) && !compact && (
          <div className="min-w-0 pb-0.5">
            {subtitle && (
              <p className="text-[10px] uppercase tracking-widest text-white/40 md:text-xs">{subtitle}</p>
            )}
            {title && (
              <p className="truncate font-medium text-white/90 text-sm md:text-base">{title}</p>
            )}
          </div>
        )}

        {variant === "era" && subtitle && compact && (
          <span className="absolute bottom-1 left-1 right-1 text-center font-mono text-[9px] text-cyan-300/80">
            {subtitle}
          </span>
        )}
      </div>

      {variant === "story" && (
        <Scroll className="pointer-events-none absolute right-4 top-4 h-8 w-8 text-white/5" />
      )}
    </div>
  );
}
