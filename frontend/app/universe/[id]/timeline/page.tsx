"use client";

import React from "react";
import { TimeMachine } from "@/components/timeline/TimeMachine";

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <TimeMachine universeId={id} />;
}
