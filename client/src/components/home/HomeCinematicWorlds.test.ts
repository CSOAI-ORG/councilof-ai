import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CINEMATIC_VIDEO } from "./HomeCinematicWorlds";

const worlds = readFileSync(resolve(__dirname, "HomeCinematicWorlds.tsx"), "utf8");
const living = readFileSync(resolve(__dirname, "LivingStages.tsx"), "utf8");
const home = readFileSync(resolve(__dirname, "../../pages/HomeVerify.tsx"), "utf8");
const v3 = readFileSync(resolve(__dirname, "../../pages/NewHome-v3.tsx"), "utf8");

describe("cinematic three-world merge contract", () => {
  it("reserves one film path per world and wires the live homepage only", () => {
    expect(CINEMATIC_VIDEO.coliseum).toBe("/videos/csoai-coliseum-plunge.mp4");
    expect(CINEMATIC_VIDEO.harness).toBe("/videos/csoai-harness-plugin.mp4");
    expect(CINEMATIC_VIDEO.os).toBe("/videos/csoai-council-os.mp4");
    expect(home).toContain("<HomeCinematicWorlds");
    expect(home.indexOf("<LivingStages")).toBeLessThan(home.indexOf("<HomeCinematicWorlds"));
    expect(v3).not.toContain("HomeCinematicWorlds");
    expect(worlds).toContain("<LivingLaw");
    expect(worlds).toContain("<LiveBoard");
    expect(worlds.indexOf("<WorldCard world={arena}")).toBeLessThan(worlds.indexOf("<LivingLaw"));
    expect(worlds.indexOf("<LivingLaw")).toBeLessThan(worlds.indexOf("<WorldCard world={harness}"));
    expect(worlds.indexOf("<WorldCard world={harness}")).toBeLessThan(worlds.indexOf("<LiveBoard"));
    expect(worlds.indexOf("<LiveBoard")).toBeLessThan(worlds.indexOf("<WorldCard world={door}"));
    expect(worlds).toContain("Arena. Harness. Front door.");
    expect(worlds).toContain("/images/cinematic/coliseum-plunge.jpg");
    expect(worlds).toContain("/images/cinematic/harness-plugin.jpg");
    expect(worlds).toContain("/images/cinematic/council-os-lobby.jpg");
    expect(worlds).toContain('type.startsWith("video/")');
  });

  it("refuses the storyboard and press claims that are not true of the living board", () => {
    const shipped = worlds.slice(worlds.indexOf("const WORLDS"));
    expect(shipped).not.toMatch(/Six-axis|Dunder Mifflin|Munder-Difflin/i);
    expect(shipped).not.toMatch(/Axis 14|gated unmeasured|UNMEASURED/i);
    expect(shipped).not.toMatch(/all 22 measured|22\/22|pip install csoai/i);
    expect(shipped).not.toMatch(/certified organization|buy a rank|\/murder|\/difflin|\/mundrr/i);
    expect(shipped).toContain("GET /api/gspc");
    expect(shipped).toContain("Jail is measured");
    expect(shipped).toContain("TIE");
    expect(worlds).toContain("public_count");
  });

  it("uses unused clay plates for living law and the board band", () => {
    expect(living).toContain("/images/liveness_drift_engine.jpg");
    expect(living).toContain("/images/secure_evidence_vault.jpg");
    expect(living).not.toContain("/images/band/clock.png");
    const tail = living.slice(living.indexOf("export default function LivingStages"));
    expect(tail).not.toContain("<LivingLaw");
    expect(tail).not.toContain("<LiveBoard");
  });
});
