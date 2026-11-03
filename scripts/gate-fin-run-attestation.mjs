#!/usr/bin/env node
// gate-fin-run-attestation.mjs — work-plan row D17, engineering half.
//
// functions/api/_gspc_axes_fin.ts declares each financial axis's `run_attestation`
// as a TYPED STRING ("ED25519_SIGNED" / "CONTENT_ADDRESSED_UNSIGNED") beside an
// `evidence_url` pointing at the run artefact. A typed value where a pointer
// belongs: today the strings happen to tell the truth (run-v2 carries a full
// Ed25519 signature block; the other seven carry only a content_id), but nothing
// stopped the artefacts and the board from drifting apart silently — the same
// defect class the register already caught twice elsewhere.
//
// This gate derives each axis's attestation state FROM THE ARTEFACT BYTES and
// blocks when the declared string disagrees:
//
//   ED25519_SIGNED             — the artefact carries a signature block
//                                {alg: Ed25519, sig, pubkey} whose content_id
//                                equals the artefact's own content_id field.
//   CONTENT_ADDRESSED_UNSIGNED — the artefact carries a content_id and NO
//                                signature block.
//   missing artefact           — hard fail. A board row whose evidence cannot be
//                                read is not publishable.
//
// BOUNDARY, stated rather than hidden: this is a PRESENCE and CONSISTENCY check,
// not a cryptographic verification of the Ed25519 preimage — that stays with the
// witness/verify path. Closing D17 fully needs the seven unsigned run artefacts
// signed AND this field read from the bytes (owner-gated: B17, a bearer for
// /api/board-sign). Until then the string may not drift from the bytes.

import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "functions/api/_gspc_axes_fin.ts");
const PUBLIC = path.join(ROOT, "public");

const parseAxes = (ts) => {
  const axes = [];
  const re = /axis:\s*"([^"]+)"[\s\S]*?evidence_url:\s*"([^"]+)"[\s\S]*?run_attestation:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(ts)) !== null) {
    axes.push({ axis: m[1], evidence_url: m[2], declared: m[3] });
  }
  return axes;
};

const observedState = (artefact) => {
  if (!artefact || typeof artefact !== "object") return "MISSING_ARTEFACT";
  const hasContentId = typeof artefact.content_id === "string" && artefact.content_id.length > 0;
  const sig = artefact.signature;
  const sigOk =
    sig &&
    typeof sig === "object" &&
    sig.alg === "Ed25519" &&
    typeof sig.sig === "string" &&
    sig.sig.length > 0 &&
    typeof sig.pubkey === "string" &&
    sig.pubkey.length > 0 &&
    (!sig.content_id || sig.content_id === artefact.content_id);
  if (sigOk) return "ED25519_SIGNED";
  if (hasContentId) return "CONTENT_ADDRESSED_UNSIGNED";
  return "UNREADABLE_ARTEFACT";
};

const check = (tsPath = SRC, publicDir = PUBLIC) => {
  const ts = readFileSync(tsPath, "utf8");
  const axes = parseAxes(ts);
  if (!axes.length) return { ok: false, rows: [], error: "no axes parsed from the source" };
  const rows = axes.map(({ axis, evidence_url, declared }) => {
    const file = path.join(publicDir, evidence_url.replace(/^\//, ""));
    let artefact = null;
    let fileError = null;
    if (!existsSync(file)) fileError = "artefact not served at evidence_url";
    else {
      try {
        artefact = JSON.parse(readFileSync(file, "utf8"));
      } catch (e) {
        fileError = `unreadable JSON: ${e.message}`;
      }
    }
    const observed = fileError ? "MISSING_ARTEFACT" : observedState(artefact);
    return { axis, evidence_url, declared, observed, ok: declared === observed, fileError };
  });
  return { ok: rows.every((r) => r.ok), rows };
};

const selftest = () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "fin-attest-"));
  const results = [];
  const scenario = (name, ts, files, expectOk) => {
    const d = path.join(dir, name);
    mkdirSync(d, { recursive: true });
    for (const [rel, body] of Object.entries(files)) {
      const p = path.join(d, rel);
      mkdirSync(path.dirname(p), { recursive: true });
      writeFileSync(p, body);
    }
    const tsPath = path.join(d, "axes.ts");
    writeFileSync(tsPath, ts);
    const r = check(tsPath, d);
    results.push({ name, expectOk, gotOk: r.ok });
  };

  const signedBody = JSON.stringify({
    schema: "t", content_id: "aa".repeat(32),
    signature: { alg: "Ed25519", sig: "x".repeat(88), pubkey: "y".repeat(44), content_id: "aa".repeat(32) },
  });
  const unsignedBody = JSON.stringify({ schema: "t", content_id: "bb".repeat(32) });

  scenario(
    "match-signed",
    `x = [{ axis: "a", evidence_url: "/run-a.json", run_attestation: "ED25519_SIGNED" }]`,
    { "run-a.json": signedBody },
    true,
  );
  scenario(
    "drift-declared-signed-but-unsigned",
    `x = [{ axis: "a", evidence_url: "/run-a.json", run_attestation: "ED25519_SIGNED" }]`,
    { "run-a.json": unsignedBody },
    false,
  );
  scenario(
    "match-unsigned",
    `x = [{ axis: "a", evidence_url: "/run-a.json", run_attestation: "CONTENT_ADDRESSED_UNSIGNED" }]`,
    { "run-a.json": unsignedBody },
    true,
  );
  scenario(
    "missing-artefact",
    `x = [{ axis: "a", evidence_url: "/absent.json", run_attestation: "CONTENT_ADDRESSED_UNSIGNED" }]`,
    {},
    false,
  );

  rmSync(dir, { recursive: true, force: true });
  const bad = results.filter((r) => r.expectOk !== r.gotOk);
  for (const r of results) console.log(`  ${r.expectOk === r.gotOk ? "✓" : "✖"} ${r.name}: ok=${r.gotOk}`);
  if (bad.length) {
    console.error(`✖ fin-attestation selftest FAILED (${bad.length}/${results.length})`);
    return 1;
  }
  console.log(`✓ fin-attestation selftest: ${results.length}/${results.length} scenarios behave as documented`);
  return 0;
};

const main = () => {
  if (process.argv.includes("--selftest")) return selftest();
  const { ok, rows, error } = check();
  if (error) {
    console.error(`✖ fin-attestation: ${error}`);
    return 2;
  }
  for (const r of rows) {
    console.log(`  ${r.ok ? "✓" : "✖"} ${r.axis}  declared=${r.declared}  observed=${r.observed}${r.fileError ? `  (${r.fileError})` : ""}  ${r.evidence_url}`);
  }
  if (!ok) {
    console.error("✖ fin-attestation: the board's run_attestation strings disagree with the artefact bytes — fix the bytes or the board, never neither.");
    return 1;
  }
  console.log(`✓ fin-attestation: ${rows.length}/${rows.length} declared states match the artefact bytes`);
  return 0;
};

process.exit(main());
