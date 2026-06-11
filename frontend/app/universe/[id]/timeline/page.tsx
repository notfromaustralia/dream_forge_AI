"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TimeMachine } from "@/components/timeline/TimeMachine";
import { api } from "@/lib/api";
import { toVisualContext } from "@/lib/visual-prompts";

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: universe } = useQuery({ queryKey: ["universe", id], queryFn: () => api.getUniverse(id) });

  return (
    <TimeMachine
      universeId={id}
      visualContext={universe ? toVisualContext(universe) : undefined}
    />
  );
}
