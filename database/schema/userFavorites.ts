import { integer, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";
import { users } from "./users";
import { songs } from "./songs";

export const userFavorites = sqliteTable(
  "user_favorites",
  {
    ...idColumns(ID_PREFIXES.favorite),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    songId: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    favoritedAt: integer("favorited_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    ...auditColumns,
  },
  (t) => [uniqueIndex("user_favorites_user_song_uq").on(t.userId, t.songId)],
);

export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
