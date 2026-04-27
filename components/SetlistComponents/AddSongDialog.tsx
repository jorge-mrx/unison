"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchSongsAction } from "@/lib/actions/songs";
import { addSongToSetlistAction } from "@/lib/actions/setlists";
import type { SongWithAuthor } from "@/database/queries/songs";
import { es } from "@/lib/i18n/locales/es";
import { useRouter } from "next/navigation";

const t = es.setlists.addDialog;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setlistPublicId: string;
  alreadyAddedPublicIds: string[];
};

export function AddSongDialog({
  open,
  onOpenChange,
  setlistPublicId,
  alreadyAddedPublicIds,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SongWithAuthor[]>([]);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      startTransition(async () => {
        const result = await searchSongsAction({ q, filter: "all" });
        setItems(result);
      });
    }, 250);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [q, open]);

  const handleAdd = async (songPublicId: string) => {
    setAdding(songPublicId);
    const result = await addSongToSetlistAction(setlistPublicId, songPublicId);
    setAdding(null);
    if (result.ok) {
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          inputMode="search"
        />
        <div className="max-h-[60vh] overflow-y-auto">
          {pending ? (
            <p className="px-1 py-3 text-sm text-muted-foreground">
              {es.songs.loading}
            </p>
          ) : items.length === 0 ? (
            <p className="px-1 py-3 text-sm text-muted-foreground">{t.empty}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((song) => {
                const already = alreadyAddedPublicIds.includes(song.publicId);
                return (
                  <li
                    key={song.publicId}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{song.title}</p>
                      {song.artist && (
                        <p className="truncate text-xs text-muted-foreground">
                          {song.artist}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={already || adding === song.publicId}
                      onClick={() => handleAdd(song.publicId)}
                      className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground"
                    >
                      {already ? t.added : adding === song.publicId ? "…" : t.add}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
