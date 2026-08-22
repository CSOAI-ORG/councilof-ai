/** Client-side estate envelope verification — shared by /gspc-verify and Council OS. */

export interface RecordVerdict {
  lines: { label: string; ok: boolean | null; detail: string }[];
}

export function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v as Record<string, unknown>)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical((v as Record<string, unknown>)[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}

export async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function b64uToBytes(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

export function hexToBytes(s: string): Uint8Array {
  return Uint8Array.from(s.match(/.{2}/g) ?? [], (h) => parseInt(h, 16));
}

export async function verifyRecord(raw: string): Promise<RecordVerdict> {
  const lines: RecordVerdict["lines"] = [];
  let rec: Record<string, unknown>;
  try {
    rec = JSON.parse(raw);
  } catch {
    return { lines: [{ label: "Parse", ok: false, detail: "Not valid JSON — nothing was checked." }] };
  }
  lines.push({ label: "Parse", ok: true, detail: "Valid JSON." });

  const { signature, content_id, ...body } = rec as Record<string, unknown>;
  if (typeof content_id === "string") {
    const withSig = signature !== undefined ? { ...body, signature } : body;
    const candA = await sha256hex(canonical(withSig));
    const candB = await sha256hex(canonical(body));
    const ok = candA === content_id || candB === content_id;
    lines.push({
      label: "content_id",
      ok,
      detail: ok
        ? `Recomputed sha256 matches (${String(content_id).slice(0, 16)}…, envelope ${candA === content_id ? "A" : "B"}).`
        : `MISMATCH — record claims ${String(content_id).slice(0, 16)}….`,
    });
  } else {
    lines.push({ label: "content_id", ok: null, detail: "Absent — hash check not applicable." });
  }

  if (typeof signature === "string" && signature.length > 0) {
    try {
      const did = await (await fetch("/.well-known/did.json")).json();
      const methods: { id: string; publicKeyJwk?: JsonWebKey; publicKeyHex?: string }[] =
        did.verificationMethod ?? [];
      const signedBytes = new TextEncoder().encode(canonical({ ...body, ...(content_id !== undefined ? { content_id } : {}) }));
      const sigBytes = /^[0-9a-f]+$/i.test(signature) ? hexToBytes(signature) : b64uToBytes(signature);
      let verdict = "no published key verifies this signature";
      let ok = false;
      for (const m of methods) {
        try {
          const key = m.publicKeyJwk
            ? await crypto.subtle.importKey("jwk", m.publicKeyJwk, { name: "Ed25519" }, false, ["verify"])
            : m.publicKeyHex
              ? await crypto.subtle.importKey("raw", hexToBytes(m.publicKeyHex), { name: "Ed25519" }, false, ["verify"])
              : null;
          if (!key) continue;
          if (await crypto.subtle.verify({ name: "Ed25519" }, key, sigBytes as unknown as BufferSource, signedBytes)) {
            verdict = `VALID against ${m.id}`;
            ok = true;
            break;
          }
        } catch { /* try next */ }
      }
      lines.push({ label: "Signature", ok, detail: ok ? verdict : `INVALID — ${verdict}.` });
    } catch {
      lines.push({ label: "Signature", ok: false, detail: "Could not fetch did.json keys." });
    }
  } else {
    lines.push({ label: "Signature", ok: null, detail: "UNSIGNED — hash only." });
  }
  return { lines };
}
