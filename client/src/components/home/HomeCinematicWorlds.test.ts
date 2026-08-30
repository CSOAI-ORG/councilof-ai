import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CINEMATIC_VIDEO } from "./HomeCinematicWorlds";

const worlds = readFileSync(resolve(__dirname, "HomeCinematicWorlds.tsx"), "utf8");
const home = readFileSync(resolve(__dirname, "../../pages/HomeVerify.tsx"), "utf8");
const v3 = readFileSync(resolve(__dirname, "../../pages/NewHome-v3.tsx"), "utf8");

describe("cinematic three-world merge contract", () => {
  it("reserves one film path per world and wires the live homepage only", () => {
    expect(CINEMATIC_VIDEO.coliseum).toBe("/videos/csoai-coliseum-plunge.mp4");
    expect(CINEMATIC_VIDEO.harness).toBe("/videos/csoai-harness-plugin.mp4");
    expect(CINEMATIC_VIDEO.os).toBe("/videos/csoai-council-os.mp4");
    expect(home).toContain("<HomeCinematicWorlds");
    expect(v3).not.toContain("HomeCinematicWorlds");
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
});
