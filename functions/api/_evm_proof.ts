/**
 * _evm_proof — keccak-256, RLP and Merkle-Patricia proof checking for the Worker, ported line for
 * line from scripts/readers/cross_ledger_supply.py (lane cross-ledger-usdc-20260925: rlp_decode,
 * rlp_encode, mpt_get, header_hash, verify_eip1186) so /api/ras/supply can check an EIP-1186
 * eth_getProof answer HERE, against the stateRoot of the block header it names, instead of
 * repeating one operator's number.
 *
 * What a pass proves and what it does not (same limits as the reader):
 *   - the account leaf and the storage leaf hash up to `stateRoot` of the header returned
 *   - the proven slot value equals the eth_call totalSupply() answer
 *   - keccak(rlp(header)) equals the block hash the operator named (header_hash_recomputed)
 *   It does NOT check the header against consensus (no light client). A second operator's copy of
 *   the same block is compared and recorded; agreement of two operators is still not a proof.
 *
 * keccak-256 here is the ORIGINAL Keccak padding (0x01), not SHA3-256 (0x06) — Ethereum's hash.
 * 32-bit lane halves (see keccakF) so a proof fits a Worker's CPU budget.
 */

// Round constants as (lo, hi) 32-bit halves of the standard 64-bit Keccak-f[1600] constants.
const RC64 = [
  "0000000000000001", "0000000000008082", "800000000000808a", "8000000080008000",
  "000000000000808b", "0000000080000001", "8000000080008081", "8000000000008009",
  "000000000000008a", "0000000000000088", "0000000080008009", "000000008000000a",
  "000000008000808b", "800000000000008b", "8000000000008089", "8000000000008003",
  "8000000000008002", "8000000000000080", "000000000000800a", "800000008000000a",
  "8000000080008081", "8000000000008080", "0000000080000001", "8000000080008008",
];
const RC_HI = RC64.map((h) => parseInt(h.slice(0, 8), 16) >>> 0);
const RC_LO = RC64.map((h) => parseInt(h.slice(8), 16) >>> 0);
// Rotation offsets r[x][y], indexed [x + 5y].
const ROT = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14];

/**
 * Keccak-f[1600] on 32-bit halves: lane i is (s[2i] = low word, s[2i+1] = high word). 32-bit
 * arithmetic, not BigInt, because a Worker's CPU budget is milliseconds and an EIP-1186 proof is
 * ~60 permutations; the BigInt form of the same permutation is kept in ras.test.ts as the
 * reference this one is cross-checked against.
 */
// Index tables so the hot loop has no modulo: PI_DST[x+5y] = y + 5((2x+3y) mod 5); CHI1/CHI2 are
// the lanes (x+1, y) and (x+2, y) for lane x+5y.
const PI_DST = new Uint8Array(25);
const CHI1 = new Uint8Array(25);
const CHI2 = new Uint8Array(25);
for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) {
  PI_DST[x + 5 * y] = y + 5 * ((2 * x + 3 * y) % 5);
  CHI1[x + 5 * y] = ((x + 1) % 5) + 5 * y;
  CHI2[x + 5 * y] = ((x + 2) % 5) + 5 * y;
}
const KC = new Uint32Array(10);
const KB = new Uint32Array(50);

