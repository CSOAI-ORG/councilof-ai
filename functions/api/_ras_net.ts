/**
 * _ras_net — the ONE outbound-fetch path the self-serve RAS doors use to touch a URL a buyer
 * named. Every door that fetches a caller-chosen URL goes through `guardedFetch`; nothing in
 * functions/api/ras/ calls `fetch` on a buyer's URL directly.
 *
 * WHY A GUARD AT ALL ON A WORKER. A Pages Function runs on Cloudflare's edge, which does not
 * route to RFC 1918 space or to a cloud metadata service, so the classic SSRF targets are mostly
 * unreachable from here by construction. "Mostly" is not a property a door that fetches arbitrary
 * URLs for money should rest on: the runtime can change, a public name can resolve to a private
 * address, and a public URL can redirect to one. So every hop is checked here, before it is
 * fetched, and the refusal is a named reason, never a silent drop.
 *
 * What is refused (each is a test in functions/api/ras/ras.test.ts):
 *   - any scheme but https; any port but 443; userinfo in the URL
 *   - hostnames that are not public names: localhost, single-label names, *.local, *.localhost,
 *     *.internal, *.intranet, *.lan, *.corp, *.home.arpa, *.private
 *   - IP literals (v4 in every WHATWG-normalised spelling, v6) in loopback, private, CGNAT,
 *     link-local (incl. 169.254.169.254 metadata), multicast, reserved, documentation, benchmark,
 *     ULA, IPv4-mapped/NAT64/6to4/Teredo forms of any of those, and the Azure wireserver
 *     168.63.129.16 (a public-range address that is a metadata endpoint)
 *   - a public name whose DNS answers (A + AAAA, read over DNS-over-HTTPS) include ANY address
 *     in the classes above — one bad record is enough
 *   - a redirect to any of the above: redirects are followed MANUALLY, each Location is checked
 *     as a fresh URL, and the hop count is capped
 * DNS that cannot be read at all fails CLOSED (DNS_CHECK_UNAVAILABLE): an unprovable host is not
 * fetched. A name that resolves to nothing is not an SSRF risk; it is reported as UNRESOLVED so
 * the door can deliver "UNREACHABLE" as the finding it is.
 *
 * Residual, stated: DNS is read once per hop and the fetch then resolves again (a rebinding window).
 * The edge's own routing is the second layer for that window; this module does not claim to close it.
 */

export type BlockReason =
  | "BAD_URL"
  | "NOT_HTTPS"
  | "NON_DEFAULT_PORT"
  | "USERINFO_IN_URL"
  | "NON_PUBLIC_HOSTNAME"
  | "NON_PUBLIC_IP"
  | "RESOLVES_TO_NON_PUBLIC_IP"
  | "DNS_CHECK_UNAVAILABLE"
  | "REDIRECT_TO_BLOCKED"
  | "TOO_MANY_REDIRECTS";

export type UrlCheck = { ok: true; url: URL } | { ok: false; reason: BlockReason; detail: string };

const BLOCKED_SUFFIXES = [".local", ".localhost", ".internal", ".intranet", ".lan", ".corp", ".home.arpa", ".private", ".localdomain"];

/** Parse dotted-quad IPv4 (already WHATWG-normalised) into 4 octets, or null. */
function v4Octets(s: string): number[] | null {
  const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  return o.every((n) => n >= 0 && n <= 255) ? o : null;
}

/** True when an IPv4 address is NOT globally routable public unicast (or is a metadata address). */
export function isNonPublicV4(ip: string): boolean {
  const o = v4Octets(ip);
  if (!o) return true; // unparseable is not provably public
  const [a, b, c] = o;
  if (a === 0) return true; // 0.0.0.0/8 "this network"
  if (a === 10) return true; // 10/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10 CGNAT (incl. 100.100.100.200 metadata)
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0/24 IETF protocol assignments
  if (a === 192 && b === 0 && c === 2) return true; // TEST-NET-1
  if (a === 192 && b === 88 && c === 99) return true; // 6to4 relay anycast (deprecated)
  if (a === 192 && b === 168) return true; // 192.168/16
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast 224/4, reserved 240/4, broadcast
  if (ip === "168.63.129.16") return true; // Azure wireserver / metadata, public range
  return false;
}

