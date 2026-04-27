import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";
import { users } from "./users";
import { groups } from "./groups";

export const setlists = sqliteTable("setlists", {
  ...idColumns(ID_PREFIXES.setlist),
  name: text("name").notNull(),
  eventDate: text("event_date"),
  venue: text("venue"),
  notes: text("notes"),
  ownerUserId: integer("owner_user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  ownerGroupId: integer("owner_group_id").references(() => groups.id, {
    onDelete: "cascade",
  }),
  ...auditColumns,
});

export type Setlist = typeof setlists.$inferSelect;
export type NewSetlist = typeof setlists.$inferInsert;
