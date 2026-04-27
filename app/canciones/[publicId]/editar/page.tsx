import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { SongEditForm } from "@/components/SongComponents/SongEditForm";
import { db } from "@/database/drizzle";
import { songs } from "@/database/schema";

export const metadata: Metadata = {
  title: "Editar canción",
};

type Params = { publicId: string };

export default async function EditarCancionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { publicId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?from=/canciones/${publicId}/editar`);
  }

  const [song] = await db
    .select()
    .from(songs)
    .where(eq(songs.publicId, publicId))
    .limit(1);

  if (!song || song.isDeleted) notFound();

  const userId = Number(session.user.id);
  const isOwner = song.authorUserId === userId;
  const isSuperadmin = session.user.isSuperadmin;
  if (!isOwner && !isSuperadmin) {
    redirect(`/canciones/${publicId}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-3 md:px-6 md:py-4">
      <SongEditForm
        publicId={publicId}
        defaultValues={{
          title: song.title,
          artist: song.artist ?? "",
          originalKey: song.originalKey ?? "",
          bpm: song.bpm != null ? String(song.bpm) : "",
          genre: song.genre ?? "",
          tags: song.tags ?? "",
          contentChordPro: song.contentChordPro,
          notes: song.notes ?? "",
        }}
      />
    </main>
  );
}
