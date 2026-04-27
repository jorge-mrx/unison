import { randomUUID } from "node:crypto";

const READABLE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePublicId(): string {
  return randomUUID();
}

export function generateReadableId(prefix: string, length = 6): string {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += READABLE_ALPHABET[Math.floor(Math.random() * READABLE_ALPHABET.length)];
  }
  return `${prefix.toUpperCase()}-${suffix}`;
}

export function readableIdDefault(prefix: string, length = 6) {
  return () => generateReadableId(prefix, length);
}

export const ID_PREFIXES = {
  user: "USR",
  song: "SNG",
  setlist: "SET",
  setlistSong: "SLS",
  group: "GRP",
  groupMember: "GMB",
  favorite: "FAV",
  guest: "GST",
} as const;

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];
