"use client";

import React from "react";
import { CouncilDebate } from "@/components/council/CouncilDebate";

export default function CouncilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <CouncilDebate universeId={id} />;
}
