"use client";

import { useEffect, useState } from "react";

export const PARAGRAPH_COLORS_KEY = "unison.paragraphColors";
export const PARAGRAPH_COLORS_EVENT = "unison:paragraph-colors-change";

export const THEME_KEY = "unison.theme";
export const THEME_EVENT = "unison:theme-change";

export type Theme = "dark" | "light";

export function readParagraphColors(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(PARAGRAPH_COLORS_KEY) !== "false";
}

export function writeParagraphColors(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PARAGRAPH_COLORS_KEY, String(value));
  window.dispatchEvent(
    new CustomEvent(PARAGRAPH_COLORS_EVENT, { detail: value }),
  );
}

export function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function writeTheme(value: Theme): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, value);
  const root = document.documentElement;
  if (value === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: value }));
}

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<Theme>).detail;
      setTheme(detail === "light" ? "light" : "dark");
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) setTheme(e.newValue === "light" ? "light" : "dark");
    };
    window.addEventListener(THEME_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return theme;
}

export function useParagraphColors(): boolean {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(readParagraphColors());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setEnabled(typeof detail === "boolean" ? detail : readParagraphColors());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === PARAGRAPH_COLORS_KEY) setEnabled(e.newValue !== "false");
    };
    window.addEventListener(PARAGRAPH_COLORS_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PARAGRAPH_COLORS_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return enabled;
}
