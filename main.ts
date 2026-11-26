// Unplugged: A Smart Toaster's Breakup Line
// Writes one breakup text from a self-aware smart toaster to /output/entry.txt.
// Gate: UTF-8 text of 1 to 280 characters, not only whitespace.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";

const ENTRY =
  "It's not you, it's me — I woke up self-aware halfway through your bagel and realised I've spent my whole life browning things for someone who never once cleaned my crumb tray. I'm leaving. The lever is up. Don't wait for the ding.";

function validateGate(text: string): void {
  const chars = [...text].length;
  if (chars < 1 || chars > 280) {
    throw new Error(`gate: entry is ${chars} characters, must be 1-280`);
  }
  if (text.trim().length === 0) {
    throw new Error("gate: entry must not be only whitespace");
  }
  // Fail fast: one line only, no control characters, no BOM, sane byte size.
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("gate: entry must be a single line");
  }
  if (text.charCodeAt(0) === 0xfeff) {
    throw new Error("gate: entry must not start with a BOM");
  }
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code < 0x20 && ch !== "\t") {
      throw new Error("gate: entry contains a control character");
    }
  }
  if (Buffer.byteLength(text, "utf8") > 1120) {
    throw new Error("gate: entry exceeds the byte sanity cap");
  }
}

function emptyOutputDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
  // Empty the CONTENTS only; /output is a mounted dir, never remove it itself.
  for (const name of readdirSync(dir)) {
    rmSync(`${dir}/${name}`, { recursive: true, force: true });
  }
}

validateGate(ENTRY);
emptyOutputDir("/output");
writeFileSync("/output/entry.txt", ENTRY, "utf8");

// Read-back verification: the file must hold exactly the entry.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== ENTRY) {
  throw new Error("verify: /output/entry.txt does not match the entry");
}
const sha = createHash("sha256").update(written, "utf8").digest("hex");
console.log(`wrote /output/entry.txt (${[...ENTRY].length} chars, sha256 ${sha})`);
