"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { cn } from "@/lib/utils";

type Props = {
  songPublicId: string;
  initialFavorited: boolean;
};

export function FavoriteButton({ songPublicId, initialFavorited }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await toggleFavoriteAction(songPublicId);
      if (result.ok) setFavorited(result.favorited);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? "Quitar de favoritas" : "Marcar favorita"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
        favorited
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      <Heart className="h-4 w-4" fill={favorited ? "currentColor" : "none"} />
    </button>
  );
}
