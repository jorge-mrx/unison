import { boolean, pgTable, varchar } from "drizzle-orm/pg-core";
import { idColumns, auditColumns } from "./_columns";
import { ID_PREFIXES } from "./id-helpers";

export const users = pgTable("users", {
  ...idColumns(ID_PREFIXES.user),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isSuperadmin: boolean("is_superadmin").notNull().default(false),
  ...auditColumns,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
