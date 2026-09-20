#!/usr/bin/env python3
"""Sign any universal cohort card through the estate remote signer.

No private key is loaded here. The client obtains an allowed OIDC identity
(GitHub Actions today; GitLab CI when configured) and submits the compact body
to /api/board-sign. The returned digest MUST equal the locally canonical digest.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, urllib.error, urllib.parse, urllib.request
from pathlib import Path
from lib.measurement_bundle import canonical_bytes, DID

SIGN_URL = os.environ.get("BOARD_SIGN_URL") or "https://councilof.ai/api/board-sign"
NEVER_SIGN_UPPER = re.compile(r"\b(THIN|TEMPLATE)\b")
NEVER_SIGN_SPECIMEN = re.compile(r"\bspecimen\b", re.I)

def _github_token(aud: str) -> str | None:
    u = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL") or ""
    t = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN") or ""
    if not u or not t: return None
    sep = "&" if "?" in u else "?"
    req = urllib.request.Request(u + sep + "audience=" + urllib.parse.quote(aud, safe=""),
                                 headers={"Authorization": f"Bearer {t}", "Accept":"application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        tok = json.loads(r.read().decode()).get("value")
    return tok if isinstance(tok, str) and tok else None

def _gitlab_token(aud: str) -> str | None:
    # Configure .gitlab-ci.yml with:
    # id_tokens: { BOARD_SIGN_OIDC_TOKEN: { aud: https://councilof.ai/api/board-sign } }
    tok = os.environ.get("BOARD_SIGN_OIDC_TOKEN") or ""
    return tok.strip() or None

def oidc_token(aud: str) -> tuple[str, str]:
    tok = _github_token(aud)
    if tok: return "github", tok
    tok = _gitlab_token(aud)
    if tok: return "gitlab", tok
    raise RuntimeError("no allowed OIDC identity available; refuse local/private-key signing")

def sign(body: dict) -> tuple[str, str, str]:
    raw = canonical_bytes(body)
    if len(raw) > 3072: raise RuntimeError(f"payload {len(raw)}B exceeds signer cap")
    text = raw.decode()
    m = NEVER_SIGN_UPPER.search(text) or NEVER_SIGN_SPECIMEN.search(text)
    if m: raise RuntimeError(f"never-sign label {m.group(0)!r}")
    aud = "https://councilof.ai/api/board-sign"
    provider, token = oidc_token(aud)
    req = urllib.request.Request(SIGN_URL, data=json.dumps({"payload":body}, separators=(",",":"), ensure_ascii=False).encode(),
        method="POST", headers={"Authorization":f"Bearer {token}","Content-Type":"application/json","User-Agent":"csoai-universal-measure-sign/1"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r: out=json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"board-sign HTTP {e.code}: {e.read()[:500]!r}") from e
    sig=out.get("sig_ed25519"); digest=out.get("payload_sha256")
    local=hashlib.sha256(raw).hexdigest()
    if not isinstance(sig,str) or not re.fullmatch(r"[0-9a-f]{128}",sig): raise RuntimeError("signer returned no valid Ed25519 signature")
    if digest != local: raise RuntimeError(f"signer digest mismatch local={local} remote={digest}")
    return provider,sig,digest

def main() -> int:
    ap=argparse.ArgumentParser(); ap.add_argument("unsigned_card"); ap.add_argument("--out")
    ns=ap.parse_args()
    p=Path(ns.unsigned_card)
    wrapper=json.loads(p.read_text(encoding="utf-8"))
    body=wrapper.get("body")
    if not isinstance(body,dict): raise SystemExit("UNSIGNED: body missing")
    if not body.get("unmeasured") and body.get("status") not in ("MEASURED","VALID"):
        raise SystemExit("UNSIGNED: explicit measurement boundary missing")
    body=dict(body); body["signature_state"]="SIGNED"
    provider,sig,digest=sign(body)
    out={"alg":"Ed25519","body":body,"id":digest,"preimage_rule":"sha256(canonical body)","signature":sig,"did":DID,
         "oidc_provider":provider,"not_a_certificate":True}
    dest=Path(ns.out) if ns.out else p.with_name(f"signed-cohort-{digest[:12]}.json")
    if dest.exists():
        old=json.loads(dest.read_text())
        if old.get("id")!=digest or old.get("signature")!=sig: raise SystemExit("refuse overwrite conflicting signed bytes")
        print("SKIP",dest); return 0
    dest.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({"state":"SIGNED","provider":provider,"id":digest,"path":str(dest)},indent=2))
    return 0
if __name__=="__main__": raise SystemExit(main())
