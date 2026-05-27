import { boolean, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";
import { users } from "./users";

export const songs = pgTable(
  "songs",
  {
    ...idColumns(ID_PREFIXES.song),
    title: varchar("title", { length: 300 }).notNull(),
    artist: varchar("artist", { length: 200 }),
    originalKey: varchar("original_key", { length: 10 }),
    bpm: integer("bpm"),
    capo: integer("capo"),
    genre: varchar("genre", { length: 100 }),
    tags: varchar("tags", { length: 500 }),
    contentChordPro: text("content_chord_pro").notNull(),
    hasChords: boolean("has_chords").notNull().default(false),
    notes: text("notes"),
    authorUserId: integer("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    authorGuestId: varchar("author_guest_id", { length: 100 }),
    authorGuestName: varchar("author_guest_name", { length: 200 }),
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
