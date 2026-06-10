"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function FactionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: factions, isLoading } = useQuery({
    queryKey: ["factions", id],
    queryFn: () => api.getFactions(id),
  });

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-white/5" />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {factions?.map((fac) => (
        <Card key={fac.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>{fac.name}</CardTitle>
              <Badge variant="secondary">{fac.power_level}</Badge>
            </div>
            <CardDescription>{fac.ideology}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/50">Territory: {fac.territory}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
