"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChordProParser, HtmlDivFormatter } from "chordsheetjs";
import type { Setlist, SetlistSong, Song } from "@/database/schema";
import { es } from "@/lib/i18n/locales/es";
import { transposeKey } from "@/lib/chordpro";
import { useParagraphColors } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const SCROLL_SPEED_KEY = "unison.stage.speed";
const SHOW_CHORDS_KEY = "unison.showChords";

const SWIPE_THRESHOLD = 50;

type StageEntry = SetlistSong & { song: Song };

type Props = {
  setlist: Setlist;
  entries: StageEntry[];
};

const t = es.setlists.stage;

export function StageMode({ setlist, entries }: Props) {
  const [index, setIndex] = useState(0);
  const [showChords, setShowChords] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [scrolling, setScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const touchStartX = useRef<number | null>(null);
  const paragraphColors = useParagraphColors();

  const entry = entries[index];

  useEffect(() => {
    const stored = window.localStorage.getItem(SHOW_CHORDS_KEY);
    if (stored === "false") setShowChords(false);
    const sp = window.localStorage.getItem(SCROLL_SPEED_KEY);
    if (sp) setSpeed(Number(sp) || 1);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SCROLL_SPEED_KEY, String(speed));
  }, [speed]);

  useEffect(() => {
    let cancelled = false;
    const acquire = async () => {
      if (!("wakeLock" in navigator)) return;
      try {
        const lock = await (navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
        }).wakeLock?.request("screen");
        if (cancelled) {
          lock?.release();
          return;
        }
        wakeLockRef.current = lock ?? null;
      } catch {
        // ignore
      }
    };
    acquire();
    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!scrolling) return;
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = now - last;
      last = now;
      el.scrollTop += (speed * elapsed) / 16;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrolling, speed, index]);

  const html = useMemo(() => {
    if (!entry) return "";
    try {
      const song = new ChordProParser().parse(entry.song.contentChordPro);
      const delta = computeDelta(entry.song.originalKey, entry.keyOverride);
      const adjusted = delta !== 0 ? song.transpose(delta) : song;
      return new HtmlDivFormatter().format(adjusted);
    } catch {
      return `<pre class="lyrics">${escapeHtml(entry.song.contentChordPro)}</pre>`;
    }
  }, [entry]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
    setScrolling(false);
    containerRef.current?.scrollTo({ top: 0 });
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(entries.length - 1, i + 1));
    setScrolling(false);
    containerRef.current?.scrollTo({ top: 0 });
  }, [entries.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") goNext();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") goPrev();
      else if (e.key === " ") {
        e.preventDefault();
        setScrolling((v) => !v);
      } else if (e.key === "Escape") {
        window.history.back();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (dx > SWIPE_THRESHOLD) goPrev();
    else if (dx < -SWIPE_THRESHOLD) goNext();
  };

  const onDoubleTap = () => setScrolling((v) => !v);

  if (entries.length === 0 || !entry) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[color:var(--stage)] text-foreground">
        <p className="text-lg">{t.empty}</p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm"
        >
          {t.exit}
        </button>
      </div>
    );
  }

  const displayedKey =
    entry.keyOverride ?? transposeKey(entry.song.originalKey, 0) ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[color:var(--stage)] text-foreground"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onDoubleClick={onDoubleTap}
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-[color:var(--stage)]/90 px-4 py-2 text-sm backdrop-blur">
        <span className="font-mono text-xs text-muted-foreground">
          {index + 1} / {entries.length}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">{entry.song.title}</span>
        {displayedKey && (
          <span className="font-mono text-xs text-[color:var(--chord)]">
            {displayedKey}
          </span>
        )}
        <button
          type="button"
          onClick={() => setShowChords((v) => !v)}
          className={cn(
            "rounded-md border px-2 py-1 text-xs",
            showChords
              ? "border-white/15 text-muted-foreground"
              : "border-primary/40 text-primary",
          )}
        >
          {showChords ? "♪" : "·"}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-md border border-white/15 px-3 py-1 text-xs"
        >
          {t.exit}
        </button>
      </header>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
      >
        <div
          className="chord-sheet stage-sheet mx-auto max-w-3xl"
          data-show-chords={String(showChords)}
          data-paragraph-colors={String(paragraphColors)}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="h-[40dvh]" aria-hidden />
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-white/10 bg-[color:var(--stage)]/90 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="h-11 rounded-lg border border-white/15 px-4 text-sm disabled:opacity-40"
        >
          ← {t.prev}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScrolling((v) => !v)}
            className={cn(
              "h-11 rounded-lg px-4 text-sm font-semibold",
              scrolling
                ? "bg-primary text-primary-foreground"
                : "border border-white/15",
            )}
          >
            {scrolling ? t.pause : t.play}
          </button>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            aria-label={t.speed}
            className="w-24"
          />
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={index === entries.length - 1}
          className="h-11 rounded-lg border border-white/15 px-4 text-sm disabled:opacity-40"
        >
          {t.next} →
        </button>
      </footer>

      <p className="hidden">{setlist.name}</p>
    </div>
  );
}

function computeDelta(originalKey: string | null, override: string | null): number {
  if (!originalKey || !override) return 0;
  const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const FLAT: Record<string, string> = {
    Db: "C#",
    Eb: "D#",
    Gb: "F#",
    Ab: "G#",
    Bb: "A#",
  };
  const norm = (key: string) => {
    const m = key.match(/^([A-G][#b♭]?)/);
    if (!m) return null;
    const root = m[1].replace("♭", "b");
    return FLAT[root] ?? root;
  };
  const a = norm(originalKey);
  const b = norm(override);
  if (!a || !b) return 0;
  const ai = NOTES.indexOf(a);
  const bi = NOTES.indexOf(b);
  if (ai < 0 || bi < 0) return 0;
  let delta = bi - ai;
  if (delta > 6) delta -= 12;
  if (delta < -6) delta += 12;
  return delta;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
