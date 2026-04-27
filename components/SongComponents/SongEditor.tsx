"use client";

import { useRef } from "react";
import { ChordToolbar } from "./ChordToolbar";
import { autoFormatPastedText, insertChordAtPosition } from "@/lib/chordpro";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

const TEXT_BASE =
  "p-3 pb-32 md:pb-24 font-mono text-base leading-relaxed whitespace-pre-wrap break-words";

export function SongEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlighterRef = useRef<HTMLDivElement | null>(null);

  const insertChord = (chord: string) => {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? value.length;
    const next = insertChordAtPosition(value, pos, chord);
    onChange(next);
    const newPos = pos + chord.length + 2;
    requestAnimationFrame(() => {
      const target = textareaRef.current;
      if (!target) return;
      target.focus();
      target.setSelectionRange(newPos, newPos);
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain");
    const formatted = autoFormatPastedText(pasted);
    const target = e.currentTarget;
    const start = target.selectionStart ?? value.length;
    const end = target.selectionEnd ?? value.length;
    const next = value.slice(0, start) + formatted + value.slice(end);
    onChange(next);
    const newPos = start + formatted.length;
    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(newPos, newPos);
    });
  };

  const syncScroll = () => {
    const ta = textareaRef.current;
    const h = highlighterRef.current;
    if (!ta || !h) return;
    h.scrollTop = ta.scrollTop;
    h.scrollLeft = ta.scrollLeft;
  };

  return (
    <>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
        <div
          ref={highlighterRef}
          aria-hidden
          className={`pointer-events-none absolute inset-0 overflow-y-auto overflow-x-hidden text-foreground [&::-webkit-scrollbar]:hidden [scrollbar-width:none] ${TEXT_BASE}`}
        >
          {renderHighlight(value)}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onPaste={handlePaste}
          spellCheck={false}
          className={`absolute inset-0 z-[1] resize-none border-0 bg-transparent text-transparent caret-foreground outline-none focus:outline-none placeholder:text-muted-foreground/70 ${TEXT_BASE}`}
          placeholder="Pega aquí la letra. Coloca el cursor donde quieras un acorde y usa el botón ♪ Acordes para insertarlo"
        />
      </div>
      <ChordToolbar onChordSelected={insertChord} />
    </>
  );
}

function renderHighlight(text: string): React.ReactNode {
  const safe = text.endsWith("\n") || text === "" ? text + " " : text;
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < safe.length) {
    if (safe[i] === "[") {
      const end = safe.indexOf("]", i);
      if (end === -1) {
        parts.push(<span key={key++}>{safe.slice(i)}</span>);
        break;
      }
      parts.push(
        <span key={key++} className="select-none text-transparent">
          [
        </span>,
        <span key={key++} className="font-bold text-[color:var(--chord)]">
          {safe.slice(i + 1, end)}
        </span>,
        <span key={key++} className="select-none text-transparent">
          ]
        </span>,
      );
      i = end + 1;
      continue;
    }
    const next = safe.indexOf("[", i);
    const stop = next === -1 ? safe.length : next;
    parts.push(<span key={key++}>{safe.slice(i, stop)}</span>);
    i = stop;
  }
  return parts;
}
