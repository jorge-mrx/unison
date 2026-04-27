"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { es } from "@/lib/i18n/locales/es";

const ROOTS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const MODIFIERS = [
  { id: "m", label: "m" },
  { id: "7", label: "7" },
  { id: "M7", label: "M7" },
  { id: "sus", label: "sus" },
  { id: "dim", label: "dim" },
  { id: "aug", label: "aug" },
] as const;

type Accidental = "#" | "b" | null;

type Props = {
  onChordSelected: (chord: string) => void;
};

const preventBlur = (e: React.MouseEvent) => e.preventDefault();

export function ChordToolbar({ onChordSelected }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [accidental, setAccidental] = useState<Accidental>(null);
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);

  const handleRoot = (root: string) => {
    const chord = `${root}${accidental ?? ""}${activeModifiers.join("")}`;
    onChordSelected(chord);
    setAccidental(null);
  };

  const toggleModifier = (id: string) =>
    setActiveModifiers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );

  const toggleAccidental = (acc: Accidental) =>
    setAccidental((prev) => (prev === acc ? null : acc));

  const t = es.songs.create;

  return (
    <div
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-4 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6 md:left-auto md:right-6"
      onMouseDown={preventBlur}
    >
      {expanded && (
        <div
          className="w-full max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover/95 p-2 shadow-2xl backdrop-blur md:w-[420px]"
          onMouseDown={preventBlur}
        >
          <div className="grid grid-cols-7 gap-1">
            {ROOTS.map((root) => (
              <button
                key={root}
                type="button"
                tabIndex={-1}
                onMouseDown={preventBlur}
                onClick={() => handleRoot(root)}
                className="h-10 rounded-md bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 active:translate-y-px"
              >
                {root}
                {accidental && <span className="text-xs">{accidental}</span>}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={preventBlur}
              onClick={() => toggleAccidental("#")}
              className={cn(
                "h-9 min-w-10 rounded-md border px-2 text-sm font-semibold transition-colors",
                accidental === "#"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              #
            </button>
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={preventBlur}
              onClick={() => toggleAccidental("b")}
              className={cn(
                "h-9 min-w-10 rounded-md border px-2 text-sm font-semibold transition-colors",
                accidental === "b"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              ♭
            </button>
            <span className="mx-1 h-5 w-px bg-border" />
            {MODIFIERS.map((mod) => (
              <button
                key={mod.id}
                type="button"
                tabIndex={-1}
                onMouseDown={preventBlur}
                onClick={() => toggleModifier(mod.id)}
                className={cn(
                  "h-9 min-w-10 rounded-md border px-2 text-sm font-medium transition-colors",
                  activeModifiers.includes(mod.id)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                {mod.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onMouseDown={preventBlur}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium shadow-lg transition-all hover:-translate-y-0.5",
          expanded
            ? "border border-primary/40 bg-card text-primary shadow-primary/20"
            : "bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90",
        )}
      >
        <span className="leading-none">♪</span>
        <span>{t.chordsButton}</span>
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
