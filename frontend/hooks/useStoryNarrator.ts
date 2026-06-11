"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_NARRATOR_SETTINGS,
  findVoiceByURI,
  loadNarratorSettings,
  pickDefaultNarratorVoice,
  saveNarratorSettings,
  type NarratorSettings,
} from "@/lib/narrator-settings";

export type NarratorState = "idle" | "playing" | "paused" | "unsupported";

const CHUNK_MAX = 12_000;

function splitIntoChunks(text: string): string[] {
  if (text.length <= CHUNK_MAX) return [text];

  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const next = current ? `${current}\n\n${para}` : para;
    if (next.length > CHUNK_MAX && current) {
      chunks.push(current);
      current = para;
    } else if (next.length > CHUNK_MAX) {
      chunks.push(para.slice(0, CHUNK_MAX));
      current = para.slice(CHUNK_MAX);
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text.slice(0, CHUNK_MAX)];
}

export function useStoryNarrator(storyId: string) {
  const [state, setState] = useState<NarratorState>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<NarratorSettings>(DEFAULT_NARRATOR_SETTINGS);
  const chunkIndexRef = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const supportedRef = useRef(true);
  const settingsRef = useRef(settings);

  settingsRef.current = settings;

  const selectedVoice =
    findVoiceByURI(voices, settings.voiceURI) ?? pickDefaultNarratorVoice(voices);

  useEffect(() => {
    setSettings(loadNarratorSettings());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      supportedRef.current = false;
      setState("unsupported");
      return;
    }

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setVoices(list);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<NarratorSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveNarratorSettings(next);
      return next;
    });
  }, []);

  const speakChunk = useCallback(
    (index: number) => {
      const chunks = chunksRef.current;
      if (index >= chunks.length) {
        setState("idle");
        chunkIndexRef.current = 0;
        return;
      }

      const { rate, pitch, voiceURI } = settingsRef.current;
      const voice =
        findVoiceByURI(window.speechSynthesis.getVoices(), voiceURI) ??
        pickDefaultNarratorVoice(window.speechSynthesis.getVoices());

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        chunkIndexRef.current = index + 1;
        speakChunk(index + 1);
      };
      utterance.onerror = () => {
        setState("idle");
        chunkIndexRef.current = 0;
      };

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    chunkIndexRef.current = 0;
    chunksRef.current = [];
    setState("idle");
  }, []);

  const play = useCallback(
    (text: string) => {
      if (!supportedRef.current || !text.trim()) return;

      window.speechSynthesis.cancel();
      chunksRef.current = splitIntoChunks(text.trim());
      chunkIndexRef.current = 0;
      setState("playing");
      speakChunk(0);
    },
    [speakChunk]
  );

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.resume();
    setState("playing");
  }, []);

  const toggle = useCallback(
    (text: string) => {
      if (state === "playing") {
        pause();
      } else if (state === "paused") {
        resume();
      } else {
        play(text);
      }
    },
    [state, pause, resume, play]
  );

  const setVoiceURI = useCallback(
    (voiceURI: string | null) => {
      updateSettings({ voiceURI });
    },
    [updateSettings]
  );

  const setRate = useCallback(
    (rate: number) => {
      updateSettings({ rate });
    },
    [updateSettings]
  );

  const setPitch = useCallback(
    (pitch: number) => {
      updateSettings({ pitch });
    },
    [updateSettings]
  );

  const resetSettings = useCallback(() => {
    saveNarratorSettings(DEFAULT_NARRATOR_SETTINGS);
    setSettings(DEFAULT_NARRATOR_SETTINGS);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [storyId]);

  return {
    state,
    supported: state !== "unsupported",
    voices,
    selectedVoice,
    settings,
    setVoiceURI,
    setRate,
    setPitch,
    resetSettings,
    play,
    pause,
    resume,
    stop,
    toggle,
  };
}
