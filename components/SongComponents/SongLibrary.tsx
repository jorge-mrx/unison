"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Music, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SongCard } from "./SongCard";
import { searchSongsAction } from "@/lib/actions/songs";
import type { SongFilter, SongWithAuthor } from "@/database/queries/songs";
import { cn } from "@/lib/utils";
import { es } from "@/lib/i18n/locales/es";

type Props = {
  initialItems: SongWithAuthor[];
  isAuthenticated: boolean;
};

export function SongLibrary({ initialItems, isAuthenticated }: Props) {
  const [items, setItems] = useState(initialItems);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<SongFilter>("all");
  const [withChords, setWithChords] = useState(false);
  const [pending, startTransition] = useTransition();
  const lastQuery = useRef<{ q: string; filter: SongFilter; withChords: boolean }>({
    q: "",
    filter: "all",
    withChords: false,
  });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstRun = useRef(true);

  const runSearch = (
    query: string,
    currentFilter: SongFilter,
    currentWithChords: boolean,
  ) => {
    lastQuery.current = {
      q: query,
      filter: currentFilter,
      withChords: currentWithChords,
    };
    startTransition(async () => {
      const result = await searchSongsAction({
        q: query,
        filter: currentFilter,
        withChords: currentWithChords,
      });
      if (
        lastQuery.current.q === query &&
        lastQuery.current.filter === currentFilter &&
        lastQuery.current.withChords === currentWithChords
      ) {
        setItems(result);
      }
    });
  };

  useEffect(() => {
    if (skipFirstRun.current) {
      skipFirstRun.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      runSearch(q, filter, withChords);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter, withChords]);

  const t = es.songs;

  const tabs: { id: SongFilter; label: string; show: boolean }[] = [
    { id: "all", label: t.filterAll, show: true },
    { id: "mine", label: t.filterMine, show: true },
    { id: "favorites", label: t.filterFavorites, show: isAuthenticated },
  ];

  const emptyMessage =
    q.length > 0
      ? t.emptySearch
      : filter === "mine"
        ? t.emptyMine
        : filter === "favorites"
          ? t.emptyFavorites
          : t.empty;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 self-start overflow-x-auto rounded-lg border border-border bg-card p-1 text-xs">
        {tabs
          .filter((tab) => tab.show)
          .map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 font-medium transition-colors",
                filter === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        <button
          type="button"
          onClick={() => setWithChords((v) => !v)}
          aria-pressed={withChords}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
            withChords
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Music className="h-3.5 w-3.5" />
          {t.filterWithChords}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="h-10 flex-1"
          inputMode="search"
        />
        <Link
          href="/canciones/nueva"
          aria-label={es.songs.newCta}
          title={es.songs.newCta}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </div>

      {pending ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((song) => (
            <li key={song.publicId}>
              <SongCard song={song} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="h-24 animate-pulse rounded-xl border border-border bg-card/60"
        />
      ))}
    </ul>
  );
}
