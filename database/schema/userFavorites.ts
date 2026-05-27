import { integer, pgTable, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";
import { users } from "./users";
import { songs } from "./songs";

export const userFavorites = pgTable(
  "user_favorites",
  {
    ...idColumns(ID_PREFIXES.favorite),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    songId: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    favoritedAt: timestamp("favorited_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...auditColumns,
  },
  (t) => [uniqueIndex("user_favorites_user_song_uq").on(t.userId, t.songId)],
);

export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
