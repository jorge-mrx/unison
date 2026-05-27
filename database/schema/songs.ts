import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";
import { users } from "./users";

export const songs = sqliteTable(
  "songs",
  {
    ...idColumns(ID_PREFIXES.song),
    title: text("title").notNull(),
    artist: text("artist"),
    originalKey: text("original_key"),
    bpm: integer("bpm"),
    capo: integer("capo"),
    genre: text("genre"),
    tags: text("tags"),
    contentChordPro: text("content_chord_pro").notNull(),
    hasChords: integer("has_chords", { mode: "boolean" }).notNull().default(false),
    notes: text("notes"),
    authorUserId: integer("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    authorGuestId: text("author_guest_id"),
    authorGuestName: text("author_guest_name"),
    isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
    ...auditColumns,
  },
  (t) => [
    index("songs_title_idx").on(t.title),
    index("songs_artist_idx").on(t.artist),
    index("songs_author_user_idx").on(t.authorUserId),
    index("songs_author_guest_idx").on(t.authorGuestId),
    index("songs_is_deleted_idx").on(t.isDeleted),
    index("songs_has_chords_idx").on(t.hasChords),
  ],
);

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;
