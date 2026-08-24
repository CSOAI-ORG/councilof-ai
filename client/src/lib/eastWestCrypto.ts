/**
 * East-West integrity trail — canonical JSON + SHA-256.
 *
 * Same posture as training-outcome records: no board-attestation key on this
 * card yet, so the signature field is UNSIGNED. The hash is still
 * stranger-checkable. This is not a Council attestation and not a
 * certification.
 */

export const CARD_KIND = "csoai.cross-border-card/0.1";
export const SCHEMA_URL =
  "https://councilof.ai/.well-known/schemas/cross-border-card.schema.json";

export function canonical(o: unknown): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return `[${o.map(canonical).join(",")}]`;
  const r = o as Record<string, unknown>;
  return `{${Object.keys(r)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(r[k])}`)
    .join(",")}}`;
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  if (globalThis.crypto?.subtle) {
    return hex(await crypto.subtle.digest("SHA-256", data));
  }
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(text).digest("hex");
}

export async function hashBody(o: unknown): Promise<string> {
  return sha256Hex(canonical(o));
}

export type VerifyLine = { label: string; ok: boolean | null; detail: string };

export async function verifyHashedEnvelope(raw: unknown, opts?: {
  expectedCrosswalkHash?: string;
  expectedKind?: string;
}): Promise<{ ok: boolean; lines: VerifyLine[] }> {
  const lines: VerifyLine[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, lines: [{ label: "Parse", ok: false, detail: "Not an object." }] };
  }
  const rec = raw as Record<string, unknown>;
  lines.push({ label: "Parse", ok: true, detail: "JSON object." });

  const kind = String(rec.kind ?? "");
  const expectKind = opts?.expectedKind ?? CARD_KIND;
  lines.push({
    label: "Kind",
    ok: kind === expectKind,
    detail: kind === expectKind ? kind : `got ${kind || "(empty)"}, expected ${expectKind}`,
  });

  const contentHash = String(rec.contentHash ?? rec.content_id ?? "");
  const { contentHash: _ch, content_id: _cid, signature: _sig, ...body } = rec;
  const recomputed = await hashBody(body);
  const hashOk = contentHash.length === 64 && recomputed === contentHash;
  lines.push({
    label: "contentHash",
    ok: hashOk,
    detail: hashOk
      ? `sha256 matches (${contentHash.slice(0, 16)}…).`
      : `MISMATCH — claimed ${contentHash.slice(0, 16) || "(none)"}… recomputed ${recomputed.slice(0, 16)}…. Fail closed.`,
  });

  const xw = rec.crosswalk as { hash?: string; version?: string } | undefined;
  if (opts?.expectedCrosswalkHash) {
    const bound = String(xw?.hash ?? "");
    const bindOk = bound === opts.expectedCrosswalkHash;
    lines.push({
      label: "Crosswalk binding",
      ok: bindOk,
      detail: bindOk
        ? `Bound to canon ${String(xw?.version ?? "v1")} (${bound.slice(0, 16)}…).`
        : "Crosswalk hash does not match the frozen canon. Fail closed.",
    });
  }

  const grammar = String(rec.grammar ?? rec.product ?? "");
  const grammarOk = /verified measurement credential/i.test(grammar) && !/certificat/i.test(grammar);
  lines.push({
    label: "Grammar",
    ok: grammarOk,
    detail: grammarOk
      ? "verified measurement credential — not a certification."
      : `Rejected grammar: ${grammar || "(missing)"}`,
  });

  const sig = rec.signature as { status?: string } | string | undefined;
  const sigStatus = typeof sig === "string" ? (sig ? "PRESENT" : "UNSIGNED") : String(sig?.status ?? "UNSIGNED");
  if (sigStatus === "UNSIGNED") {
    lines.push({
      label: "Signature",
      ok: null,
      detail: "UNSIGNED — hash trail only. Board-attestation key is not bound on this card.",
    });
  } else {
    lines.push({
      label: "Signature",
      ok: false,
      detail: "Unexpected signature status on an UNSIGNED-era card. Fail closed.",
    });
  }

  const ok = lines.every((l) => l.ok !== false);
  return { ok, lines };
}
