import { and, desc, eq, ilike, like, or, sql, inArray } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { songs, users, userFavorites, type Song } from "@/database/schema";

export type SongListItem = {
  publicId: string;
  readableId: string;
  title: string;
  artist: string | null;
  originalKey: string | null;
  authorUserName: string | null;
  authorGuestName: string | null;
  createdAt: Date;
};

const baseSongFields = {
  publicId: songs.publicId,
  readableId: songs.readableId,
  title: songs.title,
  artist: songs.artist,
  originalKey: songs.originalKey,
  authorUserId: songs.authorUserId,
  authorGuestId: songs.authorGuestId,
  authorGuestName: songs.authorGuestName,
  createdAt: songs.recordCreationTimeStamp,
} as const;

type SongRow = Song;

export async function listActiveSongs(options: { limit?: number; offset?: number } = {}): Promise<SongRow[]> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  return db
    .select()
    .from(songs)
    .where(eq(songs.isDeleted, false))
    .orderBy(desc(songs.recordCreationTimeStamp))
    .limit(limit)
    .offset(offset);
}

export async function getSongByPublicId(publicId: string): Promise<SongRow | null> {
  const [row] = await db
    .select()
    .from(songs)
    .where(and(eq(songs.publicId, publicId), eq(songs.isDeleted, false)))
    .limit(1);
  return row ?? null;
}

export async function getSongsByAuthorUserId(userId: number): Promise<SongRow[]> {
  return db
    .select()
    .from(songs)
    .where(and(eq(songs.authorUserId, userId), eq(songs.isDeleted, false)))
    .orderBy(desc(songs.recordCreationTimeStamp));
}

export async function getSongsByGuestId(guestId: string): Promise<SongRow[]> {
  return db
    .select()
    .from(songs)
    .where(and(eq(songs.authorGuestId, guestId), eq(songs.isDeleted, false)))
    .orderBy(desc(songs.recordCreationTimeStamp));
}

export { baseSongFields };

export type SongFilter = "all" | "mine" | "favorites";

export type SearchSongsParams = {
  q?: string;
  filter?: SongFilter;
  withChords?: boolean;
  limit?: number;
  offset?: number;
  currentUserId?: number | null;
  currentGuestId?: string | null;
};

export type SongWithAuthor = Song & { authorUserName: string | null };

export async function searchSongs(
  params: SearchSongsParams,
): Promise<SongWithAuthor[]> {
  const limit = params.limit ?? 60;
  const offset = params.offset ?? 0;
  const filter = params.filter ?? "all";
  const q = params.q?.trim() ?? "";

  const conditions = [eq(songs.isDeleted, false)];

  if (q.length > 0) {
    const pattern = `%${q.replace(/[%_]/g, "")}%`;
    conditions.push(
      or(like(songs.title, pattern), like(songs.artist, pattern))!,
    );
  }

  if (filter === "mine") {
    if (params.currentUserId != null) {
      conditions.push(eq(songs.authorUserId, params.currentUserId));
    } else if (params.currentGuestId) {
      conditions.push(eq(songs.authorGuestId, params.currentGuestId));
    } else {
      return [];
    }
  }

  if (params.withChords) {
    conditions.push(eq(songs.hasChords, true));
  }

  if (filter === "favorites") {
    if (params.currentUserId == null) return [];
    const favRows = await db
      .select({ songId: userFavorites.songId })
      .from(userFavorites)
      .where(eq(userFavorites.userId, params.currentUserId));
    const ids = favRows.map((r) => r.songId);
    if (ids.length === 0) return [];
    conditions.push(inArray(songs.id, ids));
  }

  const rows = await db
    .select({ song: songs, authorUserName: users.name })
    .from(songs)
    .leftJoin(users, eq(songs.authorUserId, users.id))
    .where(and(...conditions))
    .orderBy(desc(songs.recordCreationTimeStamp))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({ ...row.song, authorUserName: row.authorUserName }));
}

void ilike;
void sql;
