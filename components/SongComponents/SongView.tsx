"use client";

import { useEffect, useMemo, useState } from "react";
import { ChordProParser, HtmlDivFormatter } from "chordsheetjs";
import { hasChords, transposeKey } from "@/lib/chordpro";
import { useParagraphColors } from "@/lib/preferences";
import { es } from "@/lib/i18n/locales/es";
import { cn } from "@/lib/utils";

const SHOW_CHORDS_KEY = "unison.showChords";

type Props = {
  contentChordPro: string;
  originalKey: string | null;
};

export function SongView({ contentChordPro, originalKey }: Props) {
  const [delta, setDelta] = useState(0);
  const [showChords, setShowChords] = useState(true);
  const paragraphColors = useParagraphColors();

  useEffect(() => {
    const stored = window.localStorage.getItem(SHOW_CHORDS_KEY);
    if (stored === "false") setShowChords(false);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SHOW_CHORDS_KEY, String(showChords));
  }, [showChords]);

  const songHasChords = useMemo(() => hasChords(contentChordPro), [contentChordPro]);

  const html = useMemo(() => {
    try {
      const song = new ChordProParser().parse(contentChordPro);
      const transposed = delta !== 0 ? song.transpose(delta) : song;
      return new HtmlDivFormatter().format(transposed);
    } catch {
      return `<pre class="lyrics">${escapeHtml(contentChordPro)}</pre>`;
    }
  }, [contentChordPro, delta]);

  const displayedKey = transposeKey(originalKey, delta);
  const t = es.songs.detail;

  return (
    <div className="flex flex-col gap-4">
      {songHasChords && (
        <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setDelta((d) => d - 1)}
              className="h-9 w-9 rounded-md text-base font-semibold hover:bg-muted"
              aria-label={t.transposeDown}
            >
              −
            </button>
            <div className="flex min-w-[5.5rem] flex-col items-center px-2">
              <span className="font-mono text-sm font-semibold">
                {displayedKey ?? "—"}
              </span>
              {originalKey && delta !== 0 && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {originalKey} {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDelta((d) => d + 1)}
              className="h-9 w-9 rounded-md text-base font-semibold hover:bg-muted"
              aria-label={t.transposeUp}
            >
              +
            </button>
          </div>

          {delta !== 0 && (
            <button
              type="button"
              onClick={() => setDelta(0)}
              className="h-9 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
            >
              {t.resetKey}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowChords((v) => !v)}
            className={cn(
              "h-9 rounded-md border px-3 text-xs font-medium transition-colors",
              showChords
                ? "border-border bg-background hover:bg-muted"
                : "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            {showChords ? t.hideChords : t.showChords}
          </button>
        </div>
      )}

      <div
        className="chord-sheet"
        data-show-chords={String(showChords)}
        data-paragraph-colors={String(paragraphColors)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
