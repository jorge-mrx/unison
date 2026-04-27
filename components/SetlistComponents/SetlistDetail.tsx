"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddSongDialog } from "./AddSongDialog";
import {
  removeSongFromSetlistAction,
  reorderSetlistSongsAction,
  deleteSetlistAction,
} from "@/lib/actions/setlists";
import { transposeKey } from "@/lib/chordpro";
import { es } from "@/lib/i18n/locales/es";
import type { SetlistDetail as SetlistDetailType } from "@/database/queries/setlists";

const t = es.setlists.detail;

type Props = {
  setlist: SetlistDetailType;
};

export function SetlistDetail({ setlist }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(setlist.songs);
  const [addOpen, setAddOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.publicId === active.id);
    const newIndex = items.findIndex((i) => i.publicId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      await reorderSetlistSongsAction(
        setlist.publicId,
        next.map((i) => i.publicId),
      );
    });
  };

  const handleRemove = (entryPublicId: string) => {
    setItems((prev) => prev.filter((i) => i.publicId !== entryPublicId));
    startTransition(async () => {
      await removeSongFromSetlistAction(entryPublicId);
      router.refresh();
    });
  };

  const handleDeleteSetlist = async () => {
    if (!confirm("¿Eliminar este setlist?")) return;
    setPendingDelete(true);
    const result = await deleteSetlistAction(setlist.publicId);
    setPendingDelete(false);
    if (result.ok) {
      router.replace("/setlists");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/setlists"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{setlist.name}</h1>
            <p className="text-sm text-muted-foreground">
              {setlist.eventDate ? `${t.eventDate} ${setlist.eventDate}` : ""}
              {setlist.eventDate && setlist.venue ? " · " : ""}
              {setlist.venue ? `${t.venue} ${setlist.venue}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/setlists/${setlist.publicId}/escenario`}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t.stage}
            </Link>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSetlist}
              disabled={pendingDelete}
            >
              {pendingDelete ? es.common.saving : es.common.delete}
            </Button>
          </div>
        </div>
        {setlist.notes && (
          <p className="text-sm text-muted-foreground">{setlist.notes}</p>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t.empty}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={items.map((i) => i.publicId)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {items.map((entry, index) => (
                <SortableItem
                  key={entry.publicId}
                  entry={entry}
                  index={index}
                  onRemove={() => handleRemove(entry.publicId)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Button type="button" onClick={() => setAddOpen(true)} className="self-start h-11">
        {t.addSong}
      </Button>

      <AddSongDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        setlistPublicId={setlist.publicId}
        alreadyAddedPublicIds={items.map((i) => i.song.publicId)}
      />
    </div>
  );
}

function SortableItem({
  entry,
  index,
  onRemove,
}: {
  entry: SetlistDetailType["songs"][number];
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.publicId });

  const displayedKey =
    entry.keyOverride && entry.song.originalKey
      ? entry.keyOverride
      : entry.song.originalKey;
  const transposedHint =
    entry.keyOverride && entry.song.originalKey
      ? `(${entry.song.originalKey})`
      : null;
  void transposeKey;

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="Reordenar"
      >
        ⋮⋮
      </button>
      <span className="w-6 text-center font-mono text-xs text-muted-foreground">
        {index + 1}
      </span>
      <Link
        href={`/canciones/${entry.song.publicId}`}
        className="min-w-0 flex-1 truncate text-base font-medium hover:text-primary"
      >
        <span className="truncate">{entry.song.title}</span>
        {entry.song.artist && (
          <span className="ml-2 text-xs text-muted-foreground">
            {entry.song.artist}
          </span>
        )}
      </Link>
      {displayedKey && (
        <Badge
          variant={entry.keyOverride ? "default" : "outline"}
          className="font-mono"
        >
          {displayedKey}
          {transposedHint && (
            <span className="ml-1 text-[10px] opacity-70">{transposedHint}</span>
          )}
        </Badge>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
      >
        {t.removeSong}
      </button>
    </li>
  );
}
