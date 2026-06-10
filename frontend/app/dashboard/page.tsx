"use client";

import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { UniverseCard } from "@/components/universe/UniverseCard";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["universes"],
    queryFn: () => api.listUniverses(),
  });

  return (
    <div className="aurora-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold text-white">
            Your Universes
          </h1>
          <p className="mt-2 text-white/60">
            {data?.total ?? 0} worlds in your creative multiverse
          </p>
        </div>

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            Could not load universes. Make sure the backend is running on port 8000.
          </div>
        )}

        {data && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.universes.map((u, i) => (
              <UniverseCard key={u.id} universe={u} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
