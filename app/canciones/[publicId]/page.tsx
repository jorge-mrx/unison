import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { Separator } from "@/components/ui/separator";
import { SongActions } from "@/components/SongComponents/SongActions";
import { SongView } from "@/components/SongComponents/SongView";
import { db } from "@/database/drizzle";
import { songs, users } from "@/database/schema";
import { isFavoriteByPublicId } from "@/database/queries/favorites";
import { es } from "@/lib/i18n/locales/es";

type Params = { publicId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const [row] = await db
    .select({ title: songs.title })
    .from(songs)
    .where(eq(songs.publicId, publicId))
    .limit(1);
  return { title: row?.title ?? "Canción" };
}

export default async function CancionDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { publicId } = await params;

  const [row] = await db
    .select({
      song: songs,
      authorUserName: users.name,
    })
    .from(songs)
    .leftJoin(users, eq(songs.authorUserId, users.id))
    .where(eq(songs.publicId, publicId))
    .limit(1);

  if (!row || row.song.isDeleted) notFound();

  const { song, authorUserName } = row;
  const author =
    authorUserName ??
    (song.authorGuestName?.trim() ? song.authorGuestName : es.songs.anonymousAuthor);

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const isOwner = userId !== null && song.authorUserId === userId;
  const isSuperadmin = Boolean(session?.user?.isSuperadmin);
  const canEdit = isOwner || isSuperadmin;
  const canDelete = canEdit;
  const initialFavorited =
    userId !== null ? await isFavoriteByPublicId(userId, song.id) : false;

  const metaParts = [
    song.artist,
    song.bpm ? `${song.bpm} BPM` : null,
    song.originalKey,
  ].filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/canciones"
          aria-label={es.songs.detail.back}
          title={es.songs.detail.back}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <SongActions
          publicId={song.publicId}
          isAuthenticated={userId !== null}
          initialFavorited={initialFavorited}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="break-words text-2xl font-semibold sm:text-3xl">
          {song.title}
        </h1>
        {metaParts.length > 0 && (
          <p className="break-words text-sm text-muted-foreground">
            {metaParts.join(" · ")}
          </p>
        )}
        <p className="text-xs text-muted-foreground/80">
          {es.songs.uploadedBy} {author}
        </p>
        {song.tags && (
          <p className="text-xs text-muted-foreground/80">
            <span className="font-medium">{es.songs.detail.tags}:</span> {song.tags}
          </p>
        )}
      </header>

      <Separator />

      <SongView
        contentChordPro={song.contentChordPro}
        originalKey={song.originalKey}
      />

      {song.notes && (
        <>
          <Separator />
          <section className="flex flex-col gap-1 text-sm text-muted-foreground">
            <h2 className="text-sm font-semibold text-foreground">
              {es.songs.detail.notes}
            </h2>
            <p>{song.notes}</p>
          </section>
        </>
      )}
    </main>
  );
}
