import { writeFileSync } from "node:fs";
import { freezeEastWest, DETERMINATION_BANNER, PACK_NOT, METHODOLOGY } from "../client/src/data/eastWest.ts";

const frozen = await freezeEastWest();
const pack = {
  kind: "csoai.east-west-pack/0.1",
  format: "multinational",
  banner: DETERMINATION_BANNER,
  not: PACK_NOT,
  card: frozen.card,
  crosswalk: frozen.crosswalk,
  method: METHODOLOGY,
};
writeFileSync("public/east-west/sample-pack.json", JSON.stringify(pack, null, 2));
console.log("sample-pack", frozen.card.contentHash.slice(0, 16), frozen.crosswalkHash.slice(0, 16));
