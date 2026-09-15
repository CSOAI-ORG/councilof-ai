/**
 * Static entry for the Hugging Face Space build (spaces/gspc-board/evidence-index/).
 * Bundled by scripts/build-evidence-index-space.mjs. Reads https://councilof.ai
 * cross-origin (both readers send access-control-allow-origin: *).
 */
import cssText from "./style.css?inline";
import { mountEvidenceIndex } from "./mount";
import { DEFAULT_ORIGIN } from "./evidenceIndex";

const host = document.querySelector<HTMLElement>("[data-evidence-index]");
if (host) {
  mountEvidenceIndex(host, {
    cssText,
    origin: host.dataset.origin || DEFAULT_ORIGIN,
  });
}
