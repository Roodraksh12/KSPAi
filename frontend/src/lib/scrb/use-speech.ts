import { useCallback, useRef, useState } from "react";
import { apiFetchResponse } from "@/api/client";

// Kannada Unicode block: auto-detect so replies in Kannada get a kn-IN voice
const KANNADA_RANGE = /[ಀ-೿]/;

// In-memory module cache for synthesized audio blobs to ensure instant replay
const audioBlobCache = new Map<string, Blob>();
const MAX_BLOB_CACHE = 150;

function stripMarkdown(text: string): string {
  let clean = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~]/g, " ")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();

  // Fix common police acronyms so the TTS spells them out instead of reading them as words
  clean = clean.replace(/\bFIR\b/gi, "F I R");
  clean = clean.replace(/\bCrPC\b/gi, "C R P C");
  clean = clean.replace(/\bBNS\b/gi, "B N S");
  clean = clean.replace(/\bBNSS\b/gi, "B N S S");
  clean = clean.replace(/\bSHO\b/gi, "S H O");
  clean = clean.replace(/\bSP\b/gi, "S P");
  clean = clean.replace(/\bMO\b/g, "M O");

  return clean;
}

/**
 * Splits text into small natural sentence chunks so audio can start playing immediately
 * on chunk 0 while subsequent chunks are pre-fetched in the background.
 */
function splitIntoChunks(text: string): string[] {
  const rawSentences = text
    .split(/(?<=[.?!।\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawSentences.length <= 1) return rawSentences.length === 1 ? rawSentences : [text];

  const chunks: string[] = [];
  let current = "";

  for (const s of rawSentences) {
    if (!current) {
      current = s;
    } else if (current.length < 55 || current.length + s.length < 160) {
      current += " " + s;
    } else {
      chunks.push(current);
      current = s;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text];
}

async function fetchAudioBlob(text: string, lang: string, signal: AbortSignal): Promise<Blob> {
  const cacheKey = `${lang}:${text}`;
  const cached = audioBlobCache.get(cacheKey);
  if (cached) return cached;

  const response = await apiFetchResponse("/api/tts", {
    method: "POST",
    body: JSON.stringify({ text, lang }),
    signal,
  });

  const blob = await response.blob();
  audioBlobCache.set(cacheKey, blob);
  if (audioBlobCache.size > MAX_BLOB_CACHE) {
    const firstKey = audioBlobCache.keys().next().value;
    if (firstKey) audioBlobCache.delete(firstKey);
  }
  return blob;
}

export function isSpeechSupported(): boolean {
  return true;
}

/**
 * Pipelined TTS hook:
 * - Immediately synthesizes and begins playback of the first sentence (~1s instead of 4s)
 * - Pipelined pre-fetching for subsequent sentences while earlier audio plays
 * - In-memory client blob caching for instant replays
 * - Exposes loadingId for immediate UI feedback
 */
export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const activeBlobUrlsRef = useRef<string[]>([]);
  const playbackIndexRef = useRef<number>(0);

  const stop = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (activeBlobUrlsRef.current.length > 0) {
      for (const url of activeBlobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      activeBlobUrlsRef.current = [];
    }

    playbackIndexRef.current = 0;
    setSpeakingId(null);
    setLoadingId(null);
  }, []);

  const speak = useCallback(
    async (id: string, text: string) => {
      stop();

      const clean = stripMarkdown(text).slice(0, 5000);
      if (!clean) return;

      const lang = KANNADA_RANGE.test(clean) ? "kn-IN" : "en-IN";
      const chunks = splitIntoChunks(clean);
      if (chunks.length === 0) return;

      const controller = new AbortController();
      requestRef.current = controller;
      setLoadingId(id);

      try {
        // Fetch chunk 0 immediately
        const firstBlob = await fetchAudioBlob(chunks[0], lang, controller.signal);
        if (requestRef.current !== controller) return;

        const firstUrl = URL.createObjectURL(firstBlob);
        activeBlobUrlsRef.current.push(firstUrl);

        // Pre-fetch remaining chunks in the background
        const remainingPromises: Promise<Blob>[] = chunks.slice(1).map((chunk) =>
          fetchAudioBlob(chunk, lang, controller.signal).catch((err) => {
            if (!controller.signal.aborted) console.warn("Background audio chunk fetch error:", err);
            return new Blob([], { type: "audio/mpeg" });
          })
        );

        setLoadingId(null);
        setSpeakingId(id);

        const audio = new Audio(firstUrl);
        audioRef.current = audio;
        playbackIndexRef.current = 0;

        const playNext = async () => {
          if (requestRef.current !== controller) return;
          playbackIndexRef.current += 1;
          const nextIdx = playbackIndexRef.current;

          if (nextIdx < chunks.length) {
            try {
              const nextBlob = await remainingPromises[nextIdx - 1];
              if (requestRef.current !== controller) return;
              if (nextBlob.size === 0) {
                playNext();
                return;
              }
              const nextUrl = URL.createObjectURL(nextBlob);
              activeBlobUrlsRef.current.push(nextUrl);
              if (audioRef.current) {
                audioRef.current.src = nextUrl;
                audioRef.current.play().catch(stop);
              }
            } catch {
              stop();
            }
          } else {
            stop();
          }
        };

        audio.onended = playNext;
        audio.onerror = stop;
        await audio.play();
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Audio playback failure:", error);
        }
        if (requestRef.current === controller) {
          stop();
        }
      }
    },
    [stop]
  );

  const toggle = useCallback(
    (id: string, text: string) => {
      if (speakingId === id || loadingId === id) {
        stop();
      } else {
        speak(id, text);
      }
    },
    [speakingId, loadingId, speak, stop]
  );

  return { speakingId, loadingId, speak, stop, toggle, isSupported: true };
}
