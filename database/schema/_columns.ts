import { integer, text } from "drizzle-orm/sqlite-core";
import { generatePublicId, generateReadableId, type IdPrefix } from "./id-helpers";

export function idColumns(prefix: IdPrefix) {
  return {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicId: text("public_id").notNull().unique().$defaultFn(generatePublicId),
    readableId: text("readable_id")
      .notNull()
      .unique()
      .$defaultFn(() => generateReadableId(prefix)),
  };
}

export const auditColumns = {
  recordCreationTimeStamp: integer("record_creation_timestamp", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  recordCreatedBy: text("record_created_by").notNull(),
  recordUpdatedTimesTamp: integer("record_updated_timestamp", { mode: "timestamp" }),
  recordModifiedBy: text("record_modified_by"),
};
