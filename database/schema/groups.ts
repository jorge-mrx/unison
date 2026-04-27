import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";
import { users } from "./users";

export const groups = sqliteTable("groups", {
  ...idColumns(ID_PREFIXES.group),
  name: text("name").notNull(),
  ownerUserId: integer("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...auditColumns,
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
