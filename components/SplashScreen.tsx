"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SESSION_KEY = "unison.splashShown";
const VISIBLE_MS = 1200;
const FADE_MS = 500;

type State = "idle" | "show" | "fading";

export function SplashScreen() {
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SESSION_KEY) === "true") return;

    setState("show");
    const fadeTimer = window.setTimeout(() => setState("fading"), VISIBLE_MS);
    const removeTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(SESSION_KEY, "true");
      setState("idle");
    }, VISIBLE_MS + FADE_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (state === "idle") return null;

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ease-out",
        state === "fading" ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <div className="splash-brand flex flex-col items-center gap-2">
        <span className="font-display text-6xl text-primary sm:text-8xl">
          Unison
        </span>
        <span className="splash-glow h-[3px] w-24 rounded-full bg-primary/70" />
      </div>
    </div>
  );
}
