"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import {
  groupMembers,
  groups,
  setlistSongs,
  setlists,
  songs,
} from "@/database/schema";
import { userCanAccessSetlist } from "@/database/queries/setlists";
import {
  createSetlistSchema,
  updateSetlistSongSchema,
  type CreateSetlistInput,
  type UpdateSetlistSongInput,
} from "@/lib/validations";

export type SetlistResult =
  | { ok: true; publicId: string }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };

type AuthOk = { ok: true; userId: number; isSuperadmin: boolean };
type AuthErr = { ok: false; error: string };

async function requireUser(): Promise<AuthOk | AuthErr> {
  const session = await auth();
  const id = session?.user?.id ? Number(session.user.id) : null;
  if (!id) return { ok: false, error: "Inicia sesión para gestionar setlists" };
  return { ok: true, userId: id, isSuperadmin: Boolean(session!.user.isSuperadmin) };
}

export async function createSetlistAction(
  input: CreateSetlistInput,
): Promise<SetlistResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const parsed = createSetlistSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  let ownerGroupId: number | null = null;

  if (data.ownerGroupPublicId) {
    const [group] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.publicId, data.ownerGroupPublicId))
      .limit(1);
    if (!group) return { ok: false, error: "Grupo no encontrado" };

    const [membership] = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, me.userId)),
      )
      .limit(1);
    if (!membership && !me.isSuperadmin) {
      return { ok: false, error: "No eres miembro de ese grupo" };
    }
    ownerGroupId = group.id;
  }

  const [created] = await db
    .insert(setlists)
    .values({
      name: data.name,
      eventDate: data.eventDate ?? null,
      venue: data.venue ?? null,
      notes: data.notes ?? null,
      ownerUserId: ownerGroupId ? null : me.userId,
      ownerGroupId,
      recordCreatedBy: `User:${me.userId}`,
    })
    .returning({ publicId: setlists.publicId });

  revalidatePath("/setlists");
  return { ok: true, publicId: created!.publicId };
}

export async function updateSetlistAction(
  publicId: string,
  input: CreateSetlistInput,
): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const parsed = createSetlistSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const [setlist] = await db
    .select()
    .from(setlists)
    .where(eq(setlists.publicId, publicId))
    .limit(1);
  if (!setlist) return { ok: false, error: "Setlist no encontrado" };

  const allowed =
    me.isSuperadmin ||
    (await userCanAccessSetlist(setlist, me.userId));
  if (!allowed) return { ok: false, error: "Sin permiso" };

  const data = parsed.data;
  await db
    .update(setlists)
    .set({
      name: data.name,
      eventDate: data.eventDate ?? null,
      venue: data.venue ?? null,
      notes: data.notes ?? null,
      recordUpdatedTimesTamp: new Date(),
      recordModifiedBy: `User:${me.userId}`,
    })
    .where(eq(setlists.id, setlist.id));

  revalidatePath("/setlists");
  revalidatePath(`/setlists/${publicId}`);
  return { ok: true };
}

export async function deleteSetlistAction(publicId: string): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const [setlist] = await db
    .select()
    .from(setlists)
    .where(eq(setlists.publicId, publicId))
    .limit(1);
  if (!setlist) return { ok: false, error: "Setlist no encontrado" };

  const allowed =
    me.isSuperadmin ||
    setlist.ownerUserId === me.userId ||
    (setlist.ownerGroupId != null &&
      (await userCanAccessSetlist(setlist, me.userId)));
  if (!allowed) return { ok: false, error: "Sin permiso" };

  await db.delete(setlists).where(eq(setlists.id, setlist.id));
  revalidatePath("/setlists");
  return { ok: true };
}

export async function addSongToSetlistAction(
  setlistPublicId: string,
  songPublicId: string,
): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const [setlist] = await db
    .select()
    .from(setlists)
    .where(eq(setlists.publicId, setlistPublicId))
    .limit(1);
  if (!setlist) return { ok: false, error: "Setlist no encontrado" };

  const allowed =
    me.isSuperadmin ||
    (await userCanAccessSetlist(setlist, me.userId));
  if (!allowed) return { ok: false, error: "Sin permiso" };

  const [song] = await db
    .select({ id: songs.id })
    .from(songs)
    .where(and(eq(songs.publicId, songPublicId), eq(songs.isDeleted, false)))
    .limit(1);
  if (!song) return { ok: false, error: "Canción no encontrada" };

  const [maxRow] = await db
    .select({ pos: max(setlistSongs.position) })
    .from(setlistSongs)
    .where(eq(setlistSongs.setlistId, setlist.id));
  const nextPos = (maxRow?.pos ?? 0) + 1;

  await db.insert(setlistSongs).values({
    setlistId: setlist.id,
    songId: song.id,
    position: nextPos,
    recordCreatedBy: `User:${me.userId}`,
  });

  revalidatePath(`/setlists/${setlistPublicId}`);
  return { ok: true };
}

