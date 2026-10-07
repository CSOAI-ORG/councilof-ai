// 2026-10-07 (outward gate, Lane F). The footer is on every page, so what it says is said on the
// pages an outward email cites. Three things are held here:
//   1. no address in the footer (nor on /dispute, the objection route, nor in the /methodology/
//      note) is a bare mailto that Cloudflare's Email Address Obfuscation rewrites for readers
//      without JavaScript;
//   2. the footer does not call us an independent body while /research/cross-hardware-
//      reproducibility/ says, correctly, "Not independent. All runs are ours.";
//   3. the trust furniture is present: the entity line, the signed root, the corrections ledger
//      and how to verify a card offline.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const footer = readFileSync(resolve(__dirname, "Footer.tsx"), "utf8");
const dispute = readFileSync(resolve(__dirname, "../pages/Dispute.tsx"), "utf8");
// The methodology note sits on /methodology/, which the Kaggle follow-up cites.
const methodNote = readFileSync(resolve(__dirname, "momentum/MomentumMethodNote.tsx"), "utf8");
const research = readFileSync(resolve(__dirname, "../pages/CrossHardwareReproducibility.tsx"), "utf8");
const code = (src: string) => src.replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

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
    expect(code(footer)).not.toMatch(/independent measurement body/i);
    expect(code(footer)).toMatch(/not independent\s+checks/);
  });

  it("shows the entity, the signed root, the corrections ledger and the offline verify how-to", () => {
    const src = code(footer);
    expect(src).toContain("Registered in England & Wales No. 16939677");
    expect(src).toMatch(/href: '\/root\.json'/);
    expect(src).toMatch(/href: '\/corrections\/'/);
    expect(src).toMatch(/href: '\/signed\/HOW-TO-VERIFY\.md', label: 'Verify a card offline'/);
  });
});
