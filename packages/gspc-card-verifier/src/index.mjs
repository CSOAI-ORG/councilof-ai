export { verifyCard, analyseSet, analyseChain, STATES } from "./verify.mjs";
export { canonicalise, canonicalString, preimageBytes, OutOfProfileDomain, NotSerialisable } from "./canonical.mjs";
export { pubkeyFromDidDocument } from "./did.mjs";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** The bundled Council of AI profile. Pass your own object to verify your own cards. */
export function defaultProfile() {
  const here = dirname(fileURLToPath(import.meta.url));
  return JSON.parse(readFileSync(join(here, "..", "profile", "csoai-gspc-1.json"), "utf8"));
}
