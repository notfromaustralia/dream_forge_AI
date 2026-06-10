"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { WorkspaceNav } from "@/components/universe/WorkspaceNav";
import { api } from "@/lib/api";

export default function UniverseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const { data: universe } = useQuery({
    queryKey: ["universe", resolvedParams.id],
    queryFn: () => api.getUniverse(resolvedParams.id),
  });

  return (
    <div className="aurora-bg min-h-screen">
      <Navbar />
      <div className="flex pt-16 min-h-screen">
        <WorkspaceNav universeId={resolvedParams.id} />
        <main className="flex-1 p-8">
          {universe && (
            <div className="mb-6">
              <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-white">
                {universe.name}
              </h1>
              <p className="text-sm text-white/50">{universe.genre} · {universe.style}</p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
