import { integer, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { generateReadableId, type IdPrefix } from "./id-helpers";

export function idColumns(prefix: IdPrefix) {
  return {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    publicId: uuid("public_id").notNull().unique().defaultRandom(),
    readableId: varchar("readable_id", { length: 20 })
      .notNull()
      .unique()
      .$defaultFn(() => generateReadableId(prefix)),
  };
}

export const auditColumns = {
  recordCreationTimeStamp: timestamp("record_creation_timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
  recordCreatedBy: varchar("record_created_by", { length: 255 }).notNull(),
  recordUpdatedTimesTamp: timestamp("record_updated_timestamp", { withTimezone: true }),
  recordModifiedBy: varchar("record_modified_by", { length: 255 }),
};
