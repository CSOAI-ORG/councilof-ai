"""normaliser_v1.py - exact copy of CSOAI corpus_anchor.py normaliser v1.0.0 (gspc-os/apps/csoai-static-deploy2/corpus_anchor.py).
Verified 20 Nov 2026: reproduces all 417 frozen provision hashes and corpus root 37e2e10d53feaa9e12097f45113e1234510be0ca471e1a0848f5805db3e367c7.
Do not modify. provision_id format: '<instrument_id>:<number-or-label>'."""
import hashlib, re
NORMALISER_VERSION = "1.0.0"
_WS = re.compile(r"\s+")
_SOFT_HYPHEN = re.compile("[\u00ad\u200b\u200c\u200d\ufeff]")
_EDITORIAL = re.compile(r"\u25ba?[MC]\d+\s*|\(\s*OJ\s+L[^)]*\)|\[?consolidated text\]?|\u25bc[A-Z]\d*", re.I)
def normalise(text):
    if text is None:
        raise ValueError("cannot normalise None - a missing provision is UNKNOWN, not empty")
    t = _SOFT_HYPHEN.sub("", text)
    t = _EDITORIAL.sub(" ", t)
    t = t.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    t = t.replace("\u2013", "-").replace("\u2014", "-").replace("\u00a0", " ")
    return _WS.sub(" ", t).strip().casefold()
def provision_hash(text):
    return hashlib.sha256(f"{NORMALISER_VERSION}\x00{normalise(text)}".encode()).hexdigest()
def corpus_root(anchors):
    h = hashlib.sha256()
    for k in sorted(anchors):
        h.update(k.encode()); h.update(anchors[k].encode())
    return h.hexdigest()
