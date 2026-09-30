// csoai-verify 0.1.0 (Apache-2.0). Offline verifier for CSOAI board-signed records. https://councilof.ai/connect/

// ../verifyCard.ts
var enc = new TextEncoder();
var hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
function fromHex(h) {
  if (!/^[0-9a-fA-F]*$/.test(h) || h.length % 2) throw new Error("bad hex");
  const o = new Uint8Array(h.length / 2);
  for (let i = 0; i < o.length; i++) o[i] = parseInt(h.substr(i * 2, 2), 16);
  return o;
}
function fromB64url(s) {
  const b = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = typeof atob === "function" ? atob(b) : Buffer.from(b, "base64").toString("binary");
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function concat(...a) {
  const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0));
  let p = 0;
  for (const x of a) {
    o.set(x, p);
    p += x.length;
  }
  return o;
}
function canon(v) {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") {
    if (!Number.isInteger(v)) throw new Error("non-integral number in payload");
    return String(v);
  }
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (typeof v === "object") {
    const o = v;
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canon(o[k])).join(",") + "}";
  }
  throw new Error("not JSON");
}
var K256 = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
function sha256(msg) {
  const l = msg.length, bl = BigInt(l) * 8n;
  const n = l + 9 + 63 >> 6 << 6;
  const m = new Uint8Array(n);
  m.set(msg);
  m[l] = 128;
  for (let i = 0; i < 8; i++) m[n - 1 - i] = Number(bl >> BigInt(8 * i) & 0xffn);
  const H = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
  const W = new Uint32Array(64);
  const r = (x, s) => x >>> s | x << 32 - s;
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = m[o + 4 * i] << 24 | m[o + 4 * i + 1] << 16 | m[o + 4 * i + 2] << 8 | m[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ W[i - 15] >>> 3, s1 = r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ W[i - 2] >>> 10;
      W[i] = W[i - 16] + s0 + W[i - 7] + s1 >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + (e & f ^ ~e & g) + K256[i] + W[i] >>> 0;
      const t2 = (r(a, 2) ^ r(a, 13) ^ r(a, 22)) + (a & b ^ a & c ^ b & c) >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + t1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 >>> 0;
    }
    H[0] += a;
    H[1] += b;
    H[2] += c;
    H[3] += d;
    H[4] += e;
    H[5] += f;
    H[6] += g;
    H[7] += h;
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[4 * i] = H[i] >>> 24;
    out[4 * i + 1] = H[i] >>> 16 & 255;
    out[4 * i + 2] = H[i] >>> 8 & 255;
    out[4 * i + 3] = H[i] & 255;
  }
  return out;
}
var K512 = [
  "428a2f98d728ae22",
  "7137449123ef65cd",
  "b5c0fbcfec4d3b2f",
  "e9b5dba58189dbbc",
  "3956c25bf348b538",
  "59f111f1b605d019",
  "923f82a4af194f9b",
  "ab1c5ed5da6d8118",
  "d807aa98a3030242",
  "12835b0145706fbe",
  "243185be4ee4b28c",
  "550c7dc3d5ffb4e2",
  "72be5d74f27b896f",
  "80deb1fe3b1696b1",
  "9bdc06a725c71235",
  "c19bf174cf692694",
  "e49b69c19ef14ad2",
  "efbe4786384f25e3",
  "0fc19dc68b8cd5b5",
  "240ca1cc77ac9c65",
  "2de92c6f592b0275",
  "4a7484aa6ea6e483",
  "5cb0a9dcbd41fbd4",
  "76f988da831153b5",
  "983e5152ee66dfab",
  "a831c66d2db43210",
  "b00327c898fb213f",
  "bf597fc7beef0ee4",
  "c6e00bf33da88fc2",
  "d5a79147930aa725",
  "06ca6351e003826f",
  "142929670a0e6e70",
  "27b70a8546d22ffc",
  "2e1b21385c26c926",
  "4d2c6dfc5ac42aed",
  "53380d139d95b3df",
  "650a73548baf63de",
  "766a0abb3c77b2a8",
  "81c2c92e47edaee6",
  "92722c851482353b",
  "a2bfe8a14cf10364",
  "a81a664bbc423001",
  "c24b8b70d0f89791",
  "c76c51a30654be30",
  "d192e819d6ef5218",
  "d69906245565a910",
  "f40e35855771202a",
  "106aa07032bbd1b8",
  "19a4c116b8d2d0c8",
  "1e376c085141ab53",
  "2748774cdf8eeb99",
  "34b0bcb5e19b48a8",
  "391c0cb3c5c95a63",
  "4ed8aa4ae3418acb",
  "5b9cca4f7763e373",
  "682e6ff3d6b2b8a3",
  "748f82ee5defb2fc",
  "78a5636f43172f60",
  "84c87814a1f0ab72",
  "8cc702081a6439ec",
  "90befffa23631e28",
  "a4506cebde82bde9",
  "bef9a3f7b2c67915",
  "c67178f2e372532b",
  "ca273eceea26619c",
  "d186b8c721c0c207",
  "eada7dd6cde0eb1e",
  "f57d4f7fee6ed178",
  "06f067aa72176fba",
  "0a637dc5a2c898a6",
  "113f9804bef90dae",
  "1b710b35131c471b",
  "28db77f523047d84",
  "32caab7b40c72493",
  "3c9ebe0a15c9bebc",
  "431d67c49c100d4c",
  "4cc5d4becb3e42b6",
  "597f299cfc657e2a",
  "5fcb6fab3ad6faec",
  "6c44198c4a475817"
].map((h) => BigInt("0x" + h));
var M64 = (1n << 64n) - 1n;
function sha512(msg) {
  const l = msg.length, n = l + 17 + 127 >> 7 << 7;
  const m = new Uint8Array(n);
  m.set(msg);
  m[l] = 128;
  const bl = BigInt(l) * 8n;
  for (let i = 0; i < 16; i++) m[n - 1 - i] = Number(bl >> BigInt(8 * i) & 0xffn);
  const H = ["6a09e667f3bcc908", "bb67ae8584caa73b", "3c6ef372fe94f82b", "a54ff53a5f1d36f1", "510e527fade682d1", "9b05688c2b3e6c1f", "1f83d9abfb41bd6b", "5be0cd19137e2179"].map((h) => BigInt("0x" + h));
  const r = (x, s) => (x >> s | x << 64n - s) & M64;
  const W = new Array(80);
  for (let o = 0; o < n; o += 128) {
    for (let i = 0; i < 16; i++) {
      let w = 0n;
      for (let j = 0; j < 8; j++) w = w << 8n | BigInt(m[o + 8 * i + j]);
      W[i] = w;
    }
    for (let i = 16; i < 80; i++) {
      const s0 = r(W[i - 15], 1n) ^ r(W[i - 15], 8n) ^ W[i - 15] >> 7n, s1 = r(W[i - 2], 19n) ^ r(W[i - 2], 61n) ^ W[i - 2] >> 6n;
      W[i] = W[i - 16] + s0 + W[i - 7] + s1 & M64;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 80; i++) {
      const t1 = h + (r(e, 14n) ^ r(e, 18n) ^ r(e, 41n)) + (e & f ^ ~e & M64 & g) + K512[i] + W[i] & M64;
      const t2 = (r(a, 28n) ^ r(a, 34n) ^ r(a, 39n)) + (a & b ^ a & c ^ b & c) & M64;
      h = g;
      g = f;
      f = e;
      e = d + t1 & M64;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 & M64;
    }
    H[0] = H[0] + a & M64;
    H[1] = H[1] + b & M64;
    H[2] = H[2] + c & M64;
    H[3] = H[3] + d & M64;
    H[4] = H[4] + e & M64;
    H[5] = H[5] + f & M64;
    H[6] = H[6] + g & M64;
    H[7] = H[7] + h & M64;
  }
  const out = new Uint8Array(64);
  H.forEach((w, i) => {
    for (let j = 0; j < 8; j++) out[8 * i + j] = Number(w >> BigInt(56 - 8 * j) & 0xffn);
  });
  return out;
}
var P = (1n << 255n) - 19n;
var L = (1n << 252n) + 27742317777372353535851937790883648493n;
var mod = (a, m = P) => (a % m + m) % m;
function pow(b, e, m = P) {
  let r = 1n;
  b = mod(b, m);
  while (e > 0n) {
    if (e & 1n) r = r * b % m;
    b = b * b % m;
    e >>= 1n;
  }
  return r;
}
var inv = (a) => pow(a, P - 2n);
var D = mod(-121665n * inv(121666n));
var SQRTM1 = pow(2n, (P - 1n) / 4n);
function add(p, q) {
  const A = mod((p[1] - p[0]) * (q[1] - q[0])), B = mod((p[1] + p[0]) * (q[1] + q[0]));
  const C = mod(2n * p[3] * q[3] * D), Dd = mod(2n * p[2] * q[2]);
  const E = B - A, F = Dd - C, G2 = Dd + C, H = B + A;
  return [mod(E * F), mod(G2 * H), mod(F * G2), mod(E * H)];
}
function mul(s, p) {
  let q = [0n, 1n, 1n, 0n];
  while (s > 0n) {
    if (s & 1n) q = add(q, p);
    p = add(p, p);
    s >>= 1n;
  }
  return q;
}
function eq(p, q) {
  return mod(p[0] * q[2] - q[0] * p[2]) === 0n && mod(p[1] * q[2] - q[1] * p[2]) === 0n;
}
var leInt = (b) => {
  let x = 0n;
  for (let i = b.length - 1; i >= 0; i--) x = x << 8n | BigInt(b[i]);
  return x;
};
function decompress(b) {
  if (b.length !== 32) return null;
  const sign = b[31] >> 7;
  const c = b.slice();
  c[31] &= 127;
  const y = leInt(c);
  if (y >= P) return null;
  const y2 = mod(y * y), u = mod(y2 - 1n), v = mod(D * y2 + 1n);
  let x = mod(u * pow(v, 3n) * pow(u * pow(v, 7n), (P - 5n) / 8n));
  if (mod(v * x * x) !== u) {
    if (mod(v * x * x) === mod(-u)) x = mod(x * SQRTM1);
    else return null;
  }
  if (x === 0n && sign) return null;
  if (Number(x & 1n) !== sign) x = P - x;
  return [x, y, 1n, mod(x * y)];
}
var Gy = mod(4n * inv(5n));
var G = decompress((() => {
  const o = new Uint8Array(32);
  let y = Gy;
  for (let i = 0; i < 32; i++) {
    o[i] = Number(y & 0xffn);
    y >>= 8n;
  }
  return o;
})());
function ed25519Verify(pub, msg, sig) {
  if (sig.length !== 64 || pub.length !== 32) return false;
  const A = decompress(pub), R = decompress(sig.slice(0, 32));
  if (!A || !R) return false;
  const S = leInt(sig.slice(32));
  if (S >= L) return false;
  const k = mod(leInt(sha512(concat(sig.slice(0, 32), pub, msg))), L);
  return eq(mul(S, G), add(R, mul(k, A)));
}
function verifyCard(input) {
  let s;
  try {
    s = typeof input.signed === "string" ? JSON.parse(input.signed) : input.signed;
  } catch {
    return { verified: false, state: "INVALID", debug: "signed envelope is not JSON" };
  }
  const sg = s?.signature ?? {}, pay = s?.payload;
  if (!pay || !sg.sig_ed25519) return { verified: false, state: "INVALID", debug: "envelope lacks payload or signature" };
  let pre;
  try {
    pre = enc.encode(canon(pay));
  } catch (e) {
    return { verified: false, state: "INVALID", debug: "payload not canonicalisable: " + String(e) };
  }
  if (hex(sha256(pre)) !== sg.payload_sha256) return { verified: false, state: "INVALID", debug: "payload digest differs from signature.payload_sha256" };
  if (pay.artifact?.sha256 !== hex(sha256(enc.encode(input.recordText)))) return { verified: false, state: "INVALID", debug: "record bytes differ from payload.artifact.sha256" };
  const kid = sg.did ?? "";
  const x = input.keys[kid];
  if (!x) return { verified: false, state: "UNVERIFIABLE_KEY", debug: `no pinned key for ${kid || "(none named)"}` };
  let ok = false;
  try {
    ok = ed25519Verify(fromB64url(x), pre, fromHex(sg.sig_ed25519));
  } catch {
    ok = false;
  }
  return ok ? { verified: true, state: "VALID", debug: `Ed25519 over ${pre.length} canonical bytes, key ${kid}` } : { verified: false, state: "INVALID", debug: "Ed25519 signature does not verify" };
}

// index.ts
function keysFromDid(did) {
  const out = {};
  for (const m of did?.verificationMethod ?? []) {
    const j = m.publicKeyJwk;
    if (m.id && j && j.kty === "OKP" && j.crv === "Ed25519" && typeof j.x === "string") out[m.id] = j.x;
  }
  return out;
}
export {
  canon,
  ed25519Verify,
  keysFromDid,
  sha256,
  sha512,
  verifyCard
};
