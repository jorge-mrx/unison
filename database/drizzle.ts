import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const dbUrl = process.env.DATABASE_URL ?? "file:./local.db";
const filePath = dbUrl.startsWith("file:") ? dbUrl.slice("file:".length) : dbUrl;

const sqlite = new Database(filePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite);
export type DB = typeof db;
