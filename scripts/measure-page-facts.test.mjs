// public/measure/index.html is a hand-written static page. Read on 18 Nov 2026 it said the current public
// root "has a pending OpenTimestamps calendar proof; it is not yet Bitcoin-anchored", while /api/state read
// ledgers.root.ots = CONFIRMED_BITCOIN for that root (as_of 2026-11-14T22:23:43Z, 453 leaves). A static
// page cannot follow a proof that upgrades after it is published, so it states no proof state of its own
// and links the live read, which also says what the proof covers.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(ROOT, "public/measure/index.html"), "utf8");

describe("/measure/ OpenTimestamps wording", () => {
  it("asserts no proof state of its own", () => {
    expect(page).not.toMatch(/pending OpenTimestamps|not yet Bitcoin-anchored|is Bitcoin-anchored/i);
  });

  it("links the live proof state and keeps the proof's scope", () => {
    expect(page).toContain('<a href="/api/state">/api/state</a>');
    expect(page).toMatch(/covers the root\.json bytes only/);
  });
});
