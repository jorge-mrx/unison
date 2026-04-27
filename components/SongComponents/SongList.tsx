import type { Song } from "@/database/schema";
import { SongCard } from "./SongCard";
import { es } from "@/lib/i18n/locales/es";

type SongWithAuthorName = Song & { authorUserName?: string | null };

export function SongList({ songs }: { songs: SongWithAuthorName[] }) {
  if (songs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {es.songs.empty}
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((song) => (
        <li key={song.publicId}>
          <SongCard song={song} />
        </li>
      ))}
    </ul>
  );
}
