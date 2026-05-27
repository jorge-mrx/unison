import { autoFormatPastedText, transpose } from "../../chordpro";

export type CifraMetadata = {
  originalKey?: string;
  capo?: number;
};

export type CifraResult = {
  content: string;
  metadata: CifraMetadata;
};

const KEY_LINE_RE =
  /^\s*(?:tom|tono|tonalidad|tonality|key|tone)\s*[:=]\s*([A-G][#b♭♯]?m?)/i;

const CAPO_LINE_RE =
  /^\s*capo\s*(?:[:=]|(?:\s+(?:on\s+)?(?:the\s+)?))\s*(\d{1,2})(?:ª|º|st|nd|rd|th)?\s*(?:fret|traste?)?\s*$/i;

const CAPO_LINE_RE2 =
  /^\s*(?:capo|cejilla|cejillo)\s*[:=]?\s*(?:tras?te\s*)?(\d{1,2})\s*$/i;

const TAB_LINE_RE = /^[A-Ga-g]\|[-0-9hp()\s|]+$/;
const TAB_ARROW_RE = /^[\s↓↑]+$/;
const TAB_LABEL_RE = /^\s*Parte\s+\d/i;
const CIFRA_META_RE = /^\s*Chords?\s*:/i;

function isTabRelated(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    TAB_LINE_RE.test(trimmed) ||
    (TAB_ARROW_RE.test(trimmed) && trimmed.includes("↓")) ||
    TAB_LABEL_RE.test(trimmed)
  );
}

export function cleanCifraClub(input: string): CifraResult {
  const rawLines = input.split(/\r?\n/);
  const metadata: CifraMetadata = {};
  const bodyLines: string[] = [];

  let metadataPhase = true;

  for (const line of rawLines) {
    if (CIFRA_META_RE.test(line)) continue;

    if (metadataPhase) {
      const keyMatch = line.match(KEY_LINE_RE);
      if (keyMatch) {
        metadata.originalKey = normalizeKey(keyMatch[1]);
        continue;
      }
      const capoMatch = line.match(CAPO_LINE_RE) ?? line.match(CAPO_LINE_RE2);
      if (capoMatch) {
        const n = Number(capoMatch[1]);
        if (Number.isFinite(n) && n >= 0 && n <= 12) {
          metadata.capo = n;
        }
        continue;
      }
      if (line.trim() !== "") {
        metadataPhase = false;
      }
    }

    if (isTabRelated(line)) continue;

    bodyLines.push(line);
  }

  let content = autoFormatPastedText(bodyLines.join("\n").replace(/^\n+/, ""));

  if (metadata.capo && metadata.capo > 0) {
    content = transpose(content, metadata.capo);
  }

  return { content, metadata };
}

function normalizeKey(raw: string): string {
  return raw
    .replace("♭", "b")
    .replace("♯", "#")
    .replace(/^([a-g])/, (m) => m.toUpperCase())
    .trim();
}
