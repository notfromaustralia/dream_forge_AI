"use client";

import React from "react";
import { UniverseGraph } from "@/components/graph/UniverseGraph";

export default function GraphPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <UniverseGraph universeId={id} />;
}
