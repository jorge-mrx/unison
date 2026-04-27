import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/database/drizzle";
import {
  setlists,
  setlistSongs,
  songs,
  groupMembers,
  type Setlist,
  type SetlistSong,
  type Song,
} from "@/database/schema";

export type SetlistRow = Setlist;
export type SetlistDetail = Setlist & {
  songs: Array<SetlistSong & { song: Song }>;
};

export async function listMySetlists(userId: number): Promise<SetlistRow[]> {
  const memberships = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));
  const groupIds = memberships.map((m) => m.groupId);

  const conditions = [eq(setlists.ownerUserId, userId)];
  if (groupIds.length > 0) {
    conditions.push(inArray(setlists.ownerGroupId, groupIds));
  }

  return db
    .select()
    .from(setlists)
    .where(or(...conditions))
    .orderBy(desc(setlists.recordCreationTimeStamp));
}

export async function getSetlistByPublicId(
  publicId: string,
): Promise<SetlistDetail | null> {
  const [setlist] = await db
    .select()
    .from(setlists)
    .where(eq(setlists.publicId, publicId))
    .limit(1);
  if (!setlist) return null;

  const rows = await db
    .select({ entry: setlistSongs, song: songs })
    .from(setlistSongs)
    .innerJoin(songs, eq(setlistSongs.songId, songs.id))
    .where(eq(setlistSongs.setlistId, setlist.id))
    .orderBy(asc(setlistSongs.position));

  return {
    ...setlist,
    songs: rows.map((r) => ({ ...r.entry, song: r.song })),
  };
}

export async function userCanAccessSetlist(
  setlist: Setlist,
  userId: number,
): Promise<boolean> {
  if (setlist.ownerUserId === userId) return true;
  if (setlist.ownerGroupId == null) return false;
  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, setlist.ownerGroupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(membership);
}
