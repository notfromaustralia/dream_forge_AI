"use client";

import { Building2, Castle, MapPin, Mountain, Trees, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EntityBanner } from "@/components/ui/EntityBanner";
import type { Location } from "@/lib/api";
import type { UniverseVisualContext } from "@/lib/visual-prompts";

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("city") || t.includes("town")) return Building2;
  if (t.includes("castle") || t.includes("fort")) return Castle;
  if (t.includes("forest") || t.includes("wood")) return Trees;
  if (t.includes("mountain") || t.includes("peak")) return Mountain;
  if (t.includes("sea") || t.includes("coast") || t.includes("harbor")) return Waves;
  return MapPin;
}

function typeColor(type: string) {
  const t = type.toLowerCase();
  if (t.includes("city")) return "border-emerald-500/40 text-emerald-300 bg-emerald-500/10";
  if (t.includes("dungeon") || t.includes("ruin")) return "border-red-500/40 text-red-300 bg-red-500/10";
  if (t.includes("forest")) return "border-green-500/40 text-green-300 bg-green-500/10";
  return "border-cyan-500/40 text-cyan-300 bg-cyan-500/10";
}

export function LocationCard({
  location,
  visualContext,
}: {
  location: Location;
  visualContext: UniverseVisualContext;
}) {
  const Icon = typeIcon(location.location_type);

  return (
    <Card className="group overflow-hidden transition-all hover:border-emerald-500/30 hover:shadow-emerald-500/5 hover:shadow-lg">
      <div className="relative h-36">
        <EntityBanner
          seed={location.id}
          variant="location"
          title={location.name}
          subtitle={location.location_type}
          genre={visualContext.genre}
          style={visualContext.style}
          icon={Icon}
          className="h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-slate-950/80">
            <Icon className="h-4 w-4 text-emerald-400" />
          </div>
          <Badge variant="outline" className={`text-[10px] ${typeColor(location.location_type)}`}>
            {location.location_type}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="group-hover:text-emerald-200 transition-colors">{location.name}</CardTitle>
        <CardDescription className="line-clamp-3">{location.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="flex items-center gap-1 text-xs text-white/40">
          <MapPin className="h-3 w-3" />
          Era {location.era_start}
          {location.era_end != null ? `–${location.era_end}` : "+"}
        </p>
      </CardContent>
    </Card>
  );
}
