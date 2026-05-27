"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  maxLength?: number;
};

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function TagInput({ value, onChange, placeholder, id, maxLength = 200 }: Props) {
  const tags = parseTags(value);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commitTag = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (tags.some((t) => t.toLowerCase() === lower)) {
        setDraft("");
        return;
      }
      const next = [...tags, trimmed].join(", ");
      if (next.length > maxLength) return;
      onChange(next);
      setDraft("");
    },
    [tags, onChange, maxLength],
  );

  const removeTag = useCallback(
    (index: number) => {
      const next = tags.filter((_, i) => i !== index).join(", ");
      onChange(next);
    },
    [tags, onChange],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      commitTag(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleInputChange = (text: string) => {
    if (text.includes(",")) {
      const parts = text.split(",");
      for (let i = 0; i < parts.length - 1; i++) {
        commitTag(parts[i]);
      }
      setDraft(parts[parts.length - 1]);
    } else {
      setDraft(text);
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5",
        "focus-within:ring-1 focus-within:ring-ring",
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(i);
            }}
            className="rounded-sm p-0.5 hover:bg-primary/25"
            aria-label={`Quitar ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={draft}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commitTag(draft)}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
