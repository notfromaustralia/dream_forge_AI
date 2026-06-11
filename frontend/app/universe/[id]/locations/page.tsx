"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, MapPin } from "lucide-react";
import { LocationCard } from "@/components/locations/LocationCard";
import { WorldEmptyState } from "@/components/universe/WorldEmptyState";
import { api } from "@/lib/api";
import { toVisualContext } from "@/lib/visual-prompts";

export default function LocationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: universe } = useQuery({ queryKey: ["universe", id], queryFn: () => api.getUniverse(id) });
  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations", id],
    queryFn: () => api.getLocations(id),
  });

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  const visualContext = universe ? toVisualContext(universe) : null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-cyan-950/30 p-6 md:p-8">
        <div className="absolute right-0 top-0 opacity-10">
          <Compass className="h-32 w-32 text-emerald-400" />
        </div>
        <div className="relative">
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-cinzel)] text-2xl font-bold text-white">
            <MapPin className="h-6 w-6 text-emerald-400" /> World Atlas
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Cities, wilderness, ruins, and realms — the places where your stories unfold.
            Locations connect to characters, events, and the Time Machine across eras.
          </p>
          {locations && locations.length > 0 && (
            <p className="mt-3 font-mono text-xs text-emerald-400/70">
              {locations.length} location{locations.length !== 1 ? "s" : ""} charted
            </p>
          )}
        </div>
      </div>

      {!locations?.length ? (
        <WorldEmptyState
          universeId={id}
          icon={MapPin}
          title="No locations charted yet"
          description='Use "Add Locations" in Forge More on the Overview page to populate cities, regions, and landmarks.'
          accentClass="text-emerald-400"
          borderClass="border-emerald-500/20"
          bgClass="bg-emerald-500/5"
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visualContext &&
            locations.map((loc) => (
              <LocationCard key={loc.id} location={loc} visualContext={visualContext} />
            ))}
        </div>
      )}
    </div>
  );
}