function keccakF(s: Uint32Array): void {
  const C = KC, B = KB;
  for (let round = 0; round < 24; round++) {
    for (let x = 0; x < 10; x += 2) {
      C[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
      C[x + 1] = s[x + 1] ^ s[x + 11] ^ s[x + 21] ^ s[x + 31] ^ s[x + 41];
    }
    for (let x = 0; x < 5; x++) {
      const x1 = x === 4 ? 0 : 2 * (x + 1), x4 = x === 0 ? 8 : 2 * (x - 1);
      const lo1 = C[x1], hi1 = C[x1 + 1];
      const dlo = C[x4] ^ ((lo1 << 1) | (hi1 >>> 31));
      const dhi = C[x4 + 1] ^ ((hi1 << 1) | (lo1 >>> 31));
      for (let y = 0; y < 50; y += 10) { s[2 * x + y] ^= dlo; s[2 * x + y + 1] ^= dhi; }
    }
    for (let i = 0; i < 25; i++) {
      const lo = s[2 * i], hi = s[2 * i + 1], n = ROT[i], d = 2 * PI_DST[i];
      if (n === 0) { B[d] = lo; B[d + 1] = hi; }
      else if (n < 32) { B[d + 1] = (hi << n) | (lo >>> (32 - n)); B[d] = (lo << n) | (hi >>> (32 - n)); }
      else if (n === 32) { B[d + 1] = lo; B[d] = hi; }
      else { const m = n - 32; B[d + 1] = (lo << m) | (hi >>> (32 - m)); B[d] = (hi << m) | (lo >>> (32 - m)); }
    }
    for (let i = 0; i < 25; i++) {
      const a = 2 * i, b = 2 * CHI1[i], c = 2 * CHI2[i];
      s[a] = B[a] ^ (~B[b] & B[c]);
      s[a + 1] = B[a + 1] ^ (~B[b + 1] & B[c + 1]);
    }
    s[0] ^= RC_LO[round];
    s[1] ^= RC_HI[round];
  }
}

export function keccak256(data: Uint8Array): Uint8Array {
  const rate = 136;
  const padded = new Uint8Array(Math.ceil((data.length + 1) / rate) * rate);
  padded.set(data);
  padded[data.length] ^= 0x01;
  padded[padded.length - 1] ^= 0x80;
  const s = new Uint32Array(50);
  for (let off = 0; off < padded.length; off += rate) {
    for (let w = 0; w < rate / 4; w++) {
      const o = off + 4 * w;
      s[w] ^= padded[o] | (padded[o + 1] << 8) | (padded[o + 2] << 16) | (padded[o + 3] << 24);
    }
    keccakF(s);
  }
  const out = new Uint8Array(32);
  for (let w = 0; w < 8; w++) {
    const v = s[w];
    out[4 * w] = v & 0xff; out[4 * w + 1] = (v >>> 8) & 0xff; out[4 * w + 2] = (v >>> 16) & 0xff; out[4 * w + 3] = (v >>> 24) & 0xff;
  }
  return out;
}

export const toHex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

const HEXV = new Int8Array(128).fill(-1);
for (let i = 0; i < 10; i++) HEXV[48 + i] = i;
for (let i = 0; i < 6; i++) { HEXV[97 + i] = 10 + i; HEXV[65 + i] = 10 + i; }
const hexv = (c: number) => (c < 128 ? HEXV[c] : -1);

/** `_hb` in the reader: hex (with or without 0x, odd length left-padded) → bytes. */
export function hb(h: string): Uint8Array {
  let i = h.startsWith("0x") || h.startsWith("0X") ? 2 : 0;
  const len = h.length - i;
  const out = new Uint8Array((len + (len % 2)) / 2);
  let o = 0;
  if (len % 2) {
    const v = hexv(h.charCodeAt(i++));
    if (v < 0) throw new ProofError("bad hex");
    out[o++] = v;
  }
  for (; i < h.length; i += 2) {
    const a = hexv(h.charCodeAt(i)), b = hexv(h.charCodeAt(i + 1));
    if (a < 0 || b < 0) throw new ProofError("bad hex");
    out[o++] = (a << 4) | b;
  }
  return out;
}

export class ProofError extends Error {
  name = "ProofError";
}

export type Rlp = Uint8Array | Rlp[];

const beInt = (b: Uint8Array) => b.reduce((acc, x) => acc * 256 + x, 0);

export function rlpDecode(b: Uint8Array): Rlp {
  const item = (i: number): [Rlp, number] => {
    if (i >= b.length) throw new ProofError("rlp: truncated");
    const p = b[i];
    if (p < 0x80) return [b.subarray(i, i + 1), i + 1];
    if (p < 0xb8) { const n = p - 0x80; return [b.subarray(i + 1, i + 1 + n), i + 1 + n]; }
    if (p < 0xc0) {
      const ll = p - 0xb7;
      const n = beInt(b.subarray(i + 1, i + 1 + ll));
      const s = i + 1 + ll;
      return [b.subarray(s, s + n), s + n];
    }
    let n: number, s: number;
    if (p < 0xf8) { n = p - 0xc0; s = i + 1; }
    else { const ll = p - 0xf7; n = beInt(b.subarray(i + 1, i + 1 + ll)); s = i + 1 + ll; }
    const out: Rlp[] = [];
    let j = s;
    while (j < s + n) { const [v, k] = item(j); out.push(v); j = k; }
    if (j !== s + n) throw new ProofError("rlp: list length mismatch");
    return [out, s + n];
  };
  const [v, end] = item(0);
  if (end !== b.length) throw new ProofError("rlp: trailing bytes");
  return v;
}

function intBytes(n: number): Uint8Array {
  const out: number[] = [];
  while (n > 0) { out.unshift(n % 256); n = Math.floor(n / 256); }
  return Uint8Array.from(out);
}

function rlpLen(n: number, off: number): Uint8Array {
  if (n < 56) return Uint8Array.of(off + n);
  const bl = intBytes(n);
  return Uint8Array.from([off + 55 + bl.length, ...bl]);
}

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

export function rlpEncode(x: Rlp): Uint8Array {
  if (x instanceof Uint8Array) {
    if (x.length === 1 && x[0] < 0x80) return x;
    return concat([rlpLen(x.length, 0x80), x]);
  }
  const body = concat(x.map(rlpEncode));
  return concat([rlpLen(body.length, 0xc0), body]);
}

const nibbles = (b: Uint8Array) => { const out: number[] = []; for (const c of b) out.push(c >> 4, c & 15); return out; };
const eqBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Walk a Merkle-Patricia proof. Leaf value, null when the proof shows absence; throws when inconsistent with root. */
export function mptGet(root: Uint8Array, key: Uint8Array, proof: Uint8Array[]): Uint8Array | null {
  const db = new Map<string, Uint8Array>();
  for (const n of proof) db.set(toHex(keccak256(n)), n);
  let nib = nibbles(key);
  let ref: Rlp = root;
  for (let step = 0; step < 200; step++) {
    let node: Rlp[];
    if (Array.isArray(ref)) node = ref; // inline node
    else {
      if (ref.length === 0) return null;
      const got = db.get(toHex(ref));
      if (ref.length !== 32 || !got) throw new ProofError(`node ${toHex(ref).slice(0, 16)}… not in proof`);
      const dec = rlpDecode(got);
      if (!Array.isArray(dec)) throw new ProofError("node is not a list");
      node = dec;
    }
    if (node.length === 17) {
      if (!nib.length) { const v = node[16] as Uint8Array; return v.length ? v : null; }
      ref = node[nib[0]];
      nib = nib.slice(1);
      if (ref instanceof Uint8Array && ref.length === 0) return null;
    } else if (node.length === 2) {
      const path = node[0] as Uint8Array;
      if (!path.length) throw new ProofError("empty hex-prefix path");
      const flag = path[0] >> 4;
      const pn = [...(flag & 1 ? [path[0] & 15] : []), ...nibbles(path.subarray(1))];
      if (flag >= 2) {
        const same = pn.length === nib.length && pn.every((v, i) => v === nib[i]);
        return same ? (node[1] as Uint8Array) : null;
      }
      if (!pn.every((v, i) => nib[i] === v) || nib.length < pn.length) return null;
      nib = nib.slice(pn.length);
      ref = node[1];
    } else throw new ProofError(`node with ${node.length} items`);
  }
  throw new ProofError("proof too deep");
}

/** (json key, is_int) in RLP order, London → Prague — the reader's HEADER_FIELDS. */
export const HEADER_FIELDS: [string, boolean][] = [
  ["parentHash", false], ["sha3Uncles", false], ["miner", false], ["stateRoot", false], ["transactionsRoot", false],
  ["receiptsRoot", false], ["logsBloom", false], ["difficulty", true], ["number", true], ["gasLimit", true],
  ["gasUsed", true], ["timestamp", true], ["extraData", false], ["mixHash", false], ["nonce", false],
  ["baseFeePerGas", true], ["withdrawalsRoot", false], ["blobGasUsed", true], ["excessBlobGas", true],
  ["parentBeaconBlockRoot", false], ["requestsHash", false],
];

export function headerHash(block: Record<string, unknown>): string {
  const items: Uint8Array[] = [];
  for (const [k, isInt] of HEADER_FIELDS) {
    const v = block[k];
    if (v === undefined || v === null) continue;
    if (isInt) {
      const n = BigInt(String(v));
      items.push(n === 0n ? new Uint8Array(0) : hb(n.toString(16)));
    } else items.push(hb(String(v)));
  }
  return "0x" + toHex(keccak256(rlpEncode(items)));
}

const beBig = (b: Uint8Array) => b.reduce((acc, x) => (acc << 8n) | BigInt(x), 0n);
const slotKey = (slot: number) => { const k = new Uint8Array(32); let n = BigInt(slot); for (let i = 31; i >= 0 && n > 0n; i--) { k[i] = Number(n & 0xffn); n >>= 8n; } return k; };

export type Eip1186Proof = {
  accountProof: string[];
  storageHash: string;
  storageProof: { key: string; value: string; proof: string[] }[];
};

export type Eip1186Check = {
  account_proof_verified: boolean;
  storage_proof_verified: boolean;
  proven_value: string | null;
  proven_storage_root?: string;
  proven_code_hash?: string;
  error: string | null;
};

/** Account proof against stateRoot, then storage proof against the proven account's storageRoot. */
export function verifyEip1186(stateRoot: string, address: string, proof: Eip1186Proof, slot: number): Eip1186Check {
  const out: Eip1186Check = { account_proof_verified: false, storage_proof_verified: false, proven_value: null, error: null };
  try {
    const acctRaw = mptGet(hb(stateRoot), keccak256(hb(address)), proof.accountProof.map(hb));
    if (acctRaw === null) throw new ProofError("account proven ABSENT at this stateRoot");
    const acct = rlpDecode(acctRaw);
    if (!Array.isArray(acct) || acct.length !== 4) throw new ProofError("account leaf is not [nonce, balance, storageRoot, codeHash]");
    const storageRoot = acct[2] as Uint8Array;
    const codeHash = acct[3] as Uint8Array;
    if ("0x" + toHex(storageRoot) !== String(proof.storageHash).toLowerCase()) throw new ProofError("account storageRoot in proven leaf != storageHash in response");
    out.account_proof_verified = true;
    out.proven_storage_root = "0x" + toHex(storageRoot);
    out.proven_code_hash = "0x" + toHex(codeHash);
    const sp = (proof.storageProof || []).filter((s) => BigInt(s.key) === BigInt(slot));
    if (!sp.length) throw new ProofError(`no storage proof for slot ${slot}`);
    const leaf = mptGet(storageRoot, keccak256(slotKey(slot)), sp[0].proof.map(hb));
    let val = 0n;
    if (leaf !== null) {
      const dec = rlpDecode(leaf);
      if (!(dec instanceof Uint8Array)) throw new ProofError("storage leaf is not a byte string");
      val = beBig(dec);
    }
    if (val !== BigInt(sp[0].value)) throw new ProofError("proven slot value != value field in response");
    out.storage_proof_verified = true;
    out.proven_value = val.toString();
  } catch (e) {
    out.error = `${(e as Error).name || "Error"}: ${(e as Error).message}`;
  }
  return out;
}

export { eqBytes };
