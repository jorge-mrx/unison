import { eq } from "drizzle-orm";
import { db } from "../database/drizzle";
import { songs } from "../database/schema";
import { hasChords } from "../lib/chordpro";

async function main() {
  const all = await db
    .select({ id: songs.id, content: songs.contentChordPro, current: songs.hasChords })
    .from(songs);

  let updated = 0;
  for (const row of all) {
    const computed = hasChords(row.content);
    if (computed !== row.current) {
      await db
        .update(songs)
        .set({
          hasChords: computed,
          recordUpdatedTimesTamp: new Date(),
          recordModifiedBy: "backfill-has-chords",
        })
        .where(eq(songs.id, row.id));
      updated++;
    }
  }
  console.log(`Scanned ${all.length} songs · updated ${updated}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
