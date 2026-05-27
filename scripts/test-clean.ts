import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { autoFormatPastedText } from "../lib/chordpro";

const FIXTURES_DIR = "lib/chordpro/fixtures";

const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith("-input.txt"));

let pass = 0;
let fail = 0;

for (const inputFile of files.sort()) {
  const slug = inputFile.replace("-input.txt", "");
  const inputPath = join(FIXTURES_DIR, inputFile);
  const expectedPath = join(FIXTURES_DIR, `${slug}-expected.chordpro`);
  const input = readFileSync(inputPath, "utf8");
  const got = autoFormatPastedText(input);

  if (!existsSync(expectedPath)) {
    console.log(`\n=== ${slug} (no expected, dry run) ===\n${got}`);
    continue;
  }

  const expected = readFileSync(expectedPath, "utf8");
  if (got === expected) {
    console.log(`OK ${slug}`);
    pass++;
  } else {
    console.log(`\n=== FAIL ${slug} ===`);
    console.log("--- expected ---");
    console.log(expected);
    console.log("--- got ---");
    console.log(got);
    fail++;
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
