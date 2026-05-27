"use server";

import { and, eq, isNull, like, ne, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { songs } from "@/database/schema";
import {
  searchSongs,
  type SongFilter,
  type SongWithAuthor,
} from "@/database/queries/songs";
import { hasChords } from "@/lib/chordpro";
import { getCurrentGuestId, getOrCreateGuestId } from "@/lib/guest";
import { checkGuestUploadLimit } from "@/lib/ratelimit";
import {
  createSongSchema,
  updateSongSchema,
  type CreateSongInput,
  type UpdateSongInput,
} from "@/lib/validations";

export type CreateSongResult =
  | { ok: true; publicId: string }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };

async function getClientIp(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return list.get("x-real-ip") ?? "unknown";
}

export async function createSongAction(input: CreateSongInput): Promise<CreateSongResult> {
  const parsed = createSongSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const session = await auth();
  const data = parsed.data;
  const bpm = data.bpm ? Number(data.bpm) : null;
  const capo = data.capo ? Number(data.capo) : null;
  const blank = (v?: string) => (v && v.trim() ? v.trim() : null);
  const songHasChords = hasChords(data.contentChordPro);

  let created: { publicId: string } | undefined;

  if (session?.user?.id) {
    const userId = Number(session.user.id);
    [created] = await db
      .insert(songs)
      .values({
        title: data.title,
        artist: blank(data.artist),
        originalKey: blank(data.originalKey),
        bpm,
        capo,
        genre: blank(data.genre),
        tags: blank(data.tags),
        contentChordPro: data.contentChordPro,
        hasChords: songHasChords,
        notes: blank(data.notes),
        authorUserId: userId,
        recordCreatedBy: `User:${userId}`,
      })
      .returning({ publicId: songs.publicId });
  } else {
    const ip = await getClientIp();
    const limit = await checkGuestUploadLimit(ip);
    if (!limit.success) {
      return {
        ok: false,
        error: "Alcanzaste el límite de canciones por hora, intenta más tarde",
      };
    }

    const guestId = await getOrCreateGuestId();
    [created] = await db
      .insert(songs)
      .values({
        title: data.title,
        artist: blank(data.artist),
        originalKey: blank(data.originalKey),
        bpm,
        capo,
        genre: blank(data.genre),
        tags: blank(data.tags),
        contentChordPro: data.contentChordPro,
        hasChords: songHasChords,
        notes: blank(data.notes),
        authorGuestId: guestId,
        authorGuestName: blank(data.authorGuestName),
        recordCreatedBy: `Guest:${guestId.slice(0, 8)}`,
      })
      .returning({ publicId: songs.publicId });
  }

  revalidatePath("/canciones");

  return { ok: true, publicId: created?.publicId ?? "" };
}

export async function updateSongAction(
  publicId: string,
  input: UpdateSongInput,
): Promise<SimpleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitas iniciar sesión para editar" };
  }

  const parsed = updateSongSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const [song] = await db
    .select()
    .from(songs)
    .where(eq(songs.publicId, publicId))
    .limit(1);

  if (!song) return { ok: false, error: "Canción no encontrada" };

  const userId = Number(session.user.id);
  const isOwner = song.authorUserId === userId;
  const isSuperadmin = session.user.isSuperadmin;
  if (!isOwner && !isSuperadmin) {
    return { ok: false, error: "No tienes permiso para editar esta canción" };
  }

  const data = parsed.data;
  const bpm = data.bpm ? Number(data.bpm) : null;
  const blank = (v?: string) => (v && v.trim() ? v.trim() : null);

  await db
    .update(songs)
    .set({
      title: data.title,
      artist: blank(data.artist),
      originalKey: blank(data.originalKey),
      bpm,
      genre: blank(data.genre),
      tags: blank(data.tags),
      contentChordPro: data.contentChordPro,
      hasChords: hasChords(data.contentChordPro),
      notes: blank(data.notes),
      recordUpdatedTimesTamp: new Date(),
      recordModifiedBy: isSuperadmin && !isOwner ? `Superadmin:${userId}` : `User:${userId}`,
    })
    .where(eq(songs.id, song.id));

  revalidatePath("/canciones");
  revalidatePath(`/canciones/${publicId}`);

  return { ok: true };
}

export async function softDeleteSongAction(publicId: string): Promise<SimpleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitas iniciar sesión para eliminar" };
  }

  const [song] = await db
    .select()
    .from(songs)
    .where(eq(songs.publicId, publicId))
    .limit(1);

  if (!song) return { ok: false, error: "Canción no encontrada" };

  const userId = Number(session.user.id);
  const isOwner = song.authorUserId === userId;
  const isSuperadmin = session.user.isSuperadmin;
  if (!isOwner && !isSuperadmin) {
    return { ok: false, error: "No tienes permiso para eliminar esta canción" };
  }

  await db
    .update(songs)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      recordUpdatedTimesTamp: new Date(),
      recordModifiedBy: isSuperadmin && !isOwner ? `Superadmin:${userId}` : `User:${userId}`,
    })
    .where(eq(songs.id, song.id));

  revalidatePath("/canciones");

  return { ok: true };
}

export async function searchSongsAction(input: {
  q: string;
  filter: SongFilter;
  withChords?: boolean;
}): Promise<SongWithAuthor[]> {
  const session = await auth();
  const currentUserId = session?.user?.id ? Number(session.user.id) : null;
  const currentGuestId = await getCurrentGuestId();
  return searchSongs({
    q: input.q,
    filter: input.filter,
    withChords: input.withChords,
    currentUserId,
    currentGuestId,
  });
}

export async function searchArtistsAction(q: string): Promise<string[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];
  const pattern = `%${trimmed.replace(/[%_]/g, "")}%`;

  const rows = await db
    .selectDistinct({ artist: songs.artist })
    .from(songs)
    .where(
      and(
        eq(songs.isDeleted, false),
        like(songs.artist, pattern),
        ne(songs.artist, ""),
      ),
    )
    .orderBy(songs.artist)
    .limit(8);

  return rows
    .map((r) => r.artist)
    .filter((value): value is string => Boolean(value && value.trim()));
}

void sql;

export async function migrateGuestSongsAction(userId: number): Promise<{ migrated: number }> {
  const guestId = await getCurrentGuestId();
  if (!guestId) return { migrated: 0 };

  const orphans = await db
    .select({ id: songs.id })
    .from(songs)
    .where(and(eq(songs.authorGuestId, guestId), isNull(songs.authorUserId)));

  if (orphans.length === 0) return { migrated: 0 };

  await db
    .update(songs)
    .set({
      authorUserId: userId,
      authorGuestId: null,
      authorGuestName: null,
      recordUpdatedTimesTamp: new Date(),
      recordModifiedBy: `MigrateGuestSongs:${userId}`,
    })
    .where(and(eq(songs.authorGuestId, guestId), isNull(songs.authorUserId)));

  return { migrated: orphans.length };
}
