import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";

export const users = sqliteTable("users", {
  ...idColumns(ID_PREFIXES.user),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  isSuperadmin: integer("is_superadmin", { mode: "boolean" }).notNull().default(false),
  ...auditColumns,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
