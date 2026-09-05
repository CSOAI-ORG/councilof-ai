/**
 * c2pa — deterministic, dependency-free inspection of a C2PA manifest store (Content Credentials)
 * inside one asset, for the Article 50 marking-evidence pack.
 *
 * WHAT THIS MEASURES (by bytes, in the Function, WebCrypto only):
 *   1. Is a C2PA manifest store PRESENT? (JPEG APP11 "JP" JUMBF, PNG caBX, WebP C2PA chunk,
 *      BMFF uuid box, or a JUMBF `c2pa` superbox anywhere in the bytes as a fallback for PDF etc.)
 *   2. Which manifest is ACTIVE (last in the store), its claim generator and assertion labels.
 *   3. ASSERTION HASHES — every hashlink in the claim recomputed over the assertion superbox body
 *      (bytes after the 8/16-byte box header, i.e. jumd + content). Verified against c2pa-rs's own
 *      fixtures (fixtures/c2pa/README.md).
 *   4. HARD BINDING — `c2pa.hash.data`: SHA over the asset with the declared exclusion ranges
 *      skipped. `c2pa.hash.boxes` / `c2pa.hash.bmff*` / PDF bindings are NOT implemented → UNCHECKABLE.
 *   5. CLAIM SIGNATURE — COSE_Sign1 (tag 18) over Sig_structure ["Signature1", protected, "", claim]
 *      with the LEAF certificate's own SubjectPublicKeyInfo: PS256/384/512, ES256/384/512, EdDSA.
 *   6. CHAIN TRUST — always UNCHECKABLE here: no C2PA trust list is bundled; the leaf verifies its
 *      own signature only. The RFC 3161 timestamp (sigTst) is reported PRESENT_UNVERIFIED / NOT_DETECTED, never verified.
 *
 * WHAT IT NEVER DOES: decide conformity. A manifest not detected is not "unmarked" (metadata is
 * strippable); a manifest detected is not a conformity opinion. Every field is a measured fact or an explicit gap.
 */

export type Tri = "VALID" | "INVALID" | "UNCHECKABLE";
export type Container = "jpeg" | "png" | "webp" | "bmff" | "pdf" | "unknown";

export type C2paInspection = {
  container: Container;
  manifest_store_present: boolean;
  manifest_store_bytes: number | null;
  manifest_store_sha256: string | null;
  manifest_count: number;
  active_manifest_label: string | null;
  claim: {
    version: "v1" | "v2" | null;
    claim_generator: string | null;
    title: string | null;
    format: string | null;
    instance_id: string | null;
    alg: string | null;
    assertion_count: number;
    assertion_labels: string[];
  } | null;
  assertion_hashes: { status: Tri; checked: number; failed: string[]; reason: string | null };
  data_hash: { status: Tri; binding: string | null; alg: string | null; exclusions: number; exclusions_cover_manifest: boolean | null; reason: string | null };
  signature: {
    status: Tri;
    cose_alg: string | null;
    leaf_cn: string | null;
    leaf_not_before: string | null;
    leaf_not_after: string | null;
    chain_length: number | null;
    timestamp: "PRESENT_UNVERIFIED" | "NOT_DETECTED" | null;
    reason: string | null;
  };
  chain_trust: { status: "UNCHECKABLE"; reason: string };
  xmp_digital_source_type: string | null;
  notes: string[];
};

// ───────────────────────────── small helpers ─────────────────────────────
const td = new TextDecoder();
const te = new TextEncoder();
const hex = (b: Uint8Array): string => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
const u32 = (b: Uint8Array, o: number): number => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
const u16 = (b: Uint8Array, o: number): number => (b[o] << 8) + b[o + 1];
const eq = (a: Uint8Array, b: Uint8Array): boolean => a.length === b.length && a.every((x, i) => x === b[i]);
const ascii = (s: string): Uint8Array => te.encode(s);

async function digest(alg: "SHA-256" | "SHA-384" | "SHA-512", parts: Uint8Array[]): Promise<Uint8Array> {
  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const buf = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    buf.set(p, o);
    o += p.byteLength;
  }
  return new Uint8Array(await crypto.subtle.digest(alg, buf as BufferSource));
}
export async function sha256(bytes: Uint8Array): Promise<string> {
  return hex(await digest("SHA-256", [bytes]));
}
function hashAlg(name: string | null | undefined): "SHA-256" | "SHA-384" | "SHA-512" | null {
  const n = String(name || "sha256").toLowerCase().replace("-", "");
  if (n === "sha256") return "SHA-256";
  if (n === "sha384") return "SHA-384";
  if (n === "sha512") return "SHA-512";
  return null;
}

