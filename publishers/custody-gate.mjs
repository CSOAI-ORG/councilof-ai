#!/usr/bin/env node
/**
 * custody-gate — NEXT_300 #168 · #291 · #292
 *
 * Fail closed before any `--publish` path:
 * - CSOAI_KEY_CUSTODY must be set (KMS / Turnkey / HSM per compliance/key-custody-decision.md)
 * - demo-play targets (play: "demo") refused unless explicitly labeled demo — never production MEASURED mainnet
 *
 * Import from future publisher scripts; linted by scripts/demo-play-refuse-lint.mjs
 */

/** @param {{ play?: string; slug?: string }} target */
export function refuseDemoPlay(target) {
  if (target?.play === "demo") {
    throw new Error(
      "fail closed on demo play: demo-only targets (e.g. justoken-jmwh) refused — never mainnet production publish",
    );
  }
}

/** Fail closed on custody miss — required before `--publish`. */
export function assertCustodyForPublish() {
  const custody = process.env.CSOAI_KEY_CUSTODY;
  if (!custody || !String(custody).trim()) {
    throw new Error(
      "fail closed on custody miss: set CSOAI_KEY_CUSTODY before --publish (see compliance/key-custody-decision.md)",
    );
  }
  return custody;
}

/** @param {{ play?: string; slug?: string }} target */
export function guardPublish(target) {
  refuseDemoPlay(target);
  return assertCustodyForPublish();
}
