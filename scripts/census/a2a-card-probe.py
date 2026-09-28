#!/usr/bin/env python3
"""A2A agent cards of every a2aregistry listing: GET the card, parse it, check its signatures.
Read-only. It never sends a task, a message, or any JSON-RPC call to an agent.

What it sends, and nothing more:
  GET /robots.txt (once per host)  ->  GET <card URL> for up to three candidates, stopping at the
  first that serves a card:  (1) the listing's own wellKnownURI, (2) <origin>/.well-known/agent-card.json,
  (3) <origin>/.well-known/agent.json (legacy name).  Same-host redirects followed (<= 3).
  Then, only for a card whose signature names a key location: one GET of that JWKS (`jku`) or
  did:web document (`kid` = did:web:...#frag), cached per URL.
Politeness: mcp-remote-probe.py's HostGate (one connection per host, >= 1 s between requests),
robots.txt for token CSOAI-census, 429/503 Retry-After with one retry.
Never contacted: hosts that resolve to a loopback, private, link-local, CGNAT (100.64/10, e.g. a
tailnet) or otherwise non-global address (NON_PUBLIC_ADDRESS), because such a request would land
on some network other than the agent's, possibly our own.

States (exactly one per listing):
  CARD_SERVED         a JSON object that parses as an agent card (name + skills/url/interfaces)
  CARD_INVALID        HTTP 200 at a candidate, but not a JSON agent card (HTML, other JSON)
  AUTH_REQUIRED       401/403 and no candidate served a card
  NOT_FOUND           every candidate answered 404/410 (or another 4xx)
  UNREACHABLE         DNS, refused, TLS, reset, 5xx, off-host redirect only
  TIMEOUT             connect or read timeout
  NON_PUBLIC_ADDRESS  not contacted (see above); checked for EVERY candidate host, not only the first
  HF_SPACE_NOT_CONTACTED  every candidate is a *.hf.space host: a request could wake a sleeping Space
  ROBOTS_DISALLOWED   robots.txt (rules, or a 5xx/429 robots.txt = disallow-all) forbids the candidates
  INVALID_URL         the listing's URL is not an absolute http(s) URL

Signature check (CARD_SERVED only), per A2A AgentCardSignature: a detached JWS, `protected` +
"." + base64url(JCS(card without `signatures`)) (RFC 7515 + RFC 8785). Per card:
  NO_SIGNATURES   no `signatures` array (or an empty one)
  VERIFIED        at least one signature verifies under a key the card itself points to, and none fails
  FAILED          a key was found and a signature did not verify under it
  UNCHECKABLE     signatures present, but no key the card points to could be obtained (no jku, no
                  embedded jwk, no did:web kid; key URL unreachable; kid not in the JWKS; alg
                  unsupported or symmetric). `reason` says which.
An embedded `jwk` proves integrity only (the card vouches for its own key): recorded as
key_source "embedded_jwk", counted separately.

Usage:
  a2a-card-probe.py --frame /evac-bulk/census-frame-2026-09-25 --out /evac-bulk/census-a2a-2026-09-25
"""
from __future__ import annotations

import argparse
import base64
import collections
import gzip
import hashlib
import importlib.util
import ipaddress
import json
import os
import socket
import sys
import threading
import time
import urllib.parse
import urllib.robotparser

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("mcp_remote_probe", os.path.join(HERE, "mcp-remote-probe.py"))
P = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(P)

SCHEMA = "csoai.census-a2a-cards/0.1"
STATES = ("CARD_SERVED", "CARD_INVALID", "AUTH_REQUIRED", "NOT_FOUND", "UNREACHABLE", "TIMEOUT",
          "NON_PUBLIC_ADDRESS", "HF_SPACE_NOT_CONTACTED", "ROBOTS_DISALLOWED", "INVALID_URL")
SIG_STATES = ("NO_SIGNATURES", "VERIFIED", "FAILED", "UNCHECKABLE")
MAX_REDIRECTS = 3


# ---------------------------------------------------------------- canonical JSON (RFC 8785)
def _jcs_num(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if v != v or v in (float("inf"), float("-inf")):
        raise ValueError("JCS: non-finite number")
    if v == 0:
        return "0"
    if v.is_integer() and abs(v) < 1e21:
        return str(int(v))
    r = repr(v)  # shortest round-trip, as ES6 Number.prototype.toString for these ranges
    if "e" in r:
        m, e = r.split("e")
        e = int(e)
        if -7 < e < 21:
            return format(v, "f").rstrip("0").rstrip(".") if e < 0 else str(v)
        return f"{m}e{'+' if e > 0 else '-'}{abs(e)}"
    return r


def jcs(v):
    if v is None:
        return "null"
    if isinstance(v, (bool, int, float)):
        return _jcs_num(v)
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=False)
    if isinstance(v, list):
        return "[" + ",".join(jcs(x) for x in v) + "]"
    if isinstance(v, dict):
        ks = sorted(v, key=lambda k: k.encode("utf-16-be"))
        return "{" + ",".join(json.dumps(k, ensure_ascii=False) + ":" + jcs(v[k]) for k in ks) + "}"
    raise TypeError(type(v).__name__)


