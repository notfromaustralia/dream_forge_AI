"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function LocationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations", id],
    queryFn: () => api.getLocations(id),
  });

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  if (!locations?.length) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-6 text-sm text-white/60">
          No locations yet. Run <strong>Build World Lore</strong> on the Overview page to populate the world.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {locations.map((loc) => (
        <Card key={loc.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>{loc.name}</CardTitle>
              <Badge variant="secondary">{loc.location_type}</Badge>
            </div>
            <CardDescription>{loc.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/50">Era: {loc.era_start}{loc.era_end ? `–${loc.era_end}` : "+"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
