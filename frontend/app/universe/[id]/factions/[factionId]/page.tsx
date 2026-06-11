"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Swords, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityBanner } from "@/components/ui/EntityBanner";
import { CharacterCard } from "@/components/characters/CharacterCard";
import { api } from "@/lib/api";
import { toVisualContext } from "@/lib/visual-prompts";

export default function FactionDetailPage({
  params,
}: {
  params: Promise<{ id: string; factionId: string }>;
}) {
  const { id, factionId } = React.use(params);
  const { data: universe } = useQuery({ queryKey: ["universe", id], queryFn: () => api.getUniverse(id) });
  const { data: factions } = useQuery({ queryKey: ["factions", id], queryFn: () => api.getFactions(id) });
  const { data: characters } = useQuery({ queryKey: ["characters", id], queryFn: () => api.getCharacters(id) });
  const { data: events } = useQuery({ queryKey: ["events", id], queryFn: () => api.getEvents(id) });

  const faction = factions?.find((f) => f.id === factionId);
  const members = characters?.filter((c) => c.faction_id === factionId) ?? [];
  const rivals = factions?.filter((f) => f.id !== factionId) ?? [];
  const relatedEvents = events?.filter(
    (e) => faction && (e.description.includes(faction.name) || e.title.includes(faction.name))
  ) ?? [];

  if (!faction) {
    return <div className="animate-pulse h-96 rounded-2xl bg-white/5" />;
  }

  const visualContext = universe ? toVisualContext(universe) : null;

  return (
    <div className="space-y-6">
      <Link href={`/universe/${id}/factions`} className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All Factions
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        {visualContext && (
          <EntityBanner
            seed={faction.id}
            variant="faction"
            title={faction.name}
            subtitle={faction.power_level}
            genre={visualContext.genre}
            style={visualContext.style}
            className="h-48 md:h-64"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Swords className="h-5 w-5 text-amber-400" />
            <Badge variant="outline" className="border-amber-500/40 text-amber-300">{faction.power_level}</Badge>
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold text-white">{faction.name}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ideology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/75 leading-relaxed">{faction.ideology}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-400" /> Territory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">{faction.territory || "Territory unknown"}</p>
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Users className="h-4 w-4" /> Members ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className="text-sm text-white/40">No characters aligned with this faction yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {members.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    universeId={id}
                    visualContext={visualContext ?? undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {relatedEvents.length > 0 && (
            <div>
              <h3 className="mb-4 font-semibold text-white">Related Events</h3>
              <div className="space-y-3">
                {relatedEvents.map((evt) => (
                  <Card key={evt.id}>
                    <CardContent className="p-4">
                      <p className="font-medium text-white">{evt.title}</p>
                      <p className="text-xs text-white/40">Year {evt.era_year}</p>
                      <p className="mt-1 text-sm text-white/60">{evt.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-white/60">Other Factions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rivals.map((r) => (
                <Link
                  key={r.id}
                  href={`/universe/${id}/factions/${r.id}`}
                  className="block rounded-lg border border-white/10 p-3 text-sm transition-colors hover:border-amber-500/30 hover:bg-white/5"
                >
                  <p className="font-medium text-white">{r.name}</p>
                  <p className="text-xs text-white/40">{r.power_level}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
