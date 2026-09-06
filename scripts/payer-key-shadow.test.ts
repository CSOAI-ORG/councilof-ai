import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * WHY THIS EXISTS (2026-09-06). x402-settlement-census.py read the payer key into a variable called
 * `key`, and forty lines later the candidate-selection loop rebound the SAME NAME to a hostname:
 *
 *     key = os.environ.get("X402_PAYER_KEY")     # line 104
 *     ...
 *     key = r["probe_url"] if a.url else r["host"]   # line 126
 *     ...
 *     sign_payload(ch, url, key)                 # line 157  <- a hostname
 *
 * eth_account raised "Non-hexadecimal digit found" on the first host of the first SETTLE run. The
 * key file was perfect: 64 bytes, one line, pure hex.
 *
 * What makes it worth a permanent guard is WHERE it hid. The DRY branch returns before
 * sign_payload, so a full 316-host dry run passed clean — the rehearsal that exists to catch this
 * could not reach the line. Only spending real money reveals it, which is the worst possible place
 * for a first encounter.
 */
const SRC = readFileSync(
  resolve(__dirname, "grants/x402-settlement-census.py"), "utf8",
);

describe("the payer key is never shadowed on the money path", () => {
  it("is read into a distinctly named variable", () => {
    const m = SRC.match(/^\s*(\w+)\s*=\s*os\.environ\.get\(\s*["']X402_PAYER_KEY["']\s*\)/m);
    expect(m, "the script no longer reads X402_PAYER_KEY — this guard has lost its subject").toBeTruthy();
    const name = m![1];
    expect(name, "a secret called `key` collides with every dict-key idiom in the file").not.toBe("key");
    expect(name).toMatch(/payer/i);
  });

  it("that variable is assigned exactly once", () => {
    const m = SRC.match(/^\s*(\w+)\s*=\s*os\.environ\.get\(\s*["']X402_PAYER_KEY["']\s*\)/m);
    const name = m![1];
    // any other binding of the same name is the bug returning
    const assigns = [...SRC.matchAll(new RegExp(`^\\s*${name}\\s*=(?!=)`, "gm"))];
    expect(assigns.length, `${name} is assigned ${assigns.length} times; the shadow is back`).toBe(1);
  });

  it("is what sign_payload is actually called with", () => {
    const m = SRC.match(/^\s*(\w+)\s*=\s*os\.environ\.get\(\s*["']X402_PAYER_KEY["']\s*\)/m);
    const name = m![1];
    // match the CALL, not `def sign_payload(ch, resource, key)` — the definition's last
    // parameter is legitimately named `key` and matching it flagged a fix that was correct.
    const call = SRC.match(/(?<!def )sign_payload\(([^)]*)\)/);
    expect(call, "sign_payload is never called").toBeTruthy();
    expect(call![1].split(",").map((s) => s.trim()).at(-1)).toBe(name);
  });

  it("the DRY branch still returns before any signing, so DRY can never spend", () => {
    const dryIdx = SRC.indexOf('rec.update(status="DRY")');
    const signIdx = SRC.search(/(?<!def )sign_payload\(ch/);
    expect(dryIdx).toBeGreaterThan(0);
    expect(signIdx).toBeGreaterThan(0);
    expect(dryIdx, "DRY must short-circuit before the signer, or a dry run could move money")
      .toBeLessThan(signIdx);
  });
});
