#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""Render public/measurement-capsules/v0.2/index.html from the laid-out files beside it.

    measurement_capsule_page.py --dir public/measurement-capsules/v0.2 [--write]

Until 22 Nov 2026 this page was written by hand for one index (1 Nov) and went stale as soon as another index was laid
out. Now every value on it is read from the files it describes: index.json, index.signed.json (whose Ed25519
signature this script checks under the pinned board key), index.json.ots, anchors.json, index.rekor-receipt.json and
the publication/ records. A file that is absent is said to be absent; nothing is carried over from an older index.
"""
import argparse, base64, hashlib, html, json, pathlib, sys

BOARD_DID = "did:web:csoai.org#board-attestation-1"
BOARD_PUB_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170"  # same pin as chain.py / cardVerify.ts
STYLE = """ :root{color-scheme:light dark;--fg:#111;--bg:#fff;--mut:#555;--line:#e3e3e3}
 @media(prefers-color-scheme:dark){:root{--fg:#e8e8e8;--bg:#111;--mut:#a5a5a5;--line:#2b2b2b}}
 body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
 main{max-width:70rem;margin:0 auto;padding:3rem 1rem 5rem}
 h1{font-size:1.5rem;margin:0 0 .25rem} .sub{color:var(--mut);margin:0 0 2rem} h2{font-size:1.02rem;margin:2.2rem 0 .5rem}
 code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.88em;overflow-wrap:anywhere}
 table{border-collapse:collapse;width:100%} td,th{text-align:left;vertical-align:top;padding:.4rem .5rem;border-top:1px solid var(--line)}
 th{color:var(--mut);font-weight:500} .wrap{overflow-x:auto} a{color:inherit}
 .rule{border-left:3px solid var(--line);padding:.1rem .8rem;margin:1rem 0;color:var(--fg)}"""


def e(x):
    return html.escape(str(x), quote=True)


def c(x):
    return f"<code>{e(x)}</code>"


def sha_bytes(b):
    return hashlib.sha256(b).hexdigest()


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def read_json(p):
    p = pathlib.Path(p)
    return json.loads(p.read_bytes()) if p.exists() else None


def signature_check(signed, index_sha):
    """VERIFIES only when the payload pins these index bytes, its sha256 matches and Ed25519 verifies under the pin."""
    if not signed:
        return "ABSENT (no index.signed.json)"
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        payload, sig = signed["payload"], signed["signature"]
        pre = canon(payload)
        if sha_bytes(pre) != sig.get("payload_sha256"):
            return "FAILS (payload sha256 differs from signature.payload_sha256)"
        if (payload.get("artifact") or {}).get("sha256") != index_sha:
            return "FAILS (the signed payload pins other index bytes)"
        if sig.get("did") != BOARD_DID:
            return "FAILS (declared signer differs from the pinned board key identifier)"
        if sig.get("alg") != "Ed25519":
            return "FAILS (declared algorithm differs from Ed25519)"
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(BOARD_PUB_HEX)).verify(bytes.fromhex(sig["sig_ed25519"]), pre)
        return "VERIFIES"
    except ImportError:
        return "UNCHECKED (no cryptography library where this page was generated)"
    except Exception:
        return "FAILS (Ed25519 signature does not verify under the pinned board key)"


def plural(n, one, many):
    return f"{n:,} {one if n == 1 else many}"


def render(vdir, publication_dir=None):
    vdir = pathlib.Path(vdir)
    raw = (vdir / "index.json").read_bytes()
    idx = json.loads(raw)
    isha = sha_bytes(raw)
    signed = read_json(vdir / "index.signed.json")
    anchors = read_json(vdir / "anchors.json") or {}
    receipt = read_json(vdir / "index.rekor-receipt.json")
    date, as_of = idx.get("date") or "UNDATED", idx.get("as_of")
    n, nb = idx["n_capsules_total"], len(idx["batches"])
    L = ["<!doctype html>", '<html lang="en">', "<head>", '<meta charset="utf-8">',
         '<meta name="viewport" content="width=device-width,initial-scale=1">',
         "<title>Measurement capsules v0.2: published files — Council of AI</title>",
         '<meta name="description" content="The files and signed records behind the current measurement-capsule index. Measurement, not endorsement.">',
         '<link rel="canonical" href="https://councilof.ai/measurement-capsules/v0.2/">', f"<style>\n{STYLE}\n</style>", "</head>", "<body>", "<main>",
         "<h1>Measurement capsules v0.2: published files</h1>",
         f'<p class="sub">Current index dated <strong>{e(date)}</strong> ({c("as_of " + str(as_of))}): {plural(n, "capsule", "capsules")} in '
         f'{plural(nb, "batch", "batches")}. The files describe declared and observed measurements; they grant no authority.</p>',
         '<p class="rule"><strong>If this page and <code>index.json</code> ever disagree, <code>index.json</code> is the signed record and wins.</strong> '
         "This page is generated from the files in this folder each time an index is laid out. Check those files directly for the authoritative values.</p>",
         "<h2>Index</h2>", "<ul>",
         f' <li><a href="index.json">index.json</a>: schema {c(idx.get("schema"))}, dated {c(as_of)}, {plural(n, "capsule", "capsules")} in '
         f'{plural(nb, "batch", "batches")}; root {c(idx["index_root"])}; SHA-256 {c(isha)}.</li>']
    if signed:
        s = signed.get("signature") or {}
        L.append(f' <li><a href="index.signed.json">index.signed.json</a>: Ed25519 signed envelope, signed {c(s.get("signed_at"))} by '
                 f'{c(s.get("did"))}; signed-payload SHA-256 {c(s.get("payload_sha256"))}. Ed25519 check when this page was generated, '
                 f'under the pinned {c(BOARD_DID)} key: <strong>{e(signature_check(signed, isha))}</strong>. A valid signature binds bytes and '
                 "signer; it does not prove that a measurement is correct.</li>")
    else:
        L.append(" <li>index.signed.json: <strong>absent</strong>. This index carries no signature here.</li>")
    ots = anchors.get("opentimestamps") or {}
    if (vdir / "index.json.ots").exists():
        hs = ots.get("bitcoin_block_heights") or []
        L.append(f' <li><a href="index.json.ots">index.json.ots</a>: OpenTimestamps proof, SHA-256 {c(sha_bytes((vdir / "index.json.ots").read_bytes()))}; '
                 f'state in anchors.json: <strong>{e(ots.get("state", "NOT RECORDED"))}</strong>'
                 + (f", Bitcoin block height{'s' if len(hs) > 1 else ''} {', '.join(e(h) for h in hs)}" if hs else "")
                 + ". A calendar commitment alone dates nothing; run <code>ots verify index.json.ots</code> against the index bytes.</li>")
    else:
        L.append(" <li>index.json.ots: <strong>absent</strong>.</li>")
    if anchors:
        L.append(f' <li><a href="anchors.json">anchors.json</a>: anchor record read at {c(anchors.get("as_of"))} for the index dated '
                 f'{c(anchors.get("date"))}.</li>')
    if receipt:
        L.append(f' <li><a href="index.rekor-receipt.json">index.rekor-receipt.json</a>: Rekor receipt for subject {c(receipt.get("subject"))}, '
                 f'log index {c(receipt.get("logIndex"))}.</li>')
    L += [' <li><a href="../latest.json">../latest.json</a>: current published version pointer.</li>', "</ul>", "<h2>Chain position</h2>"]
    if idx.get("genesis"):
        L.append(f"<p>Index date {c(date)} is the genesis of the chain (no previous index).</p>")
    elif idx.get("prev_date"):
        miss = idx.get("missing_dates") or []
        gap = ("no gap day" if not miss else
               f"{plural(len(miss), 'declared gap day', 'declared gap days')} ({', '.join(c(m) for m in miss)})" if len(miss) <= 6 else
               f"{len(miss)} declared gap days ({c(miss[0])} to {c(miss[-1])})")
        L.append(f"<p>Index date {c(date)}, chain sequence {c(idx.get('chain_seq'))}, previous index date {c(idx['prev_date'])}; {gap}. "
                 f"Previous index SHA-256: {c(idx.get('prev_index_sha256'))}. Each day of the chain is published at "
                 f'<a href="https://huggingface.co/datasets/csoai/evidence-index/tree/main/measurement-index">csoai/evidence-index measurement-index/</a>, '
                 "with the recipe to verify it back to genesis.</p>")
    fr = (idx.get("freshness") or {}).get("adapters") or {}
    if fr:
        L += ["<h2>Freshness</h2>", f"<p>{e((idx.get('freshness') or {}).get('rule', ''))}</p>", '<div class="wrap"><table>',
              "<thead><tr><th>adapter</th><th>state</th><th>last good date</th></tr></thead><tbody>"]
        L += [f"<tr><td>{c(k)}</td><td>{e(v.get('state'))}</td><td>{c(v.get('last_good_date'))}</td></tr>" for k, v in fr.items()]
        L.append("</tbody></table></div>")
    if idx.get("pending_source"):
        L += ["<p>Pending sources, as the index states them:</p>", "<ul>"]
        L += [f" <li>{c(p.get('adapter'))}: {e(p.get('why'))}</li>" for p in idx["pending_source"]]
        L.append("</ul>")
    L += ["<h2>External anchors and publication</h2>", "<ul>"]
    rek = anchors.get("rekor") or []
    if rek:
        for r in rek:
            L.append(f" <li>Rekor ({e(r.get('subject'))}): <strong>{e(r.get('state'))}</strong>; log index {c(r.get('logIndex'))}"
                     + (' ; the raw entry is <a href="index.rekor-entry.json">here</a>' if r.get("subject") == "daily index" and (vdir / "index.rekor-entry.json").exists() else "")
                     + ".</li>")
    else:
        L.append(" <li>Rekor: no entry is recorded for this index in anchors.json.</li>")
    x = anchors.get("xrpl") or {}
    if x:
        L.append(f" <li>XRP Ledger: <strong>{e(x.get('state'))}</strong>. {e(x.get('note', ''))}</li>")
    pub = idx.get("publication") or {}
    L.append(f" <li>Publication: <strong>{e(pub.get('state', 'NOT STATED in the index'))}</strong>"
             + (f", approved {c(pub.get('approved'))}" if pub.get("approved") else "") + ".</li>")
    L.append("</ul>")
    pdir = pathlib.Path(publication_dir) if publication_dir else vdir / "publication"
    recs = sorted(p for p in pdir.glob("*.json") if not p.name.endswith(".signed.json")) if pdir.is_dir() else []
    if recs:
        L.append("<ul>")
        for p in recs:
            stem = p.name[:-5]
            L.append(f' <li><a href="publication/{e(p.name)}">publication/{e(p.name)}</a> (<a href="publication/{e(stem)}.signed.json">signed</a>, '
                     f'<a href="publication/{e(p.name)}.ots">OTS</a>).</li>')
        L.append("</ul>")
    L += ["<h2>Batch records</h2>", '<div class="wrap"><table>',
          "<thead><tr><th>directory / kind</th><th>capsules</th><th>signature</th><th>batch OTS</th><th>recorded states</th><th>files</th></tr></thead>",
          "<tbody>"]
    for b in idx["batches"]:
        slug = b["adapter"] if sum(1 for y in idx["batches"] if y["adapter"] == b["adapter"]) == 1 else f"{b['adapter']}-{b['merkle_root'][:12]}"
        st = "; ".join(f"{e(k)} {e(v)}" for k, v in sorted((b.get("states") or {}).items()))
        files = " · ".join(f'<a href="{e(slug)}/{f}">{lbl}</a>' for f, lbl in (("record.json", "record"), ("record.signed.json", "signature"),
                                                                             ("record.json.ots", "OTS"), ("leaves.json", "leaves"),
                                                                             ("capsules.jsonl.gz", "capsules")))
        L.append(f"<tr><td>{c(slug + '/')}<br>{c(b.get('kind'))}</td><td>{b['n_capsules']:,}</td><td>{e(b.get('signature_state'))}</td>"
                 f"<td>{e(b.get('ots_state'))}</td><td>{st}</td><td>{files}</td></tr>")
    L += ["</tbody></table></div>",
          "<p>Signature and OTS states in this table are the ones the index recorded when it was written. "
          "<code>endpoints/&lt;xx&gt;.json</code> holds 256 shards keyed by the first two hex of the SHA-256 of a normalised endpoint URL.</p>",
          "<p>Measurement, not endorsement. Generated by <code>scripts/measurement_capsule_page.py</code> from the files in this folder.</p>",
          "</main>", "</body>", "</html>", ""]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="the laid-out v0.2 directory")
    ap.add_argument("--write", action="store_true", help="write DIR/index.html (default: print)")
    a = ap.parse_args()
    out = render(a.dir)
    if a.write:
        (pathlib.Path(a.dir) / "index.html").write_text(out)
    else:
        sys.stdout.write(out)


if __name__ == "__main__":
    main()
