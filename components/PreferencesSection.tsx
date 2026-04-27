"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  readParagraphColors,
  readTheme,
  writeParagraphColors,
  writeTheme,
  type Theme,
} from "@/lib/preferences";
import { cn } from "@/lib/utils";

export function PreferencesSection() {
  const [paragraphColors, setParagraphColors] = useState(true);
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setParagraphColors(readParagraphColors());
    setTheme(readTheme());
    setHydrated(true);
  }, []);

  const handleParagraphColors = (next: boolean) => {
    setParagraphColors(next);
    writeParagraphColors(next);
  };

  const handleTheme = (next: Theme) => {
    setTheme(next);
    writeTheme(next);
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Preferencias
      </h2>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Tema</span>
          <span className="text-xs text-muted-foreground">
            Cambiá entre claro y oscuro
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 text-xs">
          <ThemePill
            active={hydrated && theme === "light"}
            onClick={() => handleTheme("light")}
            label="Claro"
          >
            <Sun className="h-3.5 w-3.5" />
          </ThemePill>
          <ThemePill
            active={!hydrated || theme === "dark"}
            onClick={() => handleTheme("dark")}
            label="Oscuro"
          >
            <Moon className="h-3.5 w-3.5" />
          </ThemePill>
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <Checkbox
          id="paragraphColors"
          checked={hydrated ? paragraphColors : true}
          onCheckedChange={(checked) => handleParagraphColors(Boolean(checked))}
        />
        <span className="flex flex-col">
          <Label htmlFor="paragraphColors" className="cursor-pointer text-sm font-medium">
            Resaltar párrafos con colores
          </Label>
          <span className="text-xs text-muted-foreground">
            Cada sección se pinta con un color suave distinto para distinguirlas
          </span>
        </span>
      </label>
    </section>
  );
}

function ThemePill({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
      {label}
    </button>
  );
}
