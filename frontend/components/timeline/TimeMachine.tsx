"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type TimelineEntry, type TimelineState } from "@/lib/api";

export function TimeMachine({ universeId }: { universeId: string }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [era, setEra] = useState(1000);
  const [state, setState] = useState<TimelineState | null>(null);

  useEffect(() => {
    api.getTimeline(universeId).then(setEntries).catch(console.error);
  }, [universeId]);

  useEffect(() => {
    api.getTimelineState(universeId, era).then(setState).catch(console.error);
  }, [universeId, era]);

  const minYear = entries.length ? Math.min(...entries.map((e) => e.era_year)) : 0;
  const maxYear = entries.length ? Math.max(...entries.map((e) => e.era_year)) : 1000;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            Time Machine — Year {era}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={[era]}
            min={minYear}
            max={maxYear}
            step={10}
            onValueChange={([v]) => setEra(v)}
          />
          <div className="flex justify-between text-xs text-white/40">
            {entries.map((e) => (
              <button
                key={e.id}
                onClick={() => setEra(e.era_year)}
                className={`hover:text-white transition-colors ${era === e.era_year ? "text-violet-400" : ""}`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          key={era}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard title="Characters" count={state?.characters.length ?? 0} items={state?.characters.map((c) => c.name) ?? []} />
          <StatCard title="Factions" count={state?.factions.length ?? 0} items={state?.factions.map((f) => f.name) ?? []} />
          <StatCard title="Locations" count={state?.locations.length ?? 0} items={state?.locations.map((l) => l.name) ?? []} />
          <StatCard title="Events" count={state?.events.length ?? 0} items={state?.events.map((e) => e.title) ?? []} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, count, items }: { title: string; count: number; items: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/60">{title}</CardTitle>
        <p className="text-3xl font-bold text-white">{count}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-xs text-white/50 max-h-24 overflow-y-auto">
          {items.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
          {items.length > 5 && <li>+{items.length - 5} more</li>}
        </ul>
      </CardContent>
    </Card>
  );
}
