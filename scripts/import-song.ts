import { readFileSync } from "node:fs";
import { and, eq } from "drizzle-orm";
import { db } from "../database/drizzle";
import { songs, users } from "../database/schema";
import { hasChords } from "../lib/chordpro";
import { cleanCifraClub } from "../lib/chordpro/formats/cifraclub";

type ImportInput = {
  fixturePath: string;
  title: string;
  artist?: string;
  originalKey?: string;
  bpm?: number;
  capo?: number;
  genre?: string;
  tags?: string;
  notes?: string;
  authorEmail: string;
};

async function importSong(input: ImportInput) {
  const raw = readFileSync(input.fixturePath, "utf8");
  const cleaned = cleanCifraClub(raw);
  const content = cleaned.content;
  const detectedKey = cleaned.metadata.originalKey;
  const detectedCapo = cleaned.metadata.capo;

  const [author] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.authorEmail))
    .limit(1);

  if (!author) {
    throw new Error(`Author not found: ${input.authorEmail}`);
  }

  const [existing] = await db
    .select({ id: songs.id, publicId: songs.publicId })
    .from(songs)
    .where(and(eq(songs.title, input.title), eq(songs.isDeleted, false)))
    .limit(1);

  const finalKey = input.originalKey ?? detectedKey ?? null;
  const finalCapo = input.capo ?? detectedCapo ?? null;

  if (existing) {
    await db
      .update(songs)
      .set({
        artist: input.artist ?? null,
        originalKey: finalKey,
        bpm: input.bpm ?? null,
        capo: finalCapo,
        genre: input.genre ?? null,
        tags: input.tags ?? null,
        contentChordPro: content,
        hasChords: hasChords(content),
        notes: input.notes ?? null,
        recordUpdatedTimesTamp: new Date(),
        recordModifiedBy: "import-song",
      })
      .where(eq(songs.id, existing.id));
    console.log(
      `Updated ${input.title} (${existing.publicId}) key=${finalKey ?? "—"} capo=${finalCapo ?? "—"}`,
    );
    return;
  }

  const [created] = await db
    .insert(songs)
    .values({
      title: input.title,
      artist: input.artist ?? null,
      originalKey: finalKey,
      bpm: input.bpm ?? null,
      capo: finalCapo,
      genre: input.genre ?? null,
      tags: input.tags ?? null,
      contentChordPro: content,
      hasChords: hasChords(content),
      notes: input.notes ?? null,
      authorUserId: author.id,
      recordCreatedBy: "import-song",
    })
    .returning({ publicId: songs.publicId });

  console.log(
    `Created ${input.title} (${created!.publicId}) key=${finalKey ?? "—"} capo=${finalCapo ?? "—"}`,
  );
}

async function main() {
  await importSong({
    fixturePath: "lib/chordpro/fixtures/01-cifraclub-input.txt",
    title: "No dejes que",
    artist: "Caifanes",
    originalKey: "D",
    genre: "Rock",
    tags: "rock mexicano, caifanes",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });

  await importSong({
    fixturePath: "lib/chordpro/fixtures/02-cifraclub-input.txt",
    title: "Losing My Religion",
    artist: "R.E.M.",
    originalKey: "Am",
    genre: "Rock alternativo",
    tags: "rem, alternative, 90s",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });

  await importSong({
    fixturePath: "lib/chordpro/fixtures/03-cifraclub-input.txt",
    title: "Crimen",
    artist: "Gustavo Cerati",
    genre: "Rock",
    tags: "cerati, soda stereo, rock latino",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });

  await importSong({
    fixturePath: "lib/chordpro/fixtures/04-cifraclub-input.txt",
    title: "De música ligera",
    artist: "Soda Stereo",
    genre: "Rock",
    tags: "soda stereo, rock latino, 90s",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });

  await importSong({
    fixturePath: "lib/chordpro/fixtures/05-cifraclub-input.txt",
    title: "Me muero por conocerte",
    artist: "Alex Ubago",
    genre: "Pop",
    tags: "alex ubago, pop, balada",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });

  await importSong({
    fixturePath: "lib/chordpro/fixtures/06-cifraclub-input.txt",
    title: "No se va",
    artist: "Grupo Frontera",
    genre: "Cumbia",
    tags: "grupo frontera, cumbia, regional mexicano",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });

  await importSong({
    fixturePath: "lib/chordpro/fixtures/07-cifraclub-input.txt",
    title: "Life on Mars?",
    artist: "David Bowie",
    genre: "Rock",
    tags: "bowie, glam rock, 70s",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });

  await importSong({
    fixturePath: "lib/chordpro/fixtures/08-cifraclub-input.txt",
    title: "Lake Shore Drive",
    artist: "Aliotta Haynes Jeremiah",
    genre: "Rock",
    tags: "classic rock, 70s, chicago",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });

  await importSong({
    fixturePath: "lib/chordpro/fixtures/09-cifraclub-input.txt",
    title: "Wonderwall",
    artist: "Oasis",
    genre: "Rock",
    tags: "oasis, britpop, 90s",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });

  await importSong({
    fixturePath: "lib/chordpro/fixtures/10-cifraclub-input.txt",
    title: "Angels",
    artist: "Robbie Williams",
    genre: "Pop",
    tags: "robbie williams, pop, 90s",
    authorEmail: "jorge.rubio.rev@gmail.com",
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
