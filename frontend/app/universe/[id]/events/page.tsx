"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorldEmptyState } from "@/components/universe/WorldEmptyState";
import { api } from "@/lib/api";

export default function EventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: events, isLoading } = useQuery({
    queryKey: ["events", id],
    queryFn: () => api.getEvents(id),
  });

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  const sorted = [...(events ?? [])].sort((a, b) => a.era_year - b.era_year);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-cinzel)] text-2xl font-bold text-white">
            <Calendar className="h-6 w-6 text-blue-400" /> Historical Events
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Pivotal moments in your world&apos;s history — wars, discoveries, catastrophes, and turning points.
          </p>
        </div>
        <Link href={`/universe/${id}/timeline`}>
          <Button variant="outline" size="sm" className="gap-2 border-cyan-500/30 text-cyan-300">
            <Clock className="h-4 w-4" /> View in Time Machine
          </Button>
        </Link>
      </div>

      {!sorted.length ? (
        <WorldEmptyState
          universeId={id}
          icon={Calendar}
          title="No historical events yet"
          description='Use "Add Timeline" in Forge More on the Overview page to create eras and historical events.'
          accentClass="text-blue-400"
          borderClass="border-blue-500/20"
          bgClass="bg-blue-500/5"
        />
      ) : (
        <div className="relative space-y-4 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-blue-500/50 before:via-violet-500/30 before:to-transparent">
          {sorted.map((evt) => (
            <Card key={evt.id} className="relative border-white/10 bg-white/[0.02]">
              <div className="absolute -left-6 top-6 h-3 w-3 rounded-full border-2 border-blue-400 bg-slate-950" />
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{evt.title}</CardTitle>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-300 shrink-0">
                    Year {evt.era_year}
                  </Badge>
                </div>
                <CardDescription>{evt.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/50">
                  {evt.event_type} · {evt.impact} impact
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
