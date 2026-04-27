import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { userFavorites } from "@/database/schema";

export async function getFavoriteSongIds(userId: number): Promise<Set<number>> {
  const rows = await db
    .select({ songId: userFavorites.songId })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId));
  return new Set(rows.map((r) => r.songId));
}

export async function isFavoriteByPublicId(
  userId: number,
  songId: number,
): Promise<boolean> {
  const ids = await getFavoriteSongIds(userId);
  return ids.has(songId);
}
