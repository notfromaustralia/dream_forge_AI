"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { PollinationsImage } from "@/components/ui/PollinationsImage";
import { api, type TimelineEntry, type TimelineState } from "@/lib/api";
import { eraScenePrompt, pollinationsBannerUrl } from "@/lib/visual-prompts";

export function TimeMachine({ universeId, genre = "fantasy" }: { universeId: string; genre?: string }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [era, setEra] = useState<number | null>(null);
  const [state, setState] = useState<TimelineState | null>(null);
  const [prevState, setPrevState] = useState<TimelineState | null>(null);

  useEffect(() => {
    api.getTimeline(universeId).then((e) => {
      setEntries(e);
      if (e.length) setEra(e[Math.floor(e.length / 2)].era_year);
    }).catch(console.error);
  }, [universeId]);

  useEffect(() => {
    api.getTimelineState(universeId, era).then((s) => {
      setPrevState(state);
      setState(s);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universeId, era]);

  const minYear = entries.length ? Math.min(...entries.map((e) => e.era_year)) : 0;
  const maxYear = entries.length ? Math.max(...entries.map((e) => e.era_year)) : 1000;
  const eraLabel = entries.find((e) => e.era_year === era)?.label ?? "Unknown Era";

  const backdropSrc = useMemo(() => {
    const events = state?.events.map((e) => ({ title: e.title, description: e.description })) ?? [];
    return pollinationsBannerUrl(eraScenePrompt(era, eraLabel, events, genre), `era-${universeId}-${era}`);
  }, [era, eraLabel, genre, state?.events, universeId]);

  const newEventIds = useMemo(() => {
    if (!state || !prevState) return new Set<string>();
    const prev = new Set(prevState.events.map((e) => e.id));
    return new Set(state.events.filter((e) => !prev.has(e.id)).map((e) => e.id));
  }, [state, prevState]);

  return (
    <div className="space-y-6">
      <div className="time-machine-panel relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 opacity-30">
          <PollinationsImage src={backdropSrc} alt="" className="h-full min-h-[320px]" fallbackClassName="h-full min-h-[320px]" />
        </div>
        <div className="time-machine-scanlines absolute inset-0 pointer-events-none" />

        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              <Clock className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400/80">Temporal Displacement Unit</p>
              <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-white">Time Machine</h2>
            </div>
          </div>

          <div className="mb-8 text-center">
            <motion.div
              key={era}
              initial={{ scale: 0.9, opacity: 0, filter: "blur(8px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              className="inline-block"
            >
              <p className="font-mono text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                {era}
              </p>
              <p className="mt-2 font-mono text-sm text-fuchsia-300/80 tracking-widest uppercase">{eraLabel}</p>
            </motion.div>
          </div>

          <div className="space-y-4 px-2">
            <div className="flex justify-between font-mono text-[10px] text-cyan-500/60">
              <span>{minYear}</span>
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> FLUX CAPACITOR</span>
              <span>{maxYear}</span>
            </div>
            <Slider
              value={[era]}
              min={minYear}
              max={maxYear}
              step={1}
              onValueChange={([v]) => setEra(v)}
              className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-cyan-300 [&_[role=slider]]:bg-slate-950 [&_[role=slider]]:shadow-[0_0_12px_rgba(34,211,238,0.8)]"
            />
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {entries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEra(e.era_year)}
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] transition-all ${
                    era === e.era_year
                      ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200 shadow-[0_0_10px_rgba(232,121,249,0.4)]"
                      : "border-white/10 text-white/40 hover:border-cyan-500/40 hover:text-cyan-300"
                  }`}
                >
                  {e.era_year} · {e.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={era}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
          transition={{ duration: 0.35 }}
          className="grid gap-4 md:grid-cols-2"
        >
          <EntityPanel
            title="Characters"
            accent="violet"
            items={state?.characters.map((c) => ({
              id: c.id,
              name: c.name,
              detail: c.bio,
            })) ?? []}
          />
          <EntityPanel
            title="Factions"
            accent="amber"
            items={state?.factions.map((f) => ({
              id: f.id,
              name: f.name,
              detail: `${f.power}${f.ideology ? ` — ${f.ideology}` : ""}`,
            })) ?? []}
          />
          <EntityPanel
            title="Locations"
            accent="emerald"
            items={state?.locations.map((l) => ({
              id: l.id,
              name: l.name,
              detail: "",
            })) ?? []}
          />
          <EntityPanel
            title="Events"
            accent="cyan"
            items={state?.events.map((e) => ({
              id: e.id,
              name: e.title,
              detail: e.description ?? `Year ${e.year}`,
              isNew: newEventIds.has(e.id),
            })) ?? []}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EntityPanel({
  title,
  accent,
  items,
}: {
  title: string;
  accent: string;
  items: { id: string; name: string; detail: string; isNew?: boolean }[];
}) {
  const borderColor = {
    violet: "border-violet-500/30",
    amber: "border-amber-500/30",
    emerald: "border-emerald-500/30",
    cyan: "border-cyan-500/30",
  }[accent] ?? "border-white/10";

  return (
    <div className={`rounded-xl border ${borderColor} bg-slate-950/60 p-4 backdrop-blur-sm`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-wider text-white/50">{title}</h3>
        <span className="font-mono text-2xl font-bold text-white">{items.length}</span>
      </div>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {items.slice(0, 8).map((item) => (
          <li key={item.id} className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">{item.name}</p>
              {item.isNew && (
                <Badge className="h-4 text-[9px] bg-fuchsia-500/30 text-fuchsia-200 border-0">NEW</Badge>
              )}
            </div>
            {item.detail && <p className="mt-0.5 line-clamp-2 text-xs text-white/45">{item.detail}</p>}
          </li>
        ))}
        {items.length > 8 && <li className="text-xs text-white/30">+{items.length - 8} more</li>}
        {items.length === 0 && <li className="text-xs text-white/30">None in this era</li>}
      </ul>
    </div>
  );
}
