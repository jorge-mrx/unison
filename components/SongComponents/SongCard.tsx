import Link from "next/link";
import type { Song } from "@/database/schema";
import { Badge } from "@/components/ui/badge";
import { es } from "@/lib/i18n/locales/es";

type Props = {
  song: Pick<
    Song,
    | "publicId"
    | "title"
    | "artist"
    | "originalKey"
    | "authorUserId"
    | "authorGuestName"
  > & { authorUserName?: string | null };
};

export function SongCard({ song }: Props) {
  const author =
    song.authorUserName ??
    (song.authorGuestName?.trim() ? song.authorGuestName : es.songs.anonymousAuthor);

  return (
    <Link
      href={`/canciones/${song.publicId}`}
      className="hover-lift group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight text-foreground group-hover:text-primary">
          {song.title}
        </h3>
        {song.originalKey && (
          <Badge variant="secondary" className="font-mono text-xs">
            {song.originalKey}
          </Badge>
        )}
      </div>
      {song.artist && (
        <p className="text-sm text-muted-foreground">{song.artist}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground/80">
        {es.songs.uploadedBy} {author}
      </p>
    </Link>
  );
}
