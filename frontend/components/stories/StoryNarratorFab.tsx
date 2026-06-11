"use client";

import { useState } from "react";
import { Pause, Play, Settings2, Square, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { estimateNarrationMinutes } from "@/lib/story-narration";
import { useStoryNarrator } from "@/hooks/useStoryNarrator";

type StoryNarratorFabProps = {
  text: string;
  storyId: string;
};

function formatVoiceLabel(voice: SpeechSynthesisVoice): string {
  const lang = voice.lang.replace("_", "-");
  return `${voice.name} (${lang})`;
}

export function StoryNarratorFab({ text, storyId }: StoryNarratorFabProps) {
  const {
    state,
    supported,
    voices,
    selectedVoice,
    settings,
    setVoiceURI,
    setRate,
    setPitch,
    resetSettings,
    toggle,
    stop,
  } = useStoryNarrator(storyId);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasText = text.trim().length > 0;
  const disabled = !supported || !hasText;
  const isActive = state === "playing" || state === "paused";
  const minutes = hasText ? estimateNarrationMinutes(text) : 0;

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const voiceOptions = englishVoices.length ? englishVoices : voices;

  if (!supported) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {settingsOpen && !disabled && (
        <div className="w-72 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-white">Narrator voice</p>
            <button
              type="button"
              onClick={resetSettings}
              className="text-[11px] text-violet-400 hover:text-violet-300"
            >
              Reset
            </button>
          </div>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs text-white/50">Voice</span>
            <select
              value={settings.voiceURI ?? selectedVoice?.voiceURI ?? ""}
              onChange={(e) => setVoiceURI(e.target.value || null)}
              disabled={isActive}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
            >
              <option value="">Auto (best narrator)</option>
              {voiceOptions.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {formatVoiceLabel(v)}
                </option>
              ))}
            </select>
          </label>

          <label className="mb-3 block">
            <span className="mb-1 flex justify-between text-xs text-white/50">
              <span>Speed</span>
              <span>{settings.rate.toFixed(2)}×</span>
            </span>
            <input
              type="range"
              min={0.6}
              max={1.3}
              step={0.05}
              value={settings.rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              disabled={isActive}
              className="w-full accent-violet-500 disabled:opacity-50"
            />
          </label>

          <label className="block">
            <span className="mb-1 flex justify-between text-xs text-white/50">
              <span>Tone</span>
              <span>{settings.pitch.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0.7}
              max={1.2}
              step={0.05}
              value={settings.pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              disabled={isActive}
              className="w-full accent-violet-500 disabled:opacity-50"
            />
          </label>

          {isActive && (
            <p className="mt-2 text-[10px] text-white/40">Stop playback to change voice settings.</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {isActive && (
          <button
            type="button"
            onClick={stop}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/90 text-white/70 shadow-lg backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Stop narration"
            title="Stop"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        )}

        {!disabled && (
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all",
              settingsOpen
                ? "border-violet-500/50 bg-violet-500/20 text-violet-200"
                : "border-white/10 bg-slate-950/90 text-white/60 hover:bg-white/10 hover:text-white"
            )}
            aria-label="Narrator settings"
            title="Voice settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        )}

        <div className="group relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => toggle(text)}
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all",
              disabled
                ? "cursor-not-allowed border-white/5 bg-slate-900/60 text-white/30"
                : "border-violet-500/40 bg-slate-950/90 text-violet-300 hover:border-violet-400/60 hover:bg-violet-500/10 hover:text-violet-200",
              state === "playing" && "ring-2 ring-violet-500/50 ring-offset-2 ring-offset-slate-950"
            )}
            aria-label={state === "playing" ? "Pause narration" : "Play narration"}
            title={
              disabled
                ? "No narration available"
                : state === "playing"
                  ? "Pause"
                  : state === "paused"
                    ? "Resume"
                    : `Listen to story (~${minutes} min)`
            }
          >
            {state === "playing" ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 fill-current pl-0.5" />
            )}
            {state === "playing" && (
              <span className="absolute inset-0 animate-ping rounded-full border border-violet-400/30" />
            )}
          </button>

          {!disabled && !isActive && !settingsOpen && (
            <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/95 px-3 py-1.5 text-xs text-white/80 shadow-lg group-hover:block">
              <Volume2 className="mr-1.5 inline h-3.5 w-3.5 text-violet-400" />
              Listen to story
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
