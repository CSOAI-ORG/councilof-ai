/**
 * hub-results.test.mjs — the published Hub population, and the trap inside it.
 *
 * WP-2 asks for published Hugging Face results to be exposed visibly, with filters and
 * provenance, and for mill-card cohorts to sit in a clearly labelled results view rather
 * than being joined into the board rankings.
 *
 * Probed 2026-09-05, GET /api/hub-cards serves 699 signed cells over 13 axes and 79
 * third-party models, carrying its own population statement, source dataset, observation
 * date and an `honesty` block. Nothing in client/ read it until this change; the `results`
 * rail tab rendered HomeGspcBoard, the same component as `board`.
 *
 * THE INVARIANT THIS FILE DEFENDS is not "the endpoint answers". It is that an UNMEASURED
 * cell carries an accuracy anyway — 70 of 699 do, every one signed, held back by reasons
 * such as "signed-pending-verify". That is why the client may not print `accuracy` without
 * first reading `status`. If the producer ever stops shipping those cells, this test says
 * so out loud rather than letting the client-side guard quietly become decoration.
 *
 * Offline by default. LIVE_HUB=1 re-probes; a skipped probe is reported, never passed.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const read = (p) => readFileSync(path.join(repo, p), "utf8");

describe("published Hub results are rendered, and not as the board", () => {
  it("the results pane reads /api/hub-cards rather than the board endpoint", () => {
    const hook = read("client/src/components/hub/useHubCards.ts");
    assert.match(hook, /\/api\/hub-cards/, "the hook must read the Hub projection");
    assert.ok(
      !/\/api\/gspc/.test(hook),
      "the Hub population must not be sourced from the board endpoint — they are " +
        "different populations and joining them is exactly what WP-2 forbids",
    );
  });

  it("the results tab no longer renders the board component", () => {
    const panes = read("client/src/components/DashboardPane.tsx");
    const line = panes.split("\n").find((l) => /^\s*results:/.test(l));
    assert.ok(line, "no `results:` entry in the pane map");
    assert.ok(
      !/HomeGspcBoard/.test(line),
      "`results` is mapped back to HomeGspcBoard. `board` already renders it, so this " +
        "is two rail tabs onto one component and a tab labelled Benchmark results that " +
        "serves the 22-axis board.",
    );
  });

  it("the accuracy of a non-MEASURED cell is withheld at the source", () => {
    const hook = read("client/src/components/hub/useHubCards.ts");
    assert.match(
      hook,
      /status !== "MEASURED"[\s\S]{0,40}return null/,
      "displayAccuracy must return null for any status that is not exactly MEASURED. " +
        "A pending cell carries a number; printing it publishes it as a result.",
    );
  });

  it("the tab blurb describes the Hub population, not the board", () => {
    const tabs = read("client/src/components/lobby/tabs.ts");
    const i = tabs.indexOf('id: "results"');
    assert.ok(i > 0, "no results tab");
    const blurb = tabs.slice(i, i + 500);
    assert.ok(
      !/canonical living GSPC board/.test(blurb),
      "the results tab still describes itself as the GSPC board",
    );
  });

  it("live: UNMEASURED cells still carry an accuracy, so the guard is still needed", async () => {
    if (!process.env.LIVE_HUB) {
      console.log("      (offline: LIVE_HUB unset — /api/hub-cards NOT re-probed)");
      return;
    }
    const res = await fetch("https://councilof.ai/api/hub-cards");
    assert.ok(res.ok, `/api/hub-cards HTTP ${res.status}`);
    const d = await res.json();

    for (const f of ["population", "source", "as_of", "honesty", "counts", "cells"]) {
      assert.ok(d[f], `/api/hub-cards no longer carries ${f} — provenance would go blank`);
    }
    assert.ok(Array.isArray(d.cells) && d.cells.length > 0, "no cells served");

    const unmeasured = d.cells.filter((c) => c.status !== "MEASURED");
    assert.ok(
      unmeasured.length > 0,
      "no UNMEASURED cells are being served. If the producer has genuinely cleared them " +
        "that is good news, but this guard can no longer prove the client-side status " +
        "check works — confirm deliberately before relaxing anything.",
    );
    const withNumber = unmeasured.filter((c) => typeof c.accuracy === "number");
    assert.ok(
      withNumber.length > 0,
      "UNMEASURED cells no longer carry an accuracy. The trap may be gone at the source; " +
        "verify before trusting any renderer that prints accuracy without reading status.",
    );

    // The population must stay distinguishable from the board in the payload's own words.
    assert.match(String(d.population), /NOT the CSOAI fleet/i);
    assert.match(String(d.honesty.not_the_board ?? ""), /not the 22-axis board/i);
  });
});
