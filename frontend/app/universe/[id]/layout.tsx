"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { DeleteUniverseDialog } from "@/components/universe/DeleteUniverseDialog";
import { WorkspaceNav } from "@/components/universe/WorkspaceNav";
import { Button } from "@/components/ui/button";
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
    refetchInterval: (query) =>
      query.state.data?.status === "generating" ? 2000 : false,
  });

  const isGenerating = universe?.status === "generating";

  return (
    <div className="aurora-bg min-h-screen">
      <Navbar />
      {isGenerating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-400" />
            <p className="mt-4 font-[family-name:var(--font-cinzel)] text-xl text-white">Forging your universe...</p>
            <p className="mt-1 text-sm text-white/50">Agents are building lore, characters, and narrative</p>
          </div>
        </div>
      )}
      <div className="flex pt-16 min-h-screen">
        <WorkspaceNav universeId={resolvedParams.id} />
        <main className="flex-1 p-8">
          {universe && (
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-white">
                  {universe.name}
                </h1>
                <p className="text-sm text-white/50">{universe.genre} · {universe.style}</p>
              </div>
              <DeleteUniverseDialog
                universeId={resolvedParams.id}
                universeName={universe.name}
                trigger={
                  <Button variant="outline" size="icon" className="shrink-0 border-white/10">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
