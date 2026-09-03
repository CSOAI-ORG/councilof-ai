/**
 * GET /api/detector-interop — open, signed detector-interoperability matrix.
 *
 * EU AI Act Article 50 Code of Practice sets 2027-02-02 for interoperability
 * between detection mechanisms ("does detector D read mark M?"). This is the
 * neutral, open conformance matrix. HONESTY OVER APPEARANCE: we publish our own
 * CANNOT_READ cells first (the watermark layer we cannot decode), never faked.
 *
 * The matrix is Ed25519-signed as a standard in-toto/DSSE receipt IFF a board key
 * is bound; otherwise returned UNSIGNED with an honest note. Companion to
 * /api/detect. Ported from the .github reference harness (harness/server.py).
 */

import { MEASUREMENT_PREDICATE, toDsse, toInTotoStatement } from "./intoto";

interface Env {
  BOARD_ATTESTATION_KEY_PKCS8_B64?: string;
  ASSESS_SIGNING_KEY_PKCS8_B64?: string;
}

type Cell = { detector: string; mark: string; result: "READS" | "CANNOT_READ"; note: string };

const MATRIX: { schema: string; marks: string[]; detectors: string[]; cells: Cell[] } = {
  schema: "csoai.detector-interop/0.1",
  marks: ["c2pa", "synthid", "watermark-x", "fingerprint-y"],
  detectors: ["csoai-detect"],
  cells: [
    { detector: "csoai-detect", mark: "c2pa", result: "READS", note: "signed-metadata layer verified deterministically (see /api/detect)" },
    { detector: "csoai-detect", mark: "synthid", result: "CANNOT_READ", note: "watermark layer not decoded — declared, not faked (honesty gate)" },
    { detector: "csoai-detect", mark: "watermark-x", result: "CANNOT_READ", note: "no decoder" },
    { detector: "csoai-detect", mark: "fingerprint-y", result: "CANNOT_READ", note: "no decoder" },
  ],
};

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const payload: Record<string, unknown> = {
    ...MATRIX,
    stats: "Wilson intervals + SEPARATED/TIE/UNTESTED — never Elo",
    deadline: "EU AI Act Article 50 interoperability: 2027-02-02",
    contribute: "add a detector column or mark/case via PR; declare honestly what you cannot read",
    issued_at: new Date().toISOString(),
    issuer: "CSOAI Ltd (UK 16939677)",
  };

  const keyB64 = ctx.env.BOARD_ATTESTATION_KEY_PKCS8_B64 || ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64;
  let receipt: Record<string, unknown> = {
    unsigned: true,
    note: "no board key bound to this deployment — matrix returned UNSIGNED (honest gap, not a faked receipt)",
  };
  if (keyB64) {
    try {
      const der = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
      const stmt = await toInTotoStatement(payload, { subjectName: "detector-interop", predicateType: MEASUREMENT_PREDICATE });
      receipt = await toDsse(stmt, der, "did:web:csoai.org#board-attestation-1");
    } catch {
      receipt = { error: "board key present but unusable — operations must fix; no signature emitted" };
    }
  }

  return Response.json({ ...payload, receipt }, { headers: { "cache-control": "public, max-age=300" } });
};
