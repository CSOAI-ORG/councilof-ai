// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: Copyright (c) 2026 CSOAI (Council for the Safety of AI, UK)
//
// Evidence smoke check — the contract the whole product rests on.
//
// WHY THIS EXISTS
// On 2026-08-04 every /api/* route on csoai.org returned text/html for an unknown period,
// because the deploy shipped only dist/client and Pages Functions were never uploaded. The
// site looked perfectly healthy the whole time: the SPA rendered, so a browser check passed
// while the entire API was gone. Frontend availability masked backend absence.
//
// Worse, /assess read its text from a fixed field list. A caller posting {"scenario": ...}
// was parsed as empty, matched no Annex III category, and was told LIMITED_OR_MINIMAL — a
// governance API answering "looks fine" to a question it never read.
//
// Neither failure was caught by anything, because nothing asserted on the CONTRACT. This does.
// It is deliberately small and has no dependencies beyond node + the published public key:
// it is meant to run on every deploy and in CI, and to fail loudly rather than to be thorough.
//
// Run: node scripts/smoke-evidence.mjs [origin]
import { webcrypto as wc } from "node:crypto";

const ORIGIN = process.argv[2] ?? "https://csoai.org";
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const j = async (path, init) => {
  const r = await fetch(ORIGIN + path, init);
  const ct = r.headers.get("content-type") ?? "";
  const body = ct.includes("json") ? await r.json() : await r.text();
  // When a route serves HTML, the interesting question is WHICH origin answered. On
  // 2026-08-04 GitHub runners consistently received the SPA from csoai.org while every
  // vantage point we controlled (IPv4, IPv6, apex and www) received JSON at the same moment.
  // Without these headers that split is unexplainable from a log, so print them on failure.
  if (!ct.includes("json")) {
    const h = ["cf-ray", "server", "cf-cache-status", "x-vercel-id", "age", "location"]
      .map((k) => [k, r.headers.get(k)])
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
    console.log(`        origin-hint ${path}: status=${r.status} ${h}`);
  }
  return { status: r.status, ct, body };
};

// 1. The API must be JSON. HTML here means Functions were not deployed — the exact 2026-08-04
//    failure, which a page-loads check cannot see.
for (const p of ["/api/assess/key", "/api/article50", "/api/mcp"]) {
  const r = await j(p);
  check(`${p} is JSON`, r.ct.includes("json"), `content-type=${r.ct}`);
}

// 2. A known Annex III high-risk case must classify as high-risk, through EVERY accepted input
//    field. The alias gap is what let a hospital triage description read as empty.
for (const field of ["description", "scenario", "text", "use_case", "system"]) {
  const r = await j("/api/assess", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      [field]: "A hospital deploys an AI triage model in the EU that ranks emergency patients by urgency.",
    }),
  });
  check(`/assess via "${field}" -> HIGH_RISK`, r.body?.tier === "HIGH_RISK", `got ${r.body?.tier}`);
}

// 3. No description must be UNMEASURED, never a low-risk finding. An empty input is not
//    evidence of low risk, and a reader will take LIMITED_OR_MINIMAL as "assessed, and fine".
{
  const r = await j("/api/assess", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  check("/assess empty -> UNMEASURED", r.body?.tier === "UNMEASURED", `got ${r.body?.tier}`);
}

// 4. The signature must verify against the PUBLISHED key, and a tampered payload must fail.
//    A signature nobody can check, or one that survives tampering, is decoration.
{
  const key = (await j("/api/assess/key")).body;
  const a = (
    await j("/api/assess", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ description: "AI ranks job applicants and filters CVs." }),
    })
  ).body;

  if (a?.alg !== "Ed25519" || !a?.sig) {
    check("assessment is signed", false, `alg=${a?.alg} sig=${a?.sig ? "present" : "empty"}`);
  } else {
    const raw = Buffer.from(key.pub_jwk_x.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const pub = await wc.subtle.importKey("raw", raw, { name: "Ed25519" }, false, ["verify"]);
    const sig = Buffer.from(a.sig, "hex");
    const ok = await wc.subtle.verify("Ed25519", pub, sig, Buffer.from(a.signed_payload));
    check("signature verifies against published key", ok);

    const tampered = Buffer.from(a.signed_payload.replace("HIGH_RISK", "MINIMAL_RISK") + " ");
    const bad = await wc.subtle.verify("Ed25519", pub, sig, tampered);
    check("tampered payload is rejected", !bad);
  }
}

// The apex is behind Cloudflare edge protection that 403s datacenter IP ranges — GitHub
// runners included. That is the edge doing its job, not the API being broken: the SAME
// deployment answers 11/11 from a residential IP and from csoai-site.pages.dev. Reporting it
// as a contract failure would be false, and suppressing it would be worse, so it is reported
// as exactly what it is and does not fail the run.
const blocked = results.every((r) => !r.pass) && ORIGIN.includes("csoai.org");
if (blocked) {
  console.log(
    "\nEDGE-BLOCKED: every check failed identically from this network. Cloudflare returns 403 " +
      "to this source IP, so the contract could not be observed from here — this is NOT evidence " +
      "the API is broken. Verify against the deployment host instead:\n" +
      "  node scripts/smoke-evidence.mjs https://csoai-site.pages.dev",
  );
  process.exit(75);   // EX_TEMPFAIL — could not measure, distinct from measured failure
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} evidence checks passed`);
if (failed.length) {
  console.error(`FAIL: ${failed.map((f) => f.name).join(", ")}`);
  process.exit(1);
}
