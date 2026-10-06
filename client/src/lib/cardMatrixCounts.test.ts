import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// public/signed/card-matrix.json is produced by scripts/build-card-matrix.mjs at build time.
const matrix = JSON.parse(readFileSync(resolve(__dirname, "../../../public/signed/card-matrix.json"), "utf8"));
const page = readFileSync(resolve(__dirname, "../pages/MeasuredModels.tsx"), "utf8");

describe("card matrix: the own-model split adds up", () => {
  it("third_party + own + own_unconfirmed == models", () => {
    const c = matrix.counts;
    for (const k of ["models", "models_third_party", "models_own", "models_own_unconfirmed"]) expect(typeof c[k], k).toBe("number");
    expect(c.models_third_party + c.models_own + c.models_own_unconfirmed).toBe(c.models);
  });
  it("/board/models quotes the third-party figure as 'Models measured', with ours listed apart", () => {
    expect(page).toMatch(/\["Models measured", c\.models_third_party,/);
    expect(page).toMatch(/our own \$\{c\.models_own\} \(\+\$\{c\.models_own_unconfirmed\} unconfirmed\) are in this set and listed apart/);
  });
});