// ───────────────────────────── minimal CBOR ─────────────────────────────
export class CborTag {
  constructor(public tag: number, public value: unknown) {}
}
class CborReader {
  o = 0;
  constructor(private b: Uint8Array) {}
  private len(ai: number): number | null {
    if (ai < 24) return ai;
    if (ai === 24) return this.b[this.o++];
    if (ai === 25) {
      const v = u16(this.b, this.o);
      this.o += 2;
      return v;
    }
    if (ai === 26) {
      const v = u32(this.b, this.o);
      this.o += 4;
      return v;
    }
    if (ai === 27) {
      const hi = u32(this.b, this.o);
      const lo = u32(this.b, this.o + 4);
      this.o += 8;
      return hi * 4294967296 + lo;
    }
    if (ai === 31) return null; // indefinite
    throw new Error("cbor: bad additional info");
  }
  read(): unknown {
    if (this.o >= this.b.length) throw new Error("cbor: truncated");
    const ib = this.b[this.o++];
    const mt = ib >> 5;
    const ai = ib & 0x1f;
    switch (mt) {
      case 0:
        return this.len(ai) as number;
      case 1:
        return -1 - (this.len(ai) as number);
      case 2:
      case 3: {
        const n = this.len(ai);
        if (n === null) {
          const chunks: Uint8Array[] = [];
          while (this.b[this.o] !== 0xff) chunks.push(this.read() as Uint8Array);
          this.o++;
          const total = chunks.reduce((a, c) => a + c.length, 0);
          const out = new Uint8Array(total);
          let p = 0;
          for (const c of chunks) {
            out.set(c, p);
            p += c.length;
          }
          return mt === 2 ? out : td.decode(out);
        }
        const s = this.b.subarray(this.o, this.o + n);
        this.o += n;
        return mt === 2 ? s : td.decode(s);
      }
      case 4: {
        const n = this.len(ai);
        const arr: unknown[] = [];
        if (n === null) {
          while (this.b[this.o] !== 0xff) arr.push(this.read());
          this.o++;
        } else for (let i = 0; i < n; i++) arr.push(this.read());
        return arr;
      }
      case 5: {
        const n = this.len(ai);
        const m = new Map<unknown, unknown>();
        if (n === null) {
          while (this.b[this.o] !== 0xff) m.set(this.read(), this.read());
          this.o++;
        } else for (let i = 0; i < n; i++) m.set(this.read(), this.read());
        return m;
      }
      case 6:
        return new CborTag(this.len(ai) as number, this.read());
      case 7: {
        if (ai === 20) return false;
        if (ai === 21) return true;
        if (ai === 22) return null;
        if (ai === 23) return undefined;
        if (ai === 24) return this.b[this.o++];
        if (ai === 25) {
          const h = u16(this.b, this.o);
          this.o += 2;
          const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
          if (e === 0) return s * f * 2 ** -24;
          if (e === 31) return f ? NaN : s * Infinity;
          return s * (1 + f / 1024) * 2 ** (e - 15);
        }
        if (ai === 26) {
          const v = new DataView(this.b.buffer, this.b.byteOffset + this.o, 4).getFloat32(0);
          this.o += 4;
          return v;
        }
        if (ai === 27) {
          const v = new DataView(this.b.buffer, this.b.byteOffset + this.o, 8).getFloat64(0);
          this.o += 8;
          return v;
        }
        throw new Error("cbor: bad simple");
      }
    }
    throw new Error("cbor: unreachable");
  }
}
export function cborDecode(b: Uint8Array): unknown {
  return new CborReader(b).read();
}
/** Encoder for exactly what Sig_structure needs: arrays, text strings, byte strings. */
export function cborEncode(v: unknown): Uint8Array {
  const out: number[] = [];
  const head = (mt: number, n: number) => {
    if (n < 24) out.push((mt << 5) | n);
    else if (n < 256) out.push((mt << 5) | 24, n);
    else if (n < 65536) out.push((mt << 5) | 25, n >> 8, n & 255);
    else out.push((mt << 5) | 26, (n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
  };
  const enc = (x: unknown) => {
    if (typeof x === "string") {
      const b = te.encode(x);
      head(3, b.length);
      out.push(...b);
    } else if (x instanceof Uint8Array) {
      head(2, x.length);
      out.push(...x);
    } else if (Array.isArray(x)) {
      head(4, x.length);
      x.forEach(enc);
    } else throw new Error("cborEncode: unsupported");
  };
  enc(v);
  return Uint8Array.from(out);
}
const mget = (m: unknown, k: unknown): unknown => (m instanceof Map ? m.get(k) : undefined);
const asStr = (v: unknown): string | null => (typeof v === "string" ? v : null);

// ───────────────────────────── JUMBF ─────────────────────────────
export type JumbfBox = {
  type: string;
  label: string | null;
  uuid: string | null;
  /** whole box bytes (header + body) */
  full: Uint8Array;
  /** bytes after the box header */
  body: Uint8Array;
  /** for a superbox: bytes after the jumd description box */
  content: Uint8Array | null;
  children: JumbfBox[];
};

export function parseJumbf(buf: Uint8Array, off = 0, end = buf.length): JumbfBox[] {
  const boxes: JumbfBox[] = [];
  let guard = 0;
  while (off + 8 <= end && guard++ < 10000) {
    let L = u32(buf, off);
    const T = td.decode(buf.subarray(off + 4, off + 8));
    let hdr = 8;
    if (L === 1) {
      L = u32(buf, off + 8) * 4294967296 + u32(buf, off + 12);
      hdr = 16;
    }
    if (L === 0) L = end - off;
    if (L < hdr || off + L > end) break;
    const full = buf.subarray(off, off + L);
    const body = buf.subarray(off + hdr, off + L);
    const box: JumbfBox = { type: T, label: null, uuid: null, full, body, content: null, children: [] };
    if (T === "jumb" && body.length >= 8 && td.decode(body.subarray(4, 8)) === "jumd") {
      const dl = u32(body, 0);
      const d = body.subarray(8, dl);
      if (d.length >= 17) {
        box.uuid = hex(d.subarray(0, 16));
        const toggles = d[16];
        if (toggles & 2) {
          const rest = d.subarray(17);
          const z = rest.indexOf(0);
          box.label = td.decode(rest.subarray(0, z < 0 ? rest.length : z));
        }
      }
      box.content = body.subarray(dl);
      box.children = parseJumbf(body, dl, body.length);
    }
    boxes.push(box);
    off += L;
  }
  return boxes;
}

// ───────────────────────────── container extraction ─────────────────────────────
export type Extracted = { container: Container; store: Uint8Array | null; manifest_ranges: Array<{ start: number; length: number }> };

const JUMBF_C2PA_UUID = "6332706100110010800000aa00389b71"; // "c2pa" manifest store description UUID

export function extractManifestStore(b: Uint8Array): Extracted {
  // JPEG: APP11 (0xFFEB) segments, CI="JP", grouped by En, ordered by Z.
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    const groups = new Map<number, { z: number; bytes: Uint8Array; start: number; length: number }[]>();
    let i = 2;
    while (i + 4 <= b.length) {
      if (b[i] !== 0xff) break;
      const m = b[i + 1];
      if (m === 0xff) {
        i++;
        continue;
      }
      if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7) || m === 0x01) {
        i += 2;
        continue;
      }
      if (m === 0xda || m === 0xd9) break;
      const L = u16(b, i + 2);
      if (L < 2 || i + 2 + L > b.length) break;
      const seg = b.subarray(i + 4, i + 2 + L);
      if (m === 0xeb && seg.length > 8 && seg[0] === 0x4a && seg[1] === 0x50) {
        const en = u16(seg, 2);
        const z = u32(seg, 4);
        const g = groups.get(en) || [];
        g.push({ z, bytes: seg.subarray(8), start: i, length: 2 + L });
        groups.set(en, g);
      }
      i += 2 + L;
    }
    for (const g of groups.values()) {
      g.sort((a, c) => a.z - c.z);
      // first packet carries LBox+TBox; continuation packets repeat that 8-byte header.
      const parts = g.map((p, k) => (k === 0 ? p.bytes : p.bytes.subarray(8)));
      const total = parts.reduce((n, p) => n + p.length, 0);
      const store = new Uint8Array(total);
      let o = 0;
      for (const p of parts) {
        store.set(p, o);
        o += p.length;
      }
      const top = parseJumbf(store)[0];
      if (top && top.type === "jumb" && top.label === "c2pa") {
        return { container: "jpeg", store, manifest_ranges: g.map((p) => ({ start: p.start, length: p.length })) };
      }
    }
    return { container: "jpeg", store: null, manifest_ranges: [] };
  }
  // PNG: caBX chunk.
  if (b.length > 8 && eq(b.subarray(0, 8), Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    let i = 8;
    while (i + 12 <= b.length) {
      const L = u32(b, i);
      const T = td.decode(b.subarray(i + 4, i + 8));
      if (T === "caBX") return { container: "png", store: b.subarray(i + 8, i + 8 + L), manifest_ranges: [{ start: i, length: 12 + L }] };
      if (T === "IEND") break;
      i += 12 + L;
    }
    return { container: "png", store: null, manifest_ranges: [] };
  }
  // WebP: RIFF ... WEBP, chunk "C2PA".
  if (b.length > 12 && td.decode(b.subarray(0, 4)) === "RIFF" && td.decode(b.subarray(8, 12)) === "WEBP") {
    let i = 12;
    while (i + 8 <= b.length) {
      const T = td.decode(b.subarray(i, i + 4));
      const L = b[i + 4] + (b[i + 5] << 8) + (b[i + 6] << 16) + (b[i + 7] << 24) * 1;
      if (T === "C2PA") return { container: "webp", store: b.subarray(i + 8, i + 8 + L), manifest_ranges: [{ start: i, length: 8 + L + (L & 1) }] };
      i += 8 + L + (L & 1);
    }
    return { container: "webp", store: null, manifest_ranges: [] };
  }
  // BMFF (mp4/mov/heif/avif): top-level uuid box with the C2PA UUID.
  if (b.length > 12 && td.decode(b.subarray(4, 8)) === "ftyp") {
    const C2PA_BMFF_UUID = "d8fec3d61b0e483c92975828877ec481";
    let i = 0;
    while (i + 8 <= b.length) {
      let L = u32(b, i);
      const T = td.decode(b.subarray(i + 4, i + 8));
      let hdr = 8;
      if (L === 1) {
        L = u32(b, i + 8) * 4294967296 + u32(b, i + 12);
        hdr = 16;
      }
      if (L === 0) L = b.length - i;
      if (L < hdr) break;
      if (T === "uuid" && hex(b.subarray(i + hdr, i + hdr + 16)) === C2PA_BMFF_UUID) {
        // FullBox: version(1) flags(3), purpose (null-terminated), [merkle offset 8 bytes], manifest store
        let p = i + hdr + 16 + 4;
        const z = b.indexOf(0, p);
        const purpose = td.decode(b.subarray(p, z < 0 ? p : z));
        p = z + 1;
        if (purpose === "manifest") p += 8;
        return { container: "bmff", store: b.subarray(p, i + L), manifest_ranges: [{ start: i, length: L }] };
      }
      i += L;
    }
    return { container: "bmff", store: null, manifest_ranges: [] };
  }
  const container: Container = b.length > 4 && td.decode(b.subarray(0, 4)) === "%PDF" ? "pdf" : "unknown";
  // Fallback: a `jumd` description box carrying the c2pa manifest-store UUID anywhere in the bytes.
  const needle = Uint8Array.from([0x6a, 0x75, 0x6d, 0x64, ...(JUMBF_C2PA_UUID.match(/../g)!.map((h) => parseInt(h, 16)))]);
  outer: for (let i = 12; i + needle.length <= b.length; i++) {
    for (let k = 0; k < needle.length; k++) if (b[i + k] !== needle[k]) continue outer;
    const start = i - 4 - 8; // jumd LBox, then the superbox header
    if (start < 0) continue;
    const L = u32(b, start);
    if (td.decode(b.subarray(start + 4, start + 8)) !== "jumb" || L < 16 || start + L > b.length) continue;
    return { container, store: b.subarray(start, start + L), manifest_ranges: [{ start, length: L }] };
  }
  return { container, store: null, manifest_ranges: [] };
}