def b64u_dec(s):
    s = s.strip()
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def b64u(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


# ---------------------------------------------------------------- JWS verification (pure)
def _int(b):
    return int.from_bytes(b64u_dec(b), "big")


def jwk_to_key(jwk):
    """-> (public key, None) or (None, reason)."""
    from cryptography.hazmat.primitives.asymmetric import ec, ed25519, rsa
    kty = jwk.get("kty")
    try:
        if kty == "EC":
            curve = {"P-256": ec.SECP256R1(), "P-384": ec.SECP384R1(), "P-521": ec.SECP521R1()}.get(jwk.get("crv"))
            if curve is None:
                return None, f"EC curve {jwk.get('crv')} unsupported"
            return ec.EllipticCurvePublicNumbers(_int(jwk["x"]), _int(jwk["y"]), curve).public_key(), None
        if kty == "RSA":
            return rsa.RSAPublicNumbers(_int(jwk["e"]), _int(jwk["n"])).public_key(), None
        if kty == "OKP" and jwk.get("crv") == "Ed25519":
            return ed25519.Ed25519PublicKey.from_public_bytes(b64u_dec(jwk["x"])), None
    except Exception as e:
        return None, f"jwk unusable: {type(e).__name__}"
    return None, f"kty {kty}/{jwk.get('crv')} unsupported"


def jws_verify(alg, key, signing_input, sig):
    """-> True/False, or None if alg unsupported for this key."""
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import ec, ed25519, padding, rsa, utils
    h = {"256": hashes.SHA256(), "384": hashes.SHA384(), "512": hashes.SHA512()}.get(str(alg)[-3:])
    try:
        if alg in ("ES256", "ES384", "ES512") and isinstance(key, ec.EllipticCurvePublicKey):
            n = len(sig) // 2
            der = utils.encode_dss_signature(int.from_bytes(sig[:n], "big"), int.from_bytes(sig[n:], "big"))
            key.verify(der, signing_input, ec.ECDSA(h))
            return True
        if alg in ("RS256", "RS384", "RS512") and isinstance(key, rsa.RSAPublicKey):
            key.verify(sig, signing_input, padding.PKCS1v15(), h)
            return True
        if alg in ("PS256", "PS384", "PS512") and isinstance(key, rsa.RSAPublicKey):
            key.verify(sig, signing_input, padding.PSS(padding.MGF1(h), h.digest_size), h)
            return True
        if alg in ("EdDSA", "Ed25519") and isinstance(key, ed25519.Ed25519PublicKey):
            key.verify(sig, signing_input)
            return True
    except InvalidSignature:
        return False
    except Exception:
        return False
    return None


def key_pointer(header):
    """What the signature says about where its key is. -> dict with kind in
    embedded_jwk | jku | did_web | none."""
    if isinstance(header.get("jwk"), dict):
        return {"kind": "embedded_jwk", "jwk": header["jwk"]}
    if isinstance(header.get("jku"), str) and header["jku"].startswith("https://"):
        return {"kind": "jku", "url": header["jku"], "kid": header.get("kid")}
    kid = header.get("kid")
    if isinstance(kid, str) and kid.startswith("did:web:"):
        return {"kind": "did_web", "url": did_web_url(kid), "kid": kid}
    return {"kind": "none", "kid": kid, "jku_non_https": header.get("jku") if "jku" in header else None}


def did_web_url(did_url):
    did = did_url.split("#", 1)[0]
    parts = did[len("did:web:"):].split(":")
    host = urllib.parse.unquote(parts[0])
    path = "/".join(parts[1:])
    return f"https://{host}/{path + '/' if path else '.well-known/'}did.json"


def keys_from_doc(pointer, doc):
    """JWKS or DID document -> list of candidate JWKs (by kid when the pointer names one)."""
    if not isinstance(doc, dict):
        return []
    if pointer["kind"] == "jku":
        ks = [k for k in (doc.get("keys") or []) if isinstance(k, dict)]
        kid = pointer.get("kid")
        if kid is not None:
            ks = [k for k in ks if k.get("kid") == kid]
        return ks
    if pointer["kind"] == "did_web":
        frag = pointer["kid"].split("#", 1)[1] if "#" in pointer["kid"] else None
        out = []
        for vm in doc.get("verificationMethod") or []:
            if not isinstance(vm, dict) or not isinstance(vm.get("publicKeyJwk"), dict):
                continue
            vid = str(vm.get("id", ""))
            if frag is None or vid == pointer["kid"] or vid.endswith("#" + frag):
                out.append(vm["publicKeyJwk"])
        return out
    return []


ALT_SERIALISATIONS = {
    "json_sorted_compact_ascii": lambda b: json.dumps(b, sort_keys=True, separators=(",", ":")),
    "json_sorted_compact_utf8": lambda b: json.dumps(b, sort_keys=True, separators=(",", ":"), ensure_ascii=False),
    "json_insertion_order_compact": lambda b: json.dumps(b, separators=(",", ":"), ensure_ascii=False),
    "jcs_with_empty_signatures": lambda b: jcs(dict(b, signatures=[])),
}


def alt_serialisations(body, protected, sig, alg, jwks):
    """DIAGNOSTIC ONLY (never changes a FAILED): which non-spec serialisations of the same card, if
    any, the signature verifies over - so a FAILED caused by our canonicalisation would show up."""
    hits = []
    for name, f in ALT_SERIALISATIONS.items():
        try:
            txt = f(body)
        except (TypeError, ValueError):
            continue
        for mode, si in (("b64", protected + "." + b64u(txt.encode())), ("unencoded", protected + "." + txt)):
            for jwk in jwks[:5]:
                key, _why = jwk_to_key(jwk)
                if key is not None and jws_verify(alg, key, si.encode("utf-8"), sig):
                    hits.append(f"{name}/{mode}")
    return sorted(set(hits))


def check_signatures(card, fetch_doc):
    """Pure given fetch_doc(url) -> (doc or None, reason). -> dict with sig_state + per-signature detail."""
    sigs = card.get("signatures")
    if not isinstance(sigs, list) or not sigs:
        return {"sig_state": "NO_SIGNATURES", "n_signatures": 0}
    body = {k: v for k, v in card.items() if k != "signatures"}
    try:
        payload = b64u(jcs(body).encode("utf-8"))
    except (TypeError, ValueError) as e:
        return {"sig_state": "UNCHECKABLE", "n_signatures": len(sigs), "reason": f"JCS failed: {e}"}
    detail = []
    for s in sigs[:5]:
        d = {}
        detail.append(d)
        if not isinstance(s, dict) or not isinstance(s.get("protected"), str) or not isinstance(s.get("signature"), str):
            d.update(result="UNCHECKABLE", reason="signature object lacks protected/signature strings")
            continue
        try:
            hdr = json.loads(b64u_dec(s["protected"]))
            sig = b64u_dec(s["signature"])
        except Exception:
            d.update(result="UNCHECKABLE", reason="protected header or signature not base64url JSON")
            continue
        if not isinstance(hdr, dict):
            d.update(result="UNCHECKABLE", reason="protected header not a JSON object")
            continue
        unprot = s.get("header") if isinstance(s.get("header"), dict) else {}
        merged = {**unprot, **hdr}
        alg = merged.get("alg")
        d.update(alg=alg, kid=P.clip(str(merged.get("kid")), 120) if merged.get("kid") is not None else None,
                 typ=merged.get("typ"), jku=P.clip(merged.get("jku"), 200) if isinstance(merged.get("jku"), str) else None,
                 key_in_protected_header=any(k in hdr for k in ("jwk", "jku", "kid")))
        if str(alg).startswith("HS") or alg in (None, "none"):
            d.update(result="UNCHECKABLE", reason=f"alg {alg}: no public key can verify it")
            continue
        ptr = key_pointer(merged)
        d["key_source"] = ptr["kind"]
        if ptr["kind"] == "none":
            d.update(result="UNCHECKABLE", reason="no jku, no embedded jwk, no did:web kid: the card points to no key")
            continue
        if ptr["kind"] == "embedded_jwk":
            jwks = [ptr["jwk"]]
        else:
            doc, why = fetch_doc(ptr["url"])
            d["key_url"] = P.clip(ptr["url"], 200)
            if doc is None:
                d.update(result="UNCHECKABLE", reason=f"key document not obtained: {why}")
                continue
            jwks = keys_from_doc(ptr, doc)
            if not jwks:
                d.update(result="UNCHECKABLE", reason="key document has no key matching kid")
                continue
        signing_input = (s["protected"] + "." + payload).encode("ascii")
        outcomes = []
        for jwk in jwks[:5]:
            key, why = jwk_to_key(jwk)
            if key is None:
                outcomes.append(("unusable", why))
                continue
            ok = jws_verify(alg, key, signing_input, sig)
            outcomes.append(("unsupported" if ok is None else ok, None))
        if any(o[0] is True for o in outcomes):
            d["result"] = "VERIFIED"
        elif any(o[0] is False for o in outcomes):
            d["result"] = "FAILED"
            d["reason"] = "signature does not verify over JCS(card without signatures) under the pointed-to key"
            want = {"ES256": 64, "ES384": 96, "ES512": 132}.get(alg)
            if want and len(sig) != want:
                d["reason"] += f"; signature is {len(sig)} bytes, not the {want}-byte JWS R||S form (DER-encoded?)"
            d["alt_serialisations_verifying"] = alt_serialisations(body, s["protected"], sig, alg, jwks)
        else:
            d.update(result="UNCHECKABLE", reason="; ".join(sorted({str(o[1] or f'alg {alg} unsupported for key') for o in outcomes})))
    results = [d.get("result") for d in detail]
    if "FAILED" in results:
        st = "FAILED"
    elif "VERIFIED" in results:
        st = "VERIFIED"
    else:
        st = "UNCHECKABLE"
    out = {"sig_state": st, "n_signatures": len(sigs), "signatures": detail}
    if st == "VERIFIED":
        out["verified_key_sources"] = sorted({d["key_source"] for d in detail if d.get("result") == "VERIFIED"})
    return out


# ---------------------------------------------------------------- card parsing (pure)
def looks_like_card(j):
    return isinstance(j, dict) and isinstance(j.get("name"), str) and any(
        k in j for k in ("skills", "url", "supportedInterfaces", "additionalInterfaces", "capabilities"))


def parse_card(card):
    caps = card.get("capabilities") if isinstance(card.get("capabilities"), dict) else {}
    transports = set()
    if isinstance(card.get("preferredTransport"), str):
        transports.add(card["preferredTransport"])
    for key in ("additionalInterfaces", "supportedInterfaces"):
        for i in card.get(key) or []:
            if isinstance(i, dict):
                t = i.get("transport") or i.get("protocolBinding")
                if isinstance(t, str):
                    transports.add(t)
    skills = card.get("skills")
    schemes = card.get("securitySchemes") if isinstance(card.get("securitySchemes"), dict) else {}
    prov = card.get("provider") if isinstance(card.get("provider"), dict) else {}
    return {"name": P.clip(card.get("name"), 160), "version": P.clip(str(card.get("version")), 60) if card.get("version") is not None else None,
            "protocolVersion": P.clip(str(card.get("protocolVersion")), 40) if card.get("protocolVersion") is not None else None,
            "n_skills": len(skills) if isinstance(skills, list) else None,
            "transports": sorted(transports)[:10],
            "preferredTransport": card.get("preferredTransport") if isinstance(card.get("preferredTransport"), str) else None,
            "capabilities_true": sorted(k for k, v in caps.items() if v is True)[:20],
            "capabilities_keys": sorted(str(k) for k in caps)[:20],
            "security_scheme_types": sorted({str(v.get("type")) for v in schemes.values() if isinstance(v, dict)})[:10],
            "has_security_requirement": bool(card.get("security")),
            "provider_org": P.clip(prov.get("organization"), 120),
            "card_url": P.clip(card.get("url"), 300) if isinstance(card.get("url"), str) else None,
            "signatures_block": "signatures" in card,
            "top_level_keys": sorted(str(k) for k in card)[:40]}


# ---------------------------------------------------------------- network
def address_class(host, resolve=socket.getaddrinfo):
    """-> ('public', addrs) | ('non_public', why) | ('dns', why)."""
    try:
        ip = ipaddress.ip_address(host.strip("[]"))
        addrs = [ip]
    except ValueError:
        try:
            infos = resolve(host, None, proto=socket.IPPROTO_TCP)
        except socket.gaierror as e:
            return "dns", f"dns: {e}"
        except Exception as e:
            return "dns", f"dns: {type(e).__name__}: {e}"
        addrs = sorted({ipaddress.ip_address(i[4][0].split("%")[0]) for i in infos}, key=str)
    bad = [str(a) for a in addrs if not a.is_global]
    if bad:
        return "non_public", f"resolves to non-global address(es) {', '.join(bad[:3])}"
    return "public", [str(a) for a in addrs][:4]


def host_policy(host, cfg, resolve=socket.getaddrinfo):
    """-> ('public', addrs) | ('hf_space', why) | ('non_public', why) | ('dns', why)."""
    if host.lower().endswith(".hf.space"):
        return "hf_space", ("*.hf.space: the Space's sleep state was not checked and a request could wake it; "
                            "not contacted (hf-spaces-mcp-probe.py reads the stage first)")
    if cfg.get("allow_non_public"):
        return "public", ["(test)"]
    cls, info = address_class(host, resolve)
    return cls, (info + "; not contacted") if cls == "non_public" else info


def candidates(listing):
    out = []
    wk = listing.get("wellKnownURI")
    if isinstance(wk, str) and wk.startswith(("http://", "https://")):
        out.append(("listing.wellKnownURI", wk))
    base = listing.get("url") if isinstance(listing.get("url"), str) else None
    if base is None and out:
        base = out[0][1]
    if base and base.startswith(("http://", "https://")):
        u = urllib.parse.urlsplit(base)
        origin = f"{u.scheme}://{u.netloc}"
        out.append(("origin/.well-known/agent-card.json", origin + "/.well-known/agent-card.json"))
        out.append(("origin/.well-known/agent.json", origin + "/.well-known/agent.json"))
    seen, uniq = set(), []
    for label, url in out:
        if url not in seen:
            seen.add(url)
            uniq.append((label, url))
    return uniq


def fetch_json(url, gate, cfg, log):
    """GET, following same-host redirects. -> (status or exception, headers, body bytes, final url)."""
    for _hop in range(MAX_REDIRECTS + 1):
        u = urllib.parse.urlsplit(url)
        sess = P.Session(url, gate, cfg["connect_timeout"], cfg["read_timeout"], cfg.get("ssl_context"))
        target = (u.path or "/") + (f"?{u.query}" if u.query else "")
        rec = {"retries": 0}
        try:
            r = P.send_once_with_retry(sess, rec, "GET", target, {"Accept": "application/json"},
                                       sleep=cfg.get("sleep", time.sleep))
        except P.PhaseError as e:
            log.append(f"GET {P.clip(url, 200)} -> {e.phase}:{type(e.exc).__name__}")
            return e, {}, b"", url
        finally:
            sess.close()
        log.append(f"GET {P.clip(url, 200)} -> {r.status}")
        if r.status in (301, 302, 303, 307, 308) and r.headers.get("location"):
            nxt = urllib.parse.urljoin(url, r.headers["location"])
            if urllib.parse.urlsplit(nxt).hostname != u.hostname:
                return r.status, r.headers, b"", "OFFHOST:" + nxt
            url = nxt
            continue
        return r.status, r.headers, r.body, url
    return "too_many_redirects", {}, b"", url


def probe_listing(listing, gate, cfg, robots_cache, resolve=socket.getaddrinfo):
    rec = {"id": listing.get("id"), "order": listing.get("order"), "listed_url": P.clip(listing.get("url"), 300),
           "listed_wellKnownURI": P.clip(listing.get("wellKnownURI"), 300),
           "listed_protocolVersion": listing.get("protocolVersion"),
           "registry_is_healthy": listing.get("is_healthy"), "registry_conformance": listing.get("conformance"),
           "started": P.utcnow(), "requests": [], "state": None, "reason": None}
    cands = candidates(listing)
    if not cands:
        rec.update(state="INVALID_URL", reason="no absolute http(s) URL in the listing")
        return rec
    host = urllib.parse.urlsplit(cands[0][1]).hostname or ""
    rec["host"] = host
    if any(urllib.parse.urlsplit(c).hostname != host for _l, c in cands):
        rec["candidate_hosts"] = sorted({urllib.parse.urlsplit(c).hostname or "" for _l, c in cands})
    tried, outcomes, host_verdict, dead = [], [], {}, set()
    for label, url in cands:
        u = urllib.parse.urlsplit(url)
        hn = u.hostname or ""
        if hn in dead:
            continue
        if hn not in host_verdict:  # every candidate host is checked, not only the first
            host_verdict[hn] = host_policy(hn, cfg, resolve)
        cls, info = host_verdict[hn]
        if cls != "public":
            outcomes.append((label, {"non_public": "NON_PUBLIC_ADDRESS", "hf_space": "HF_SPACE_NOT_CONTACTED",
                                     "dns": "UNREACHABLE"}[cls], info))
            if cls == "dns":
                dead.add(hn)
            continue
        key = (u.scheme, u.hostname, u.port)
        if key not in robots_cache:
            v, rinfo, _n = P.robots_verdict(gate, u.hostname, u.scheme, u.port, cfg)
            robots_cache[key] = (v, rinfo)
            rec["requests"].append(f"GET robots.txt {u.hostname} -> {v}")
        v, rinfo = robots_cache[key]
        if v == "unreachable":
            s, why = rinfo
            outcomes.append((label, s, f"at robots.txt: {why}"))
            dead.add(hn)
            continue
        if v == "disallow":
            outcomes.append((label, "ROBOTS_DISALLOWED", rinfo))
            continue
        if v == "rules" and not rinfo.can_fetch(P.ROBOTS_TOKEN, url):
            outcomes.append((label, "ROBOTS_DISALLOWED", "robots.txt rules disallow this path for CSOAI-census"))
            continue
        status, hdrs, body, final = fetch_json(url, gate, cfg, rec["requests"])
        tried.append(label)
        if isinstance(status, BaseException):
            s, why = P.grade_exception(status)
            outcomes.append((label, s, why))
            dead.add(hn)  # the host did not answer; later candidates on it are skipped
            continue
        if isinstance(final, str) and final.startswith("OFFHOST:"):
            outcomes.append((label, "UNREACHABLE", f"HTTP {status} redirect off-host to {P.clip(final[8:], 160)} (not followed)"))
            continue
        if status == "too_many_redirects":
            outcomes.append((label, "UNREACHABLE", "more than 3 redirects"))
            continue
        if status in (401, 403):
            outcomes.append((label, "AUTH_REQUIRED", f"HTTP {status}"))
            continue
        if status >= 500 or status in (429,):
            outcomes.append((label, "UNREACHABLE", f"HTTP {status}"))
            continue
        if status != 200:
            outcomes.append((label, "NOT_FOUND", f"HTTP {status}"))
            continue
        try:
            j = json.loads(body)
        except (ValueError, UnicodeDecodeError):
            j = None
        if not looks_like_card(j):
            what = "JSON, not an agent card" if j is not None else f"not JSON ({P.clip(hdrs.get('content-type', ''), 60)})"
            outcomes.append((label, "CARD_INVALID", f"HTTP 200 {what}"))
            continue
        rec.update(state="CARD_SERVED", reason=f"HTTP 200 at {label}", card_source=label,
                   card_fetched_url=P.clip(final, 300), card_sha256=hashlib.sha256(body).hexdigest(),
                   card_bytes=len(body), content_type=P.clip(hdrs.get("content-type"), 80), card=parse_card(j))
        rec["_card"] = j
        rec["_raw"] = body
        break
    if rec["state"] is None:
        order = ["AUTH_REQUIRED", "CARD_INVALID", "ROBOTS_DISALLOWED", "NOT_FOUND", "TIMEOUT", "UNREACHABLE",
                 "HF_SPACE_NOT_CONTACTED", "NON_PUBLIC_ADDRESS"]
        got = {s for _l, s, _w in outcomes}
        st = next((s for s in order if s in got), "UNREACHABLE")
        rec.update(state=st, reason="; ".join(f"{l}: {w}" for l, _s, w in outcomes)[:500])
    rec["candidates_tried"] = tried
    rec["finished"] = P.utcnow()
    return rec


# ---------------------------------------------------------------- run
def load_listings(frame_dir):
    raw = os.path.join(frame_dir, "raw", "a2aregistry")
    with open(os.path.join(raw, "pages.json")) as fh:
        pages = json.load(fh)
    agents = []
    for p in pages:
        if not p.get("file"):
            continue
        with gzip.open(os.path.join(raw, p["file"]), "rt") as fh:
            doc = json.load(fh)
        agents.extend(a for a in doc.get("agents") or [] if isinstance(a, dict))
    order = {}
    with gzip.open(os.path.join(frame_dir, "entries.jsonl.gz"), "rt") as fh:
        for line in fh:
            if '"a2aregistry"' in line:
                e = json.loads(line)
                if e.get("source") == "a2aregistry":
                    order[e["id"]] = e.get("order")
    seen, out = set(), []
    for a in agents:
        if a.get("id") in seen:
            continue
        seen.add(a.get("id"))
        a["order"] = order.get(a.get("id"))
        out.append(a)
    out.sort(key=lambda a: (a["order"] is None, a["order"] or 0))
    return out, len(order)


class Run:
    def __init__(self, listings, out, cfg, resolve=socket.getaddrinfo):
        self.listings, self.out, self.cfg, self.resolve = listings, out, cfg, resolve
        self.gate = P.HostGate(cfg["min_interval"], sleep=cfg.get("sleep", time.sleep))
        self.robots = {}
        self.lock = threading.Lock()
        self.results = []
        by_host = collections.OrderedDict()
        for a in listings:
            c = candidates(a)
            h = urllib.parse.urlsplit(c[0][1]).hostname if c else f"invalid:{a.get('id')}"
            by_host.setdefault(h, []).append(a)
        self.hosts = list(by_host.items())
        self.key_cache = {}
        self.key_requests = 0

    def worker(self):
        while True:
            with self.lock:
                if not self.hosts:
                    return
                host, items = self.hosts.pop(0)
            for a in items:
                try:
                    rec = probe_listing(a, self.gate, self.cfg, self.robots, self.resolve)
                except Exception as e:
                    rec = {"id": a.get("id"), "order": a.get("order"), "host": host, "state": "UNREACHABLE",
                           "reason": f"probe crashed: {type(e).__name__}: {P.clip(str(e), 160)}"}
                with self.lock:
                    self.results.append(rec)

    def fetch_key_doc(self, url):
        """Phase 2 (sequential, after every card fetch): one GET per key URL, cached, paced, public
        addresses only."""
        if url in self.key_cache:
            return self.key_cache[url]
        host = urllib.parse.urlsplit(url).hostname or ""
        cls, info = host_policy(host, self.cfg, self.resolve)
        if cls != "public":
            out = (None, info)
        else:
            log = []
            status, _h, body, _f = fetch_json(url, self.gate, self.cfg, log)
            self.key_requests += len(log)
            if isinstance(status, BaseException):
                out = (None, P.grade_exception(status)[1])
            elif status != 200:
                out = (None, f"HTTP {status}")
            else:
                try:
                    out = (json.loads(body), None)
                except ValueError:
                    out = (None, "not JSON")
        self.key_cache[url] = out
        return out

    def run(self):
        started = P.utcnow()
        ts = [threading.Thread(target=self.worker, daemon=True) for _ in range(self.cfg["workers"])]
        for t in ts:
            t.start()
        for t in ts:
            t.join()
        os.makedirs(self.out, exist_ok=True)
        self.results.sort(key=lambda r: (r.get("order") is None, r.get("order") or 0))
        with gzip.open(os.path.join(self.out, "results.jsonl.gz"), "wt") as fh, \
                gzip.open(os.path.join(self.out, "cards.jsonl.gz"), "wt") as cf:
            for r in self.results:
                card, raw = r.pop("_card", None), r.pop("_raw", None)
                if card is not None:
                    r["signature_check"] = check_signatures(card, self.fetch_key_doc)
                    cf.write(json.dumps({"id": r["id"], "card_fetched_url": r.get("card_fetched_url"),
                                         "card_sha256": r.get("card_sha256"),
                                         "body": raw.decode("utf-8", "replace")}, ensure_ascii=False) + "\n")
                fh.write(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n")
        return started, P.utcnow()


def summarise(run, started, finished, n_planned, n_frame_entries):
    res = run.results
    states = collections.Counter(r["state"] for r in res)
    served = [r for r in res if r["state"] == "CARD_SERVED"]
    sig = collections.Counter(r["signature_check"]["sig_state"] for r in served)
    has_block = sum(1 for r in served if r["card"]["signatures_block"])
    verified_src = collections.Counter(s for r in served if r["signature_check"]["sig_state"] == "VERIFIED"
                                       for s in r["signature_check"].get("verified_key_sources", []))
    unc_reason = collections.Counter(d.get("reason", "")[:80] for r in served
                                     for d in r["signature_check"].get("signatures", []) if d.get("result") == "UNCHECKABLE")
    ns = len(served)
    pct = lambda n: round(100.0 * n / ns, 2) if ns else None
    sk = [r["card"]["n_skills"] for r in served if isinstance(r["card"].get("n_skills"), int)]
    pv_mismatch = sum(1 for r in served if r["card"].get("protocolVersion") is not None and r.get("listed_protocolVersion") is not None
                      and str(r["card"]["protocolVersion"]) != str(r["listed_protocolVersion"]))
    healthy_not_served = sum(1 for r in res if r.get("registry_is_healthy") is True and r["state"] != "CARD_SERVED")
    return {
        "schema": SCHEMA, "started": started, "finished": finished, "user_agent": P.UA,
        "frame": {"dir": run.cfg.get("frame_dir"), "a2aregistry_entries": n_frame_entries},
        "n_planned": n_planned, "n_attempted": len(res),
        "read_state": "EXHAUSTED" if len(res) == n_planned and n_planned == n_frame_entries else "PARTIAL",
        "read_state_rule": "EXHAUSTED only if every listing of the frame reached exactly one state",
        "states": {s: states.get(s, 0) for s in STATES},
        "cards_served": {
            "n": ns,
            "card_source": dict(collections.Counter(r["card_source"] for r in served)),
            "protocolVersion": dict(collections.Counter(str(r["card"]["protocolVersion"]) for r in served).most_common()),
            "protocolVersion_differs_from_listing": pv_mismatch,
            "transports": dict(collections.Counter(t for r in served for t in r["card"]["transports"]).most_common()),
            "no_transport_declared": sum(1 for r in served if not r["card"]["transports"]),
            "capabilities_true": dict(collections.Counter(c for r in served for c in r["card"]["capabilities_true"]).most_common()),
            "skills": {"n": len(sk), "median": sorted(sk)[len(sk) // 2] if sk else None,
                       "zero": sum(1 for x in sk if x == 0), "max": max(sk) if sk else None},
            "declares_security_requirement": sum(1 for r in served if r["card"]["has_security_requirement"]),
            "security_scheme_types": dict(collections.Counter(t for r in served for t in r["card"]["security_scheme_types"])),
            "distinct_card_sha256": len({r["card_sha256"] for r in served}),
        },
        "signatures": {
            "cards_with_signatures_block": has_block,
            "pct_cards_with_signatures_block": pct(has_block),
            "sig_state": {s: sig.get(s, 0) for s in SIG_STATES},
            "pct_signed": pct(ns - sig.get("NO_SIGNATURES", 0)),
            "pct_verifying": pct(sig.get("VERIFIED", 0)),
            "verified_by_key_source": dict(verified_src),
            "verified_note": "embedded_jwk = the card vouches for its own key: integrity, not identity",
            "uncheckable_reasons": dict(unc_reason.most_common(10)),
            "failed_that_verify_under_a_non_spec_serialisation": sum(
                1 for r in served for d in r["signature_check"].get("signatures", [])
                if d.get("result") == "FAILED" and d.get("alt_serialisations_verifying")),
            "failed_note": ("FAILED = no verification over JCS(card without signatures) under the key the card points "
                            "to; alt_serialisations_verifying is a diagnostic of 4 non-spec serialisations, never a pass"),
            "denominator": "cards served (CARD_SERVED), not listings",
            "canonicalisation": "JCS (RFC 8785) of the card with `signatures` removed; detached JWS (RFC 7515)",
        },
        "registry_is_healthy_but_no_card_served": healthy_not_served,
        "requests": {"cards_and_robots": sum(run.gate.requests.values()), "key_documents": run.key_requests,
                     "hosts_contacted": len(run.gate.requests),
                     "max_to_one_host": max(run.gate.requests.values()) if run.gate.requests else 0},
        "limits": {"min_interval_s_per_host": run.cfg["min_interval"], "connections_per_host": 1,
                   "workers": run.cfg["workers"], "connect_timeout_s": run.cfg["connect_timeout"],
                   "read_timeout_s": run.cfg["read_timeout"], "max_redirects_same_host": MAX_REDIRECTS},
        "sent": ["GET /robots.txt", "GET <agent card URL> (<= 3 candidates)", "GET <jku JWKS or did:web did.json> (only when a signature points to it)"],
        "never_sent": ["message/send", "message/stream", "tasks/*", "any JSON-RPC call", "any credential", "any payment",
                       "any request to a non-global address"],
        "what_a_row_is": "what one listed agent's card URL(s) served at one moment, from one place",
        "what_it_never_proves": "that an agent works, is safe, is who it says, or does what its skills say; a VERIFIED signature proves only that the pointed-to key signed these bytes",
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--frame", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--workers", type=int, default=16)
    ap.add_argument("--min-interval", type=float, default=1.0)
    ap.add_argument("--connect-timeout", type=float, default=10.0)
    ap.add_argument("--read-timeout", type=float, default=15.0)
    a = ap.parse_args(argv)
    cfg = {"min_interval": a.min_interval, "workers": a.workers, "connect_timeout": a.connect_timeout,
           "read_timeout": a.read_timeout, "frame_dir": a.frame}
    listings, n_frame = load_listings(a.frame)
    run = Run(listings, a.out, cfg)
    started, finished = run.run()
    s = summarise(run, started, finished, len(listings), n_frame)
    with open(os.path.join(a.out, "summary.json"), "w") as fh:
        json.dump(s, fh, indent=2)
    print(json.dumps({k: s[k] for k in ("n_planned", "n_attempted", "read_state", "states", "signatures")}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
