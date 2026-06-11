"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function EventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: events, isLoading } = useQuery({
    queryKey: ["events", id],
    queryFn: () => api.getEvents(id),
  });

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  if (!events?.length) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-6 text-sm text-white/60">
          No events yet. Run <strong>Build World Lore</strong> on the Overview page to create historical events and timeline entries.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {events.map((evt) => (
        <Card key={evt.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle>{evt.title}</CardTitle>
              <Badge variant="secondary">Year {evt.era_year}</Badge>
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
  );
}
