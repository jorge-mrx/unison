import { ChordProFormatter, ChordProParser, Song } from "chordsheetjs";

const CHORD_TOKEN = /^[A-G][#b♭♯]?(?:[°+]|m(?:aj|in)?|sus|dim|aug|add)*\d{0,2}(?:M(?:aj)?)?(?:\d{0,2})?(?:\([^)]*\))?(?:\/[A-G][#b♭♯]?)?$/;

export function parseChordPro(text: string): Song {
  return new ChordProParser().parse(text);
}

export function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

const CHORD_INLINE = /\[[A-G][#b]?(?:m|maj|min|sus|dim|aug|add)?(?:\d{1,2})?(?:\/[A-G][#b]?)?\]/;

export function hasChords(text: string): boolean {
  return CHORD_INLINE.test(text);
}

export function isChordOnlyLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return false;
  return tokens.every((tok) => CHORD_TOKEN.test(tok));
}

export function insertChordAtPosition(line: string, position: number, chord: string): string {
  const safePos = Math.max(0, Math.min(position, line.length));
  const marker = `[${chord}]`;
  return line.slice(0, safePos) + marker + line.slice(safePos);
}

export function removeChordAtPosition(line: string, chordIndex: number): string {
  let i = 0;
  let out = "";
  let count = 0;
  while (i < line.length) {
    if (line[i] === "[") {
      const end = line.indexOf("]", i);
      if (end === -1) {
        out += line.slice(i);
        break;
      }
      if (count === chordIndex) {
        i = end + 1;
        count++;
        continue;
      }
      out += line.slice(i, end + 1);
      i = end + 1;
      count++;
      continue;
    }
    out += line[i];
    i++;
  }
  return out;
}

export function transpose(text: string, delta: number): string {
  if (delta === 0) return text;
  const song = parseChordPro(text);
  const transposed = song.transpose(delta);
  return new ChordProFormatter().format(transposed);
}

const SHARP_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

export function transposeKey(key: string | null | undefined, delta: number): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^([A-G][#b♭]?)(.*)$/);
  if (!match) return trimmed;
  const [, rawRoot, suffix] = match;
  const root = rawRoot.replace("♭", "b");
  const normalized = FLAT_TO_SHARP[root] ?? root;
  const idx = SHARP_KEYS.indexOf(normalized as (typeof SHARP_KEYS)[number]);
  if (idx < 0) return trimmed;
  const len = SHARP_KEYS.length;
  const next = ((idx + delta) % len + len) % len;
  return SHARP_KEYS[next] + suffix;
}

export function mergeChordLineWithLyrics(chordLine: string, lyricsLine: string): string {
  const tokens: { col: number; chord: string }[] = [];
  let i = 0;
  while (i < chordLine.length) {
    if (chordLine[i] === " " || chordLine[i] === "\t") {
      i++;
      continue;
    }
    const start = i;
    while (i < chordLine.length && chordLine[i] !== " " && chordLine[i] !== "\t") {
      i++;
    }
    tokens.push({ col: start, chord: chordLine.slice(start, i) });
  }

  let result = lyricsLine.replace(/  +/g, " ");
  let inserted = 0;
  for (let t = 0; t < tokens.length; t++) {
    const { col, chord } = tokens[t];
    let target = Math.min(col + inserted, result.length);
    const marker = `[${normalizeChordName(chord)}]`;

    if (target > 0 && target < result.length) {
      const charBefore = result[target - 1];
      const charAt = result[target];
      if (charBefore !== " " && charAt !== " " && charAt !== undefined) {
        const wordStart = result.lastIndexOf(" ", target - 1);
        if (wordStart >= 0 && target - wordStart <= 4) {
          target = wordStart + 1;
        } else if (wordStart < 0 && !result.startsWith("[")) {
          target = 0;
        }
      }
    }

    if (target >= result.length && target > 0) {
      result = result + "   " + marker;
      inserted += marker.length + 3;
      continue;
    }

    result = result.slice(0, target) + marker + result.slice(target);
    inserted += marker.length;
  }
  return result;
}

function normalizeChordName(chord: string): string {
  return chord
    .replace(/^([A-G][#b♭♯]?)(4)$/, "$1sus4")
    .replace(/^([A-G][#b♭♯]?)(2)$/, "$1sus2");
}

const KEEP_LABELS = new Set([
  "intro", "solo", "outro", "bridge", "interlude", "instrumental",
  "puente", "entrada", "salida",
]);

const SECTION_LABEL_RE = /^\[([^\]]+)\]\s*(.*)$/;
const PAREN_PROGRESSION_RE = /^\(\s*([^)]+)\s*\)$/;
const REPEAT_SUFFIX_RE = /\s*[x×]\s*\d+\s*$/i;

function isChordProgression(text: string): boolean {
  const cleaned = text.replace(REPEAT_SUFFIX_RE, "").trim();
  return cleaned.length > 0 && isChordOnlyLine(cleaned);
}

export function autoFormatPastedText(raw: string): string {
  const lines = splitLines(raw);
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i] ?? "";
    const next = lines[i + 1];
    const trimmed = cur.trim();

    const labelMatch = trimmed.match(SECTION_LABEL_RE);
    if (labelMatch) {
      const label = labelMatch[1].trim();
      const remainder = labelMatch[2].trim();
      const key = label.toLowerCase().replace(/\s+/g, " ");

      if (KEEP_LABELS.has(key)) {
        out.push(`{comment: ${label}}`);
      }

      if (remainder) {
        if (isChordProgression(remainder)) {
          out.push(`{comment: ${remainder}}`);
        } else {
          out.push(remainder);
        }
      }
      continue;
    }

    const parenMatch = trimmed.match(PAREN_PROGRESSION_RE);
    if (parenMatch && isChordProgression(parenMatch[1].trim())) {
      out.push(`{comment: ${parenMatch[1].trim()}}`);
      continue;
    }

    if (isChordOnlyLine(cur) && next !== undefined && next.trim() !== "" && !isChordOnlyLine(next)) {
      out.push(mergeChordLineWithLyrics(cur, next));
      i++;
      continue;
    }

    if (isChordProgression(trimmed) && trimmed.length > 0) {
      const isLastOrNextEmpty =
        next === undefined || next.trim() === "" || isChordOnlyLine(next);
      if (isLastOrNextEmpty) {
        out.push(`{comment: ${trimmed}}`);
        continue;
      }
    }

    out.push(cur);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const ChordProDocs = {
  storedFormat: "ChordPro inline: chords go in [square brackets] right before the syllable they fall on. Example: [C]On a [Am]dark desert [F]highway",
  emptyLines: "blank lines separate sections; 3+ blank lines collapse to 2",
  sections: "use {start_of_verse: Verse 1} ... {end_of_verse} for sections; bracketed labels like [Verso] are auto-converted on paste",
};
