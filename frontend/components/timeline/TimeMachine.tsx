"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type TimelineEntry, type TimelineState } from "@/lib/api";

export function TimeMachine({ universeId }: { universeId: string }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [era, setEra] = useState<number | null>(null);
  const [state, setState] = useState<TimelineState | null>(null);

  useEffect(() => {
    api.getTimeline(universeId).then((data) => {
      setEntries(data);
      if (data.length) {
        setEra(Math.max(...data.map((e) => e.era_year)));
      } else {
        setEra(2025);
      }
    }).catch(console.error);
  }, [universeId]);

  useEffect(() => {
    if (era === null) return;
    api.getTimelineState(universeId, era).then(setState).catch(console.error);
  }, [universeId, era]);

  const minYear = entries.length ? Math.min(...entries.map((e) => e.era_year)) : 0;
  const maxYear = entries.length ? Math.max(...entries.map((e) => e.era_year)) : 2025;
  const currentEra = era ?? maxYear;

  return (
    <div className="space-y-6">
      {entries.length === 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 text-sm text-white/60">
            No timeline entries yet. Run <strong>Build World Lore</strong> on the Overview page to create historical eras, factions, locations, and events.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            Time Machine — Year {currentEra}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={[currentEra]}
            min={minYear}
            max={maxYear}
            step={1}
            onValueChange={([v]) => setEra(v)}
          />
          <div className="flex flex-wrap justify-between gap-2 text-xs text-white/40">
            {entries.length ? (
              entries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEra(e.era_year)}
                  className={`transition-colors hover:text-white ${currentEra === e.era_year ? "text-violet-400" : ""}`}
                >
                  {e.label}
                </button>
              ))
            ) : (
              <span>No era markers — build world lore first</span>
            )}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentEra}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard title="Characters" count={state?.characters.length ?? 0} items={state?.characters.map((c) => c.name) ?? []} emptyHint="Generate characters on Overview" />
          <StatCard title="Factions" count={state?.factions.length ?? 0} items={state?.factions.map((f) => f.name) ?? []} emptyHint="Build world lore on Overview" />
          <StatCard title="Locations" count={state?.locations.length ?? 0} items={state?.locations.map((l) => l.name) ?? []} emptyHint="Build world lore on Overview" />
          <StatCard title="Events" count={state?.events.length ?? 0} items={state?.events.map((e) => e.title) ?? []} emptyHint="Build world lore on Overview" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  title,
  count,
  items,
  emptyHint,
}: {
  title: string;
  count: number;
  items: string[];
  emptyHint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/60">{title}</CardTitle>
        <p className="text-3xl font-bold text-white">{count}</p>
      </CardHeader>
      <CardContent>
        {count === 0 && emptyHint ? (
          <p className="text-xs text-white/40">{emptyHint}</p>
        ) : (
          <ul className="max-h-24 space-y-1 overflow-y-auto text-xs text-white/50">
            {items.slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {items.length > 5 && <li>+{items.length - 5} more</li>}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
