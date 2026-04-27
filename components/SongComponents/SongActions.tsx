"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "./FavoriteButton";
import { softDeleteSongAction } from "@/lib/actions/songs";
import { es } from "@/lib/i18n/locales/es";

type Props = {
  publicId: string;
  isAuthenticated: boolean;
  initialFavorited: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function SongActions({
  publicId,
  isAuthenticated,
  initialFavorited,
  canEdit,
  canDelete,
}: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const t = es.songs.detail;

  if (!isAuthenticated && !canEdit && !canDelete) return null;

  const handleDelete = () => {
    setDeleteError(null);
    startTransition(async () => {
      const result = await softDeleteSongAction(publicId);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      setConfirmOpen(false);
      router.replace("/canciones");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {isAuthenticated && (
        <FavoriteButton songPublicId={publicId} initialFavorited={initialFavorited} />
      )}

      {canEdit && (
        <Link
          href={`/canciones/${publicId}/editar`}
          aria-label={t.editAction}
          title={t.editAction}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label={t.deleteAction}
          title={t.deleteAction}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>{t.deleteConfirmBody}</DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              {es.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? es.common.saving : t.deleteConfirmCta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