// ───────────────────────────── DER / X.509 (leaf only) ─────────────────────────────
type Tlv = { tag: number; start: number; end: number; hdr: number };
function tlv(b: Uint8Array, o: number): Tlv {
  const tag = b[o];
  let len = b[o + 1];
  let h = 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + b[o + 2 + i];
    h = 2 + n;
  }
  return { tag, start: o + h, end: o + h + len, hdr: o };
}
function children(b: Uint8Array, t: Tlv): Tlv[] {
  const out: Tlv[] = [];
  let o = t.start;
  while (o < t.end) {
    const c = tlv(b, o);
    out.push(c);
    o = c.end;
  }
  return out;
}
function derTime(b: Uint8Array, t: Tlv): string | null {
  const s = td.decode(b.subarray(t.start, t.end));
  if (t.tag === 0x17 && s.length >= 13) {
    const yy = parseInt(s.slice(0, 2), 10);
    return `${yy >= 50 ? 1900 + yy : 2000 + yy}-${s.slice(2, 4)}-${s.slice(4, 6)}T${s.slice(6, 8)}:${s.slice(8, 10)}:${s.slice(10, 12)}Z`;
  }
  if (t.tag === 0x18 && s.length >= 15) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}Z`;
  return null;
}
export type LeafCert = { spki: Uint8Array; key: { kind: "rsa" } | { kind: "ec"; curve: "P-256" | "P-384" | "P-521" } | { kind: "ed25519" } | { kind: "unknown" }; cn: string | null; not_before: string | null; not_after: string | null };
const OID_CN = "550403";
const OID_RSA = "2a864886f70d010101";
const OID_RSA_PSS = "2a864886f70d01010a"; // id-RSASSA-PSS — what c2pa-rs PS256 certs carry; WebCrypto spki import rejects it, so RSA keys go in as JWK (n, e)
const OID_EC = "2a8648ce3d0201";
const OID_P256 = "2a8648ce3d030107";
const OID_P384 = "2b81040022";
const OID_P521 = "2b81040023";
const OID_ED25519 = "2b6570";

export function parseLeafCert(der: Uint8Array): LeafCert {
  const cert = tlv(der, 0);
  const tbs = children(der, cert)[0];
  const f = children(der, tbs);
  let i = 0;
  if (f[0].tag === 0xa0) i = 1; // explicit version
  // serial, sigalg, issuer, validity, subject, spki
  const validity = f[i + 3];
  const subject = f[i + 4];
  const spki = f[i + 5];
  const [nb, na] = children(der, validity);
  let cn: string | null = null;
  for (const rdn of children(der, subject)) {
    for (const atv of children(der, rdn)) {
      const [oid, val] = children(der, atv);
      if (hex(der.subarray(oid.start, oid.end)) === OID_CN) cn = td.decode(der.subarray(val.start, val.end));
    }
  }
  const alg = children(der, children(der, spki)[0]);
  const algOid = hex(der.subarray(alg[0].start, alg[0].end));
  let key: LeafCert["key"] = { kind: "unknown" };
  if (algOid === OID_RSA || algOid === OID_RSA_PSS) key = { kind: "rsa" };
  else if (algOid === OID_ED25519) key = { kind: "ed25519" };
  else if (algOid === OID_EC && alg[1]) {
    const c = hex(der.subarray(alg[1].start, alg[1].end));
    key = { kind: "ec", curve: c === OID_P256 ? "P-256" : c === OID_P384 ? "P-384" : "P-521" };
    if (![OID_P256, OID_P384, OID_P521].includes(c)) key = { kind: "unknown" };
  }
  return { spki: der.subarray(spki.hdr, spki.end), key, cn, not_before: derTime(der, nb), not_after: derTime(der, na) };
}

/** RSAPublicKey (n, e) out of an SPKI as a JWK — independent of whether the SPKI OID is rsaEncryption or id-RSASSA-PSS. */
function rsaJwk(spki: Uint8Array): JsonWebKey {
  const b64url = (b: Uint8Array): string => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const top = tlv(spki, 0);
  const [, bitStr] = children(spki, top);
  const pk = spki.subarray(bitStr.start + 1, bitStr.end); // skip the unused-bits octet
  const seq = tlv(pk, 0);
  const [n, e] = children(pk, seq);
  const strip = (t: Tlv): Uint8Array => {
    let o = t.start;
    while (o < t.end - 1 && pk[o] === 0) o++;
    return pk.subarray(o, t.end);
  };
  return { kty: "RSA", n: b64url(strip(n)), e: b64url(strip(e)), ext: true };
}

// ───────────────────────────── COSE_Sign1 verify ─────────────────────────────
const COSE_ALG: Record<number, { name: string; hash: "SHA-256" | "SHA-384" | "SHA-512" | null; kind: "rsa-pss" | "ecdsa" | "eddsa" }> = {
  [-7]: { name: "ES256", hash: "SHA-256", kind: "ecdsa" },
  [-35]: { name: "ES384", hash: "SHA-384", kind: "ecdsa" },
  [-36]: { name: "ES512", hash: "SHA-512", kind: "ecdsa" },
  [-37]: { name: "PS256", hash: "SHA-256", kind: "rsa-pss" },
  [-38]: { name: "PS384", hash: "SHA-384", kind: "rsa-pss" },
  [-39]: { name: "PS512", hash: "SHA-512", kind: "rsa-pss" },
  [-8]: { name: "EdDSA", hash: null, kind: "eddsa" },
};

export async function verifyCoseSign1(coseBytes: Uint8Array, detachedPayload: Uint8Array): Promise<C2paInspection["signature"]> {
  const out: C2paInspection["signature"] = { status: "UNCHECKABLE", cose_alg: null, leaf_cn: null, leaf_not_before: null, leaf_not_after: null, chain_length: null, timestamp: null, reason: null };
  let decoded: unknown;
  try {
    decoded = cborDecode(coseBytes);
  } catch (e) {
    out.reason = `COSE not decodable: ${(e as Error).message}`;
    return out;
  }
  const arr = decoded instanceof CborTag ? decoded.value : decoded;
  if (!Array.isArray(arr) || arr.length !== 4 || !(arr[0] instanceof Uint8Array) || !(arr[3] instanceof Uint8Array)) {
    out.reason = "not a COSE_Sign1 array";
    return out;
  }
  const protectedBytes = arr[0] as Uint8Array;
  const unprotected = arr[1];
  const sig = arr[3] as Uint8Array;
  let prot: unknown = new Map();
  try {
    prot = protectedBytes.length ? cborDecode(protectedBytes) : new Map();
  } catch {
    out.reason = "protected header not decodable";
    return out;
  }
  const algId = mget(prot, 1) ?? mget(unprotected, 1);
  const alg = typeof algId === "number" ? COSE_ALG[algId] : undefined;
  out.cose_alg = alg ? alg.name : algId == null ? null : `cose:${String(algId)}`;
  out.timestamp = mget(unprotected, "sigTst") || mget(unprotected, "sigTst2") || mget(prot, "sigTst2") ? "PRESENT_UNVERIFIED" : "NOT_DETECTED";
  const chainRaw = mget(prot, 33) ?? mget(unprotected, 33) ?? mget(prot, "x5chain") ?? mget(unprotected, "x5chain");
  const chain: Uint8Array[] = Array.isArray(chainRaw) ? (chainRaw as Uint8Array[]) : chainRaw instanceof Uint8Array ? [chainRaw] : [];
  out.chain_length = chain.length || null;
  if (!chain.length) {
    out.reason = "no x5chain in COSE headers";
    return out;
  }
  let leaf: LeafCert;
  try {
    leaf = parseLeafCert(chain[0]);
  } catch (e) {
    out.reason = `leaf certificate not parseable: ${(e as Error).message}`;
    return out;
  }
  out.leaf_cn = leaf.cn;
  out.leaf_not_before = leaf.not_before;
  out.leaf_not_after = leaf.not_after;
  if (!alg) {
    out.reason = `COSE alg ${String(algId)} not supported by this Function`;
    return out;
  }
  const sigStructure = cborEncode(["Signature1", protectedBytes, new Uint8Array(0), detachedPayload]);
  try {
    let ok = false;
    if (alg.kind === "rsa-pss" && leaf.key.kind === "rsa") {
      const key = await crypto.subtle.importKey("jwk", rsaJwk(leaf.spki), { name: "RSA-PSS", hash: alg.hash! }, false, ["verify"]);
      const saltLength = { "SHA-256": 32, "SHA-384": 48, "SHA-512": 64 }[alg.hash!];
      ok = await crypto.subtle.verify({ name: "RSA-PSS", saltLength }, key, sig as BufferSource, sigStructure as BufferSource);
    } else if (alg.kind === "ecdsa" && leaf.key.kind === "ec") {
      const key = await crypto.subtle.importKey("spki", leaf.spki as BufferSource, { name: "ECDSA", namedCurve: leaf.key.curve }, false, ["verify"]);
      ok = await crypto.subtle.verify({ name: "ECDSA", hash: alg.hash! }, key, sig as BufferSource, sigStructure as BufferSource);
    } else if (alg.kind === "eddsa" && leaf.key.kind === "ed25519") {
      const key = await crypto.subtle.importKey("spki", leaf.spki as BufferSource, { name: "Ed25519" }, false, ["verify"]);
      ok = await crypto.subtle.verify({ name: "Ed25519" }, key, sig as BufferSource, sigStructure as BufferSource);
    } else {
      out.reason = `key type ${leaf.key.kind} does not match COSE alg ${alg.name}`;
      return out;
    }
    out.status = ok ? "VALID" : "INVALID";
    out.reason = ok ? "leaf SPKI verifies the COSE_Sign1 over the claim bytes" : "signature does not verify under the leaf SPKI";
  } catch (e) {
    out.reason = `WebCrypto could not verify: ${(e as Error).message}`;
  }
  return out;
}

// ───────────────────────────── the inspection ─────────────────────────────
function findByLabel(boxes: JumbfBox[], label: string): JumbfBox | undefined {
  return boxes.find((x) => x.label === label);
}
function contentBox(sb: JumbfBox | undefined, type: string): Uint8Array | null {
  const c = sb?.children.find((x) => x.type === type);
  return c ? c.body : null;
}

export async function inspectC2pa(asset: Uint8Array | null, storeOverride?: Uint8Array): Promise<C2paInspection> {
  const notes: string[] = [];
  const ex = asset ? extractManifestStore(asset) : { container: "unknown" as Container, store: null, manifest_ranges: [] };
  const store = storeOverride ?? ex.store;
  const res: C2paInspection = {
    container: ex.container,
    manifest_store_present: !!store,
    manifest_store_bytes: store ? store.byteLength : null,
    manifest_store_sha256: store ? await sha256(store) : null,
    manifest_count: 0,
    active_manifest_label: null,
    claim: null,
    assertion_hashes: { status: "UNCHECKABLE", checked: 0, failed: [], reason: "no manifest store" },
    data_hash: { status: "UNCHECKABLE", binding: null, alg: null, exclusions: 0, exclusions_cover_manifest: null, reason: "no manifest store" },
    signature: { status: "UNCHECKABLE", cose_alg: null, leaf_cn: null, leaf_not_before: null, leaf_not_after: null, chain_length: null, timestamp: null, reason: "no manifest store" },
    chain_trust: { status: "UNCHECKABLE", reason: "no C2PA trust list is bundled in this Function; the leaf certificate verifies its own signature only. Anchoring to a trust list (e.g. c2patool --trust) is a separate step." },
    xmp_digital_source_type: asset ? xmpDigitalSourceType(asset) : null,
    notes,
  };
  if (!store) {
    notes.push("no C2PA manifest store located in this container; metadata is strippable, so a manifest not being detected says nothing about the generator");
    return res;
  }
  const top = parseJumbf(store)[0];
  if (!top || top.type !== "jumb" || top.label !== "c2pa") {
    notes.push("bytes found where a manifest store should be, but the JUMBF superbox is not labelled c2pa");
    res.assertion_hashes.reason = res.data_hash.reason = res.signature.reason = "manifest store not parseable";
    return res;
  }
  const manifests = top.children.filter((c) => c.type === "jumb");
  res.manifest_count = manifests.length;
  const active = manifests[manifests.length - 1];
  if (!active) {
    res.assertion_hashes.reason = res.data_hash.reason = res.signature.reason = "manifest store holds no manifest";
    return res;
  }
  res.active_manifest_label = active.label;
  const assertionsBox = findByLabel(active.children, "c2pa.assertions");
  const claimBox = findByLabel(active.children, "c2pa.claim") || findByLabel(active.children, "c2pa.claim.v2");
  const version: "v1" | "v2" | null = claimBox ? (claimBox.label === "c2pa.claim.v2" ? "v2" : "v1") : null;
  const claimBytes = contentBox(claimBox, "cbor");
  const sigBytes = contentBox(findByLabel(active.children, "c2pa.signature"), "cbor");
  let claim: unknown = null;
  if (claimBytes) {
    try {
      claim = cborDecode(claimBytes);
    } catch (e) {
      notes.push(`claim CBOR not decodable: ${(e as Error).message}`);
    }
  }
  const links: Array<{ url: string; hash: Uint8Array; alg: string | null }> = [];
  const pushLinks = (v: unknown) => {
    if (!Array.isArray(v)) return;
    for (const h of v) {
      const url = asStr(mget(h, "url"));
      const hash = mget(h, "hash");
      if (url && hash instanceof Uint8Array) links.push({ url, hash, alg: asStr(mget(h, "alg")) });
    }
  };
  if (claim instanceof Map) {
    pushLinks(claim.get("assertions"));
    pushLinks(claim.get("created_assertions"));
    pushLinks(claim.get("gathered_assertions"));
    const cgi = claim.get("claim_generator_info");
    const cgiName = Array.isArray(cgi) && cgi[0] instanceof Map ? asStr(cgi[0].get("name")) : null;
    res.claim = {
      version,
      claim_generator: asStr(claim.get("claim_generator")) ?? cgiName,
      title: asStr(claim.get("dc:title")),
      format: asStr(claim.get("dc:format")),
      instance_id: asStr(claim.get("instanceID")),
      alg: asStr(claim.get("alg")),
      assertion_count: links.length,
      assertion_labels: links.map((l) => l.url.split("c2pa.assertions/").pop() || l.url).slice(0, 24),
    };
  } else {
    res.assertion_hashes.reason = res.data_hash.reason = res.signature.reason = "no decodable claim";
    return res;
  }
  // 3. assertion hashes
  const failed: string[] = [];
  let checked = 0;
  let unresolved = 0;
  for (const l of links) {
    const label = l.url.split("c2pa.assertions/").pop() || "";
    const box = assertionsBox ? findByLabel(assertionsBox.children, label) : undefined;
    const alg = hashAlg(l.alg || res.claim.alg);
    if (!box || !alg) {
      unresolved++;
      continue;
    }
    checked++;
    const h = await digest(alg, [box.body]);
    if (!eq(h, l.hash)) failed.push(label);
  }
  res.assertion_hashes = {
    status: checked === 0 ? "UNCHECKABLE" : failed.length ? "INVALID" : "VALID",
    checked,
    failed,
    reason: checked === 0 ? "no assertion could be resolved to a box" : unresolved ? `${unresolved} hashlink(s) unresolved` : null,
  };
  // 4. hard binding
  const bindingLabel = res.claim.assertion_labels.find((l) => l.startsWith("c2pa.hash."));
  res.data_hash.binding = bindingLabel ?? null;
  const dh = bindingLabel === "c2pa.hash.data" && assertionsBox ? contentBox(findByLabel(assertionsBox.children, "c2pa.hash.data"), "cbor") : null;
  if (!bindingLabel) res.data_hash.reason = "no c2pa.hash.* assertion in the claim";
  else if (bindingLabel !== "c2pa.hash.data") res.data_hash.reason = `${bindingLabel} binding not implemented in this Function (only c2pa.hash.data)`;
  else if (!dh) res.data_hash.reason = "c2pa.hash.data box missing";
  else if (!asset) res.data_hash.reason = "asset bytes not supplied (manifest-only mode); hard binding cannot be recomputed";
  else {
    try {
      const d = cborDecode(dh) as Map<string, unknown>;
      const alg = hashAlg(asStr(d.get("alg")) || res.claim.alg);
      const exRaw = d.get("exclusions");
      const exclusions = (Array.isArray(exRaw) ? exRaw : [])
        .map((e) => ({ start: Number(mget(e, "start")), length: Number(mget(e, "length")) }))
        .filter((e) => Number.isFinite(e.start) && Number.isFinite(e.length))
        .sort((a, b) => a.start - b.start);
      const want = d.get("hash");
      res.data_hash.alg = alg;
      res.data_hash.exclusions = exclusions.length;
      res.data_hash.exclusions_cover_manifest = ex.manifest_ranges.length
        ? ex.manifest_ranges.every((r) => exclusions.some((e) => e.start <= r.start && e.start + e.length >= r.start + r.length))
        : null;
      if (!alg || !(want instanceof Uint8Array)) res.data_hash.reason = "hash.data alg/hash unreadable";
      else if (ex.container === "pdf" || ex.container === "unknown") res.data_hash.reason = `${ex.container}: exclusion semantics for this container are not implemented`;
      else {
        const parts: Uint8Array[] = [];
        let pos = 0;
        for (const e of exclusions) {
          if (e.start > pos) parts.push(asset.subarray(pos, e.start));
          pos = Math.max(pos, e.start + e.length);
        }
        if (pos < asset.length) parts.push(asset.subarray(pos));
        const got = await digest(alg, parts);
        res.data_hash.status = eq(got, want) ? "VALID" : "INVALID";
        res.data_hash.reason = res.data_hash.status === "VALID" ? "asset hash with declared exclusions matches" : "asset bytes do not match the declared hash (edited after signing, or exclusions differ)";
      }
    } catch (e) {
      res.data_hash.reason = `hash.data not decodable: ${(e as Error).message}`;
    }
  }
  // 5. signature
  if (!sigBytes) res.signature.reason = "no c2pa.signature box";
  else if (!claimBytes) res.signature.reason = "no claim bytes to verify against";
  else res.signature = await verifyCoseSign1(sigBytes, claimBytes);
  if (res.assertion_hashes.status === "VALID" && res.data_hash.status === "VALID" && res.signature.status === "VALID") {
    notes.push("manifest internally consistent: assertion hashes, hard binding and claim signature all recompute; trust-list anchoring remains UNCHECKABLE");
  }
  return res;
}

/** IPTC DigitalSourceType from an XMP packet (e.g. trainedAlgorithmicMedia) — a machine-readable mark that is not C2PA. */
export function xmpDigitalSourceType(b: Uint8Array): string | null {
  const head = b.subarray(0, Math.min(b.length, 4 * 1024 * 1024));
  const s = new TextDecoder("latin1").decode(head);
  const i = s.indexOf("DigitalSourceType");
  if (i < 0) return null;
  const win = s.slice(i, i + 400);
  const m = win.match(/DigitalSourceType\s*=\s*"([^"]{1,200})"/) || win.match(/DigitalSourceType[^>]*>\s*([^<\s]{1,200})\s*</) || win.match(/DigitalSourceType\s*=\s*'([^']{1,200})'/);
  if (!m) return null;
  return m[1].split("/").pop() || m[1];
}

export { ascii as _ascii };
