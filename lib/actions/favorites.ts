"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { songs, userFavorites } from "@/database/schema";

export type ToggleFavoriteResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string };

export async function toggleFavoriteAction(
  songPublicId: string,
): Promise<ToggleFavoriteResult> {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) {
    return { ok: false, error: "Necesitas iniciar sesión para marcar favoritas" };
  }

  const [song] = await db
    .select({ id: songs.id })
    .from(songs)
    .where(eq(songs.publicId, songPublicId))
    .limit(1);
  if (!song) return { ok: false, error: "Canción no encontrada" };

  const [existing] = await db
    .select({ id: userFavorites.id })
    .from(userFavorites)
    .where(
      and(eq(userFavorites.userId, userId), eq(userFavorites.songId, song.id)),
    )
    .limit(1);

  if (existing) {
    await db.delete(userFavorites).where(eq(userFavorites.id, existing.id));
    revalidatePath(`/canciones/${songPublicId}`);
    return { ok: true, favorited: false };
  }

  await db.insert(userFavorites).values({
    userId,
    songId: song.id,
    recordCreatedBy: `User:${userId}`,
  });

  revalidatePath(`/canciones/${songPublicId}`);
  return { ok: true, favorited: true };
}
