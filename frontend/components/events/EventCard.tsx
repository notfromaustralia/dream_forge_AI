"use client";

import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EntityBanner } from "@/components/ui/EntityBanner";
import type { Event } from "@/lib/api";
import type { UniverseVisualContext } from "@/lib/visual-prompts";

export function EventCard({
  event,
  visualContext,
}: {
  event: Event;
  visualContext: UniverseVisualContext;
}) {
  return (
    <Card className="relative overflow-hidden border-white/10 bg-white/[0.02]">
      <div className="relative h-32">
        <EntityBanner
          seed={event.id}
          variant="event"
          title={event.title}
          subtitle={`Year ${event.era_year}`}
          genre={visualContext.genre}
          style={visualContext.style}
          className="h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
        <Badge
          variant="outline"
          className="absolute right-3 top-3 border-blue-500/30 bg-slate-950/80 text-blue-300"
        >
          Year {event.era_year}
        </Badge>
      </div>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
          {event.title}
        </CardTitle>
        <CardDescription>{event.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-white/50">
          {event.event_type} · {event.impact} impact
        </p>
      </CardContent>
    </Card>
  );
}
