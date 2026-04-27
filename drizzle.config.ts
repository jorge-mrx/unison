import type { Config } from "drizzle-kit";

const dbUrl = process.env.DATABASE_URL ?? "file:./local.db";
const filePath = dbUrl.startsWith("file:") ? dbUrl.slice("file:".length) : dbUrl;

export default {
  schema: "./database/schema/index.ts",
  out: "./database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: filePath,
  },
  strict: true,
  verbose: true,
} satisfies Config;
