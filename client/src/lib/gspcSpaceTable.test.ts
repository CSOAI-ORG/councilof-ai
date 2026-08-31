import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");
const html = readFileSync(resolve(root, "spaces/gspc-board/index.html"), "utf8");
const js = readFileSync(resolve(root, "spaces/gspc-board/table.js"), "utf8");
const css = readFileSync(resolve(root, "spaces/gspc-board/style.css"), "utf8");
const readme = readFileSync(resolve(root, "spaces/gspc-board/README.md"), "utf8");
const blob = [html, js, css, readme].join("\n");

describe("gspc-board Space is a public findings desk", () => {
  it("opens an interactive ontology and a Bloomberg-style record on select", () => {
    expect(html).toContain("GSPC findings");
    expect(html).toContain('id="ontology"');
    expect(html).toContain('id="graph"');
    expect(html).toContain('id="board-table"');
    expect(html).toContain('id="desk"');
    expect(html).toContain('id="find-table"');
    expect(html).toContain('id="rec-table"');
    expect(html).toContain('id="honest-table"');
    expect(html).toContain('id="fleet"');
    expect(js).toContain("https://councilof.ai/api/gspc");
    expect(js).toContain("signed/card_index.json");
    expect(js).toContain("openAxis");
    expect(js).toContain("PILLARS");
    expect(js).toContain("This slot is published empty");
    expect(js).toContain("Measured floor");
    expect(js).toContain("per_model");
    expect(js).toContain("data-pillar");
    expect(readme).toContain("Public findings desk");
  });

  it("keeps the living-table depth as public findings, not a thinner stub", () => {
    expect(html).toContain('id="read"');
    expect(html).toContain('id="empty"');
    expect(html).toContain('id="health"');
    expect(html).toContain('id="census"');
    expect(html).toContain('id="doors"');
    expect(html).toContain('id="honesty"');
    expect(html).toContain('id="lookup"');
    expect(js).toContain("A listing is not a grade");
    expect(js).toContain("api/corrections");
    expect(js).toContain("hub-queue");
    expect(js).toContain("living-catalog");
    expect(js).toContain("measured_in_lane");
    expect(js).toContain("unparsed_rate");
    expect(js).toContain("cvar05_harm");
    expect(js).toContain("blobs=true");
    expect(css).toContain(".sheets.three");
    expect(css).toContain(".jump");
  });

  it("quotes the planted queue and signed snapshot without running ahead of the evidence", () => {
    expect(blob).toContain("Council of AI measures AI health");
    expect(blob).toContain("valid signed board snapshot");
    expect(js).toContain("subjects DISCOVERED in the planted queue");
    expect(js).toContain("Full Hub-scale paginated Speed 0 census is ready to run, not yet completed");
    expect(js).toContain("Rows behind the board");
    expect(js).toContain("Card v2");
    expect(js).toContain("do not yet bind a subject or weight-manifest digest");
    expect(js).not.toContain(">2,000,000");
    expect(js).not.toMatch(/MEASURED is a signed cell on a unique lineage/);
    expect(blob).not.toMatch(/Covering millions|we scored two million|covered millions/i);
  });

  it("keeps inner-work language off the public Space", () => {
    expect(blob).toMatch(/A rank is never sold/);
    expect(blob).not.toMatch(/A\+\+\+|100\/100|hundred-gate|Speed 1|watchlist|do-not|never say we scored|Claim we scored two million|board printer|XRPL stays DEVNET/i);
    expect(blob).not.toMatch(/rank for sale|buy a grade|£79|£499|Byzantine|22\/22|dorado|cibola|sovos/i);
    expect(blob).not.toMatch(/hub-queue is MEASURED/);
  });
});