/** Expand an IPv6 literal (no brackets, no zone) into 8 hextets, or null. */
export function v6Hextets(s: string): number[] | null {
  let str = s.toLowerCase();
  if (str.includes("%")) return null; // zone ids are link-local by definition
  // embedded dotted IPv4 tail
  const tail = str.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (tail) {
    const o = v4Octets(tail[1]);
    if (!o) return null;
    str = str.slice(0, -tail[1].length) + ((o[0] << 8) | o[1]).toString(16) + ":" + ((o[2] << 8) | o[3]).toString(16);
  }
  const parts = str.split("::");
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(":") : [];
  const rest = parts.length === 2 && parts[1] ? parts[1].split(":") : [];
  const fill = parts.length === 2 ? 8 - head.length - rest.length : 0;
  if (fill < 0) return null;
  const all = [...head, ...Array(fill).fill("0"), ...rest];
  if (all.length !== 8) return null;
  const out = all.map((h) => (/^[0-9a-f]{1,4}$/.test(h) ? parseInt(h, 16) : NaN));
  return out.every((n) => Number.isFinite(n)) ? out : null;
}

/** True when an IPv6 address is NOT globally routable public unicast. Embedded IPv4 is re-checked. */
export function isNonPublicV6(ip: string): boolean {
  const h = v6Hextets(ip);
  if (!h) return true;
  if (h.every((x) => x === 0)) return true; // ::
  if (h.slice(0, 7).every((x) => x === 0) && h[7] === 1) return true; // ::1
  // ::ffff:a.b.c.d — refused whatever v4 it maps: a mapped literal is only ever a way to spell
  // an IPv4 address past a v4 check, so there is no legitimate buyer input it would block.
  if (h.slice(0, 5).every((x) => x === 0) && h[5] === 0xffff) return true;
  if (h.slice(0, 6).every((x) => x === 0)) return true; // ::a.b.c.d (deprecated compatible)
  if (h[0] === 0x64 && h[1] === 0xff9b) return true; // NAT64 64:ff9b::/96 (and /48 local-use)
  if (h[0] === 0x0100 && h[1] === 0 && h[2] === 0 && h[3] === 0) return true; // discard-only 100::/64
  if (h[0] === 0x2001 && h[1] === 0) return true; // Teredo 2001::/32
  if (h[0] === 0x2001 && h[1] === 0x0db8) return true; // documentation
  if (h[0] === 0x2002) return true; // 6to4 — embeds an arbitrary v4
  if ((h[0] & 0xfe00) === 0xfc00) return true; // ULA fc00::/7 (incl. AWS fd00:ec2::254)
  if ((h[0] & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if ((h[0] & 0xffc0) === 0xfec0) return true; // site-local (deprecated)
  if ((h[0] & 0xff00) === 0xff00) return true; // multicast
  return false;
}

export function isNonPublicIp(ip: string): boolean {
  return ip.includes(":") ? isNonPublicV6(ip) : isNonPublicV4(ip);
}

/** Syntactic check of one URL — no network. The WHATWG parser normalises 0x7f.1, 2130706433 etc. to dotted quads first. */
export function checkUrlSyntax(raw: string | URL): UrlCheck {
  let u: URL;
  try {
    u = raw instanceof URL ? new URL(raw.toString()) : new URL(String(raw).trim());
  } catch {
    return { ok: false, reason: "BAD_URL", detail: "not an absolute URL" };
  }
  if (u.protocol !== "https:") return { ok: false, reason: "NOT_HTTPS", detail: `scheme ${u.protocol} refused; https only` };
  if (u.username || u.password) return { ok: false, reason: "USERINFO_IN_URL", detail: "credentials in the URL are refused" };
  if (u.port && u.port !== "443") return { ok: false, reason: "NON_DEFAULT_PORT", detail: `port ${u.port} refused; 443 only` };
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[")) {
    const lit = host.slice(1, -1);
    if (isNonPublicV6(lit)) return { ok: false, reason: "NON_PUBLIC_IP", detail: `IPv6 literal ${lit} is not public unicast` };
    return { ok: true, url: u };
  }
  if (v4Octets(host)) {
    if (isNonPublicV4(host)) return { ok: false, reason: "NON_PUBLIC_IP", detail: `IPv4 literal ${host} is not public unicast` };
    return { ok: true, url: u };
  }
  if (host === "localhost" || !host.includes(".") || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    return { ok: false, reason: "NON_PUBLIC_HOSTNAME", detail: `${host} is not a public DNS name` };
  }
  if (host.length > 253 || !/^[a-z0-9.-]+$/.test(host)) return { ok: false, reason: "BAD_URL", detail: "hostname is not a valid DNS name" };
  return { ok: true, url: u };
}

export type Resolution = { state: "RESOLVED"; addresses: string[] } | { state: "UNRESOLVED" } | { state: "UNAVAILABLE"; detail: string };
export type Resolver = (host: string) => Promise<Resolution>;

const DOH = "https://cloudflare-dns.com/dns-query";

/** Default resolver: A + AAAA over DNS-over-HTTPS (JSON). Any failure to READ is UNAVAILABLE (fail closed). */
export const dohResolver: Resolver = async (host) => {
  const addresses: string[] = [];
  for (const type of ["A", "AAAA"]) {
    let j: { Status?: number; Answer?: { type: number; data: string }[] };
    try {
      const r = await fetch(`${DOH}?name=${encodeURIComponent(host)}&type=${type}`, {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) return { state: "UNAVAILABLE", detail: `DoH HTTP ${r.status}` };
      j = await r.json();
    } catch (e) {
      return { state: "UNAVAILABLE", detail: `DoH ${(e as Error).name || "error"}` };
    }
    if (j.Status === 3) continue; // NXDOMAIN
    if (j.Status !== 0) return { state: "UNAVAILABLE", detail: `DoH status ${j.Status}` };
    for (const a of j.Answer || []) if (a.type === 1 || a.type === 28) addresses.push(String(a.data));
  }
  if (!addresses.length) return { state: "UNRESOLVED" };
  return { state: "RESOLVED", addresses };
};

/** Per-computation memo: one DNS read per host per probe, however many requests the probe sends. */
export function memoResolver(inner: Resolver): Resolver {
  const seen = new Map<string, Promise<Resolution>>();
  return (host) => {
    let p = seen.get(host);
    if (!p) { p = inner(host); seen.set(host, p); }
    return p;
  };
}

export type HostCheck =
  | { ok: true; url: URL; resolution: "RESOLVED" | "IP_LITERAL"; addresses: string[] }
  | { ok: true; url: URL; resolution: "UNRESOLVED"; addresses: [] }
  | { ok: false; reason: BlockReason; detail: string };

/** Syntax + DNS. UNRESOLVED is ok:true (nothing to reach, nothing to leak) — the fetch will fail and say so. */
export async function checkUrl(raw: string | URL, resolver: Resolver = dohResolver): Promise<HostCheck> {
  const s = checkUrlSyntax(raw);
  if (s.ok === false) return s;
  const host = s.url.hostname.toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[") || v4Octets(host)) return { ok: true, url: s.url, resolution: "IP_LITERAL", addresses: [host.replace(/^\[|\]$/g, "")] };
  const r = await resolver(host);
  if (r.state === "UNAVAILABLE") return { ok: false, reason: "DNS_CHECK_UNAVAILABLE", detail: `could not read DNS for ${host} (${r.detail}); an unprovable host is not fetched` };
  if (r.state === "UNRESOLVED") return { ok: true, url: s.url, resolution: "UNRESOLVED", addresses: [] };
  const bad = r.addresses.filter((a) => isNonPublicIp(a));
  if (bad.length) return { ok: false, reason: "RESOLVES_TO_NON_PUBLIC_IP", detail: `${host} resolves to non-public ${bad.join(", ")}` };
  return { ok: true, url: s.url, resolution: "RESOLVED", addresses: r.addresses };
}

export type FetchOutcome =
  | {
      kind: "RESPONSE";
      status: number;
      headers: Headers;
      body: Uint8Array;
      truncated: boolean;
      final_url: string;
      hops: { url: string; status: number }[];
      elapsed_ms: number;
    }
  | { kind: "BLOCKED"; reason: BlockReason; detail: string; hops: { url: string; status: number }[] }
  | { kind: "TIMEOUT"; detail: string; hops: { url: string; status: number }[]; elapsed_ms: number }
  | { kind: "UNREACHABLE"; detail: string; hops: { url: string; status: number }[]; elapsed_ms: number };

export type GuardedFetchOpts = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
  /** Redirect statuses that are followed. POST follows only method-preserving 307/308. */
  follow?: number[];
  resolver?: Resolver;
};

async function readCapped(res: Response, maxBytes: number): Promise<{ body: Uint8Array; truncated: boolean }> {
  if (!res.body) return { body: new Uint8Array(0), truncated: false };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let n = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (n + value.byteLength > maxBytes) {
      chunks.push(value.subarray(0, maxBytes - n));
      n = maxBytes;
      truncated = true;
      try { await reader.cancel(); } catch { /* already closed */ }
      break;
    }
    chunks.push(value);
    n += value.byteLength;
  }
  const out = new Uint8Array(n);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  return { body: out, truncated };
}

/**
 * guardedFetch — check, fetch, and follow redirects by hand, re-checking every hop. One overall
 * deadline (timeoutMs) covers every hop and the body read, so a slow-drip body cannot hold the
 * door open past it. The body is read up to maxBytes and then cut, flagged `truncated`.
 */
export async function guardedFetch(raw: string, opts: GuardedFetchOpts): Promise<FetchOutcome> {
  const t0 = Date.now();
  const hops: { url: string; status: number }[] = [];
  const follow = opts.follow ?? (opts.method === "POST" ? [307, 308] : [301, 302, 303, 307, 308]);
  const signal = AbortSignal.timeout(opts.timeoutMs);
  let current = raw;
  for (let hop = 0; hop <= opts.maxRedirects; hop++) {
    const chk = await checkUrl(current, opts.resolver);
    if (chk.ok === false) {
      return { kind: "BLOCKED", reason: hop === 0 ? chk.reason : "REDIRECT_TO_BLOCKED", detail: hop === 0 ? chk.detail : `redirect ${hop} to ${current}: ${chk.reason} — ${chk.detail}`, hops };
    }
    if (chk.resolution === "UNRESOLVED") {
      return { kind: "UNREACHABLE", detail: `${chk.url.hostname} does not resolve (no A/AAAA)`, hops, elapsed_ms: Date.now() - t0 };
    }
    let res: Response;
    try {
      res = await fetch(chk.url.toString(), {
        method: opts.method || "GET",
        headers: opts.headers,
        body: opts.method === "POST" ? opts.body : undefined,
        redirect: "manual",
        signal,
      });
    } catch (e) {
      const name = (e as Error).name || "";
      if (name === "TimeoutError" || name === "AbortError") return { kind: "TIMEOUT", detail: `no response within ${opts.timeoutMs} ms`, hops, elapsed_ms: Date.now() - t0 };
      return { kind: "UNREACHABLE", detail: `${name || "fetch error"}: ${String((e as Error).message || e).slice(0, 160)}`, hops, elapsed_ms: Date.now() - t0 };
    }
    hops.push({ url: chk.url.toString(), status: res.status });
    const loc = res.headers.get("location");
    if (follow.includes(res.status) && loc) {
      try { await res.body?.cancel(); } catch { /* ignore */ }
      if (hop === opts.maxRedirects) return { kind: "BLOCKED", reason: "TOO_MANY_REDIRECTS", detail: `more than ${opts.maxRedirects} redirects`, hops };
      try { current = new URL(loc, chk.url).toString(); } catch { return { kind: "UNREACHABLE", detail: "unparseable Location header", hops, elapsed_ms: Date.now() - t0 }; }
      continue;
    }
    try {
      const { body, truncated } = await readCapped(res, opts.maxBytes);
      return { kind: "RESPONSE", status: res.status, headers: res.headers, body, truncated, final_url: chk.url.toString(), hops, elapsed_ms: Date.now() - t0 };
    } catch (e) {
      const name = (e as Error).name || "";
      if (name === "TimeoutError" || name === "AbortError") return { kind: "TIMEOUT", detail: `body not complete within ${opts.timeoutMs} ms`, hops, elapsed_ms: Date.now() - t0 };
      return { kind: "UNREACHABLE", detail: `body read failed: ${name}`, hops, elapsed_ms: Date.now() - t0 };
    }
  }
  return { kind: "BLOCKED", reason: "TOO_MANY_REDIRECTS", detail: `more than ${opts.maxRedirects} redirects`, hops };
}
