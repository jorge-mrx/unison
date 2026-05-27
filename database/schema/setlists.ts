import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";
import { users } from "./users";
import { groups } from "./groups";

export const setlists = pgTable("setlists", {
  ...idColumns(ID_PREFIXES.setlist),
  name: varchar("name", { length: 200 }).notNull(),
  eventDate: varchar("event_date", { length: 20 }),
  venue: varchar("venue", { length: 200 }),
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
