import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";
import { setlists } from "./setlists";
import { songs } from "./songs";

export const setlistSongs = sqliteTable(
  "setlist_songs",
  {
    ...idColumns(ID_PREFIXES.setlistSong),
    setlistId: integer("setlist_id")
      .notNull()
      .references(() => setlists.id, { onDelete: "cascade" }),
    songId: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    keyOverride: text("key_override"),
    setlistSpecificNotes: text("setlist_specific_notes"),
    ...auditColumns,
  },
  (t) => [
    index("setlist_songs_setlist_idx").on(t.setlistId),
    index("setlist_songs_song_idx").on(t.songId),
    uniqueIndex("setlist_songs_setlist_position_uq").on(t.setlistId, t.position),
  ],
);

export type SetlistSong = typeof setlistSongs.$inferSelect;
export type NewSetlistSong = typeof setlistSongs.$inferInsert;
