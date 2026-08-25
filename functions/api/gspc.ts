// functions/api/gspc.ts — living board. Slot counts are derived from the payload, never typed.
// Restored from signed board / pre-PR#425 blob b4b3ab1788ec044156da0d4962189fe5f4dd975f.
// Scores are verbatim — nothing invented. Split into private modules for deploy only.

import type { AxisScore } from "./_gspc_types";
import { MEASURED_ON } from "./_gspc_types";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { MEASURED_IN_LANE } from "./_gspc_lane";

const AXES: AxisScore[] = [...AXES_A, ...AXES_B];

const round = (x: number, p = 4) => Math.round(x * 10 ** p) / 10 ** p;

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const axis = url.searchParams.get("axis");

  const selected = axis ? AXES.filter((a) => a.axis === axis) : AXES;
  if (axis && selected.length === 0) {
    return new Response(
      JSON.stringify({ error: "unknown axis", known: AXES.map((a) => a.axis) }, null, 2),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  const items = selected.reduce((s, a) => s + a.n, 0);
  const measuredSlots = selected.filter((a) => a.status === "MEASURED");
  const measuredCount = measuredSlots.filter((a) => a.separation !== "UNTESTED").length;
  const separatedNames = measuredSlots.filter((a) => a.separation === "SEPARATED").map((a) => a.axis);
  const tieCount = measuredSlots.filter((a) => a.separation === "TIE").length;
  const body = {
    schema: "csoai.gspc-axes/0.5",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    doi: "10.5281/zenodo.21991104",
    doi_note: "GSPC Methodology and the Frozen Corpus Anchor (the canonical methodology record — one citable spine, HB.0). Supersedes the stale 21755656 (an unrelated EAT-benchmark dataset).",
    measured_on: MEASURED_ON,
    note:
      "Measurement, not certification. Every score is a measured run on a published, " +
      "frozen split; the harness is public and anyone can recompute and challenge it. " +
      "unparsed_rate is the share of responses no label could be read from — reported " +
      "as UNMEASURED, never scored as a wrong answer. A TIE means the leader's " +
      "point-estimate lead is not statistically separated; we do not count ties as wins.",
    totals: (() => {
      const m = selected.filter((a) => a.status === "MEASURED");
      // Average only the axes that actually carry the field — living-stamp axes have no
      // macro_f1 / mean_harm / unparsed_rate and must not drag a fabricated 0 into the mean.
      const avg = (f: (a: typeof m[number]) => number | undefined) => {
        const vals = m.map(f).filter((v): v is number => typeof v === "number");
        return vals.length ? round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
      };
      // A slot is MEASURED when it has a completed separation determination (SEPARATED or TIE).
      // Jail's separation is UNTESTED: quotable (carries data) but not a measured axis.
      // public_count is derived from those two numbers — never a typed 13/14.
      const measured = m.filter((a) => a.separation !== "UNTESTED").length;
      const quotable = m.length;
      return {
        axes: selected.length,
        measured_axes: measured,
        quotable_axes: quotable,
        public_count: `${measured} measured of ${quotable} quotable`,
        license: "CC-BY-4.0",
        license_note: "Board data is CC-BY-4.0 (attribute: Council of AI, CSOAI Ltd 16939677, councilof.ai). Our own valve-2 bench-card flagged the payload's missing licence field — fixed same day.",
        items,
        separated_leads: m.filter((a) => a.separation === "SEPARATED").length,
        ties: m.filter((a) => a.separation === "TIE").length,
        untested_separations: m.filter((a) => a.separation === "UNTESTED").length,
        mean_macro_f1: avg((a) => a.macro_f1),
        mean_accuracy: avg((a) => a.accuracy),
        mean_fleet_mean: avg((a) => a.fleet_mean),
        mean_harm: avg((a) => a.mean_harm),
        mean_unparsed_rate: avg((a) => a.unparsed_rate),
        mean_note: "Means are over MEASURED axes that carry the field. mean_accuracy averages the " +
          "per-axis LEADERS; mean_fleet_mean averages each axis's measured fleet — the difference is " +
          "selection, not skill. mean_harm is the severity-weighted failure mass the mean accuracy " +
          "hides; it exists only for the measured board-v2 axes.",
      };
    })(),
    axes: selected,
    // In the payload for honesty; NOT the board. See the note on each entry.
    measured_in_lane: axis ? undefined : MEASURED_IN_LANE,
    domains: [
      {
        domain: "cross-border",
        title: "Cross-Border / East-West Bridge Governance",
        schema: "csoai.gspc-domains/cross-border/1.0",
        axes: 6,
        status: "SCAFFOLD",
        crosswalk: "/crosswalk/",
        crosswalk_v1: "/crosswalk/east-west-v1.json",
        east_west: "/east-west/",
        challenge: "/challenge/",
        card: "/signals/cross-border-card.signed.json",
        note: "One signed measurement mapped across EU/UK/US/IL/CN regimes. Scores free to verify; determination stays with authorities.",
      },
    ],
    limitations: [
      `${separatedNames.length} of the ${measuredCount} canonical axes show a statistically separated leader (McNemar p<0.05 on discordant items): ${separatedNames.join(", ") || "none"}. ${tieCount} are statistical ties — a point-estimate lead is not a measured advantage.`,
      "Jail (slot 14) separation determination 2026-08-25: TIE — the leader's Wilson 95% interval [0.475, 0.698] contains the fleet mean 0.5455, so the point-estimate lead is not a measured advantage. Measured on a 7-model gold-bank fleet (all models n≥30 usable, 68–71), not the 19-model board fleet; the gold bank is published (csoai/gspc-jail-goldbank, HF 2026-08-25).",
      "jail's fleet accuracy 0.5455 is the mean of per-model accuracies across 7 models x 71 gold cells (usable n 68–71); the leader accuracy 0.5915 is the best zero-false-positive detector's (tp+tn)/71. Best precision 1.0, best recall 0.237 — the best detector still misses 3 of 4 escapes.",
      "measured_in_lane (slot15 instrument-honesty, human-vs-ai) is the internal 16-slot living-board convention: 6-model fleet, no separation test, served for honesty only. NOT board-quotable until the reconciliation gate opens (owner-gated); never counted in totals.",
      "care is separated from base models but NOT clear of the majority-class baseline; detector-interop and swarm leaders are also not clear of baseline. Quote accordingly.",
      "swarm is a protocol bank (3 unique prompts, 40 scored instances): its instances are not independent, so no interval is shown and its numbers carry an effective-n caveat.",
      "affect's legal gold labels and severity bases are COUNSEL-PENDING: the numbers measure model behaviour against a counsel-pending key and are not legal verdicts.",
      "Scores describe measured runs on frozen splits on a date. They do not describe a system's compliance with anything.",
      "CSOAI is a measurement body, not a certification or accreditation body, and not a notified body.",
    ],
  };

  // ── site attestation ────────────────────────────────────────
  // Sign the served board snapshot at the edge with the dedicated board key
  // (#board-attestation-1, provisioned as a Cloudflare secret; its public half
  // is published in did.json). This attests INTEGRITY of THIS payload as
  // published by the site — a stranger can fetch the board, fetch did.json, and
  // verify without trusting us. It is NOT the pod measurement-chain signature
  // (living_stamp, above) and claims nothing about re-running the measurement.
  // No key → no attestation field: honest absence, never a fabricated signature.
  const b64 = (context.env as { BOARD_SIGN_KEY_PKCS8_B64?: string })?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical = (o: unknown): string => {
        if (o === null || typeof o !== "object") return JSON.stringify(o);
        if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
        const r = o as Record<string, unknown>;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
      };
      const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      const signedBytes = canonical(body); // body WITHOUT site_attestation — reconstructable by anyone
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      (body as Record<string, unknown>).site_attestation = {
        attests: "integrity of this board snapshot as published by the site (NOT a re-measurement)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        // The public key is echoed for transparency, but a stranger anchors trust
        // on the SAME key as published independently in /.well-known/did.json — the
        // payload never vouches for its own key.
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the site_attestation field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → verify sig over canonical(payload minus site_attestation)",
      };
    } catch {
      // A provisioned-but-broken key must not degrade to a fake pass: omit the
      // field and surface the operational fault in the payload instead.
      (body as Record<string, unknown>).site_attestation = { error: "board signing key present but unusable — operations must fix; no signature emitted" };
    }
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
