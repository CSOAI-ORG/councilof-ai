// 2026-10-07 (outward gate, Lane F). The footer is on every page, so what it says is said on the
// pages an outward email cites. Three things are held here:
//   1. no address in the footer (nor on /dispute, the objection route, nor in the /methodology/
//      note) is a bare mailto that Cloudflare's Email Address Obfuscation rewrites for readers
//      without JavaScript;
//   2. the footer does not call us an independent body while /research/cross-hardware-
//      reproducibility/ says, correctly, "Not independent. All runs are ours.", and no page body
//      under the footer says it either (the whole client tree is scanned, not a list of files);
//   3. the trust furniture is present: the entity line, the signed root, the corrections ledger
//      and how to verify a card offline.
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const footer = readFileSync(resolve(__dirname, "Footer.tsx"), "utf8");
const dispute = readFileSync(resolve(__dirname, "../pages/Dispute.tsx"), "utf8");
// The methodology note sits on /methodology/, which the Kaggle follow-up cites.
const methodNote = readFileSync(resolve(__dirname, "momentum/MomentumMethodNote.tsx"), "utf8");
const research = readFileSync(resolve(__dirname, "../pages/CrossHardwareReproducibility.tsx"), "utf8");
const code = (src: string) => src.replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
// What a reader can see: code() plus /* block */ and JSDoc comments, which also explain old wording.
const prose = (src: string) => code(src).replace(/\/\*[\s\S]*?\*\//g, "");
// "independent measurement body", "independent AI measurement body", across a line break too.
const INDEPENDENT_BODY = /independent\s+(?:AI\s+)?measurement\s+body/i;
const REPO = resolve(__dirname, "../../..");
const CLIENT_SRC = resolve(__dirname, "..");
function clientSources(dir = CLIENT_SRC): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) out.push(...clientSources(p));
    else if (/\.(tsx?|jsx?|json)$/.test(e.name) && !/\.(test|spec)\.[jt]sx?$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("footer trust furniture", () => {
  it("prints no bare mailto: every address sits inside <!--email_off--> or PlainEmail/EmailOff", () => {
    for (const src of [code(footer), code(dispute), code(methodNote)]) {
      expect(src).not.toMatch(/href=\{`mailto:/);
      // A literal mailto is allowed only directly inside the opt-out pair.
      const bare = [...src.matchAll(/href=["']mailto:/g)].filter(
        (m) => !src.slice(Math.max(0, (m.index ?? 0) - 20), m.index).includes("<!--email_off--><a "),
      );
      expect(bare).toEqual([]);
    }
    // The one mailto left in the footer is the icon link, built as markup inside the opt-out pair.
    const mailto = code(footer).match(/`<!--email_off--><a href="mailto:\$\{CONTACT_MAILBOX\}"/g) ?? [];
    expect(mailto).toHaveLength(1);
    expect(code(footer)).toContain("<PlainEmail");
  });

  it("does not claim independence the research page says we do not have", () => {
    expect(research).toMatch(/Not independent\./);
    expect(code(footer)).not.toMatch(INDEPENDENT_BODY);
    expect(code(footer)).toMatch(/not independent\s+checks/);
  });

  // The footer renders under every SPA page, so any page body that still calls us an independent
  // measurement body sits directly above the line that corrects it. The first version of this test
  // listed three files; the verifier then found the claim on /how-we-work/ in HomeStrengths.tsx
  // (card 01), which renders on that page and was not on the list. A list can miss the file that
  // renders, so this scans every client source file instead, plus the static 404 page.
  it("no client source file and no static 404 calls us an independent measurement body", () => {
    const files = clientSources();
    expect(files.map((f) => relative(CLIENT_SRC, f))).toContain("components/home/HomeStrengths.tsx");
    const hits = files.filter((f) => INDEPENDENT_BODY.test(prose(readFileSync(f, "utf8"))));
    expect(hits.map((f) => relative(REPO, f))).toEqual([]);
    expect(readFileSync(resolve(REPO, "public/404.html"), "utf8")).not.toMatch(INDEPENDENT_BODY);
  });

  it("the signed-receipts spec page says why its pinned author line still says it", () => {
    // The spec text is held byte-equal to the published draft (SignedReceiptsSpec.test.ts), so the
    // correction is on the page that renders it, under the footer, rather than in the pinned bytes.
    const spec = readFileSync(resolve(CLIENT_SRC, "data/signed-receipts-v1-SPEC.md"), "utf8");
    const page = prose(readFileSync(resolve(CLIENT_SRC, "pages/SignedReceiptsSpec.tsx"), "utf8"));
    expect(spec).toMatch(INDEPENDENT_BODY);
    expect(page).toContain('data-testid="spec-author-line-note"');
    expect(page).toMatch(/We no longer describe ourselves\s+that way/);
  });

  it("shows the entity, the signed root, the corrections ledger and the offline verify how-to", () => {
    const src = code(footer);
    expect(src).toContain("Registered in England & Wales No. 16939677");
    expect(src).toMatch(/href: '\/root\.json'/);
    expect(src).toMatch(/href: '\/corrections\/'/);
    expect(src).toMatch(/href: '\/signed\/HOW-TO-VERIFY\.md', label: 'Verify a card offline'/);
  });
});