export async function removeSongFromSetlistAction(
  setlistSongPublicId: string,
): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const [entry] = await db
    .select()
    .from(setlistSongs)
    .where(eq(setlistSongs.publicId, setlistSongPublicId))
    .limit(1);
  if (!entry) return { ok: false, error: "Entrada no encontrada" };

  const [setlist] = await db
    .select()
    .from(setlists)
    .where(eq(setlists.id, entry.setlistId))
    .limit(1);
  if (!setlist) return { ok: false, error: "Setlist no encontrado" };

  const allowed =
    me.isSuperadmin ||
    (await userCanAccessSetlist(setlist, me.userId));
  if (!allowed) return { ok: false, error: "Sin permiso" };

  await db.delete(setlistSongs).where(eq(setlistSongs.id, entry.id));

  revalidatePath(`/setlists/${setlist.publicId}`);
  return { ok: true };
}

export async function reorderSetlistSongsAction(
  setlistPublicId: string,
  orderedPublicIds: string[],
): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const [setlist] = await db
    .select()
    .from(setlists)
    .where(eq(setlists.publicId, setlistPublicId))
    .limit(1);
  if (!setlist) return { ok: false, error: "Setlist no encontrado" };

  const allowed =
    me.isSuperadmin ||
    (await userCanAccessSetlist(setlist, me.userId));
  if (!allowed) return { ok: false, error: "Sin permiso" };

  const entries = await db
    .select()
    .from(setlistSongs)
    .where(eq(setlistSongs.setlistId, setlist.id));
  const idByPublicId = new Map(entries.map((e) => [e.publicId, e.id]));

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedPublicIds.length; i++) {
      const id = idByPublicId.get(orderedPublicIds[i]);
      if (id == null) continue;
      await tx
        .update(setlistSongs)
        .set({
          position: -(i + 1),
          recordUpdatedTimesTamp: new Date(),
          recordModifiedBy: `User:${me.userId}`,
        })
        .where(eq(setlistSongs.id, id));
    }
    for (let i = 0; i < orderedPublicIds.length; i++) {
      const id = idByPublicId.get(orderedPublicIds[i]);
      if (id == null) continue;
      await tx
        .update(setlistSongs)
        .set({ position: i + 1 })
        .where(eq(setlistSongs.id, id));
    }
  });

  revalidatePath(`/setlists/${setlistPublicId}`);
  return { ok: true };
}

export async function updateSetlistSongAction(
  setlistSongPublicId: string,
  input: UpdateSetlistSongInput,
): Promise<SimpleResult> {
  const me = await requireUser();
  if (!me.ok) return { ok: false, error: me.error };

  const parsed = updateSetlistSongSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const [entry] = await db
    .select()
    .from(setlistSongs)
    .where(eq(setlistSongs.publicId, setlistSongPublicId))
    .limit(1);
  if (!entry) return { ok: false, error: "Entrada no encontrada" };

  const [setlist] = await db
    .select()
    .from(setlists)
    .where(eq(setlists.id, entry.setlistId))
    .limit(1);
  if (!setlist) return { ok: false, error: "Setlist no encontrado" };

  const allowed =
    me.isSuperadmin ||
    (await userCanAccessSetlist(setlist, me.userId));
  if (!allowed) return { ok: false, error: "Sin permiso" };

  await db
    .update(setlistSongs)
    .set({
      keyOverride: parsed.data.keyOverride ?? null,
      setlistSpecificNotes: parsed.data.setlistSpecificNotes ?? null,
      recordUpdatedTimesTamp: new Date(),
      recordModifiedBy: `User:${me.userId}`,
    })
    .where(eq(setlistSongs.id, entry.id));

  revalidatePath(`/setlists/${setlist.publicId}`);
  return { ok: true };
}
