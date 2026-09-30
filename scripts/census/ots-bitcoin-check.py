"""Check each BitcoinBlockHeaderAttestation in an upgraded .ots against block headers served by two public explorers.
python3 ots_check.py OUT.json FILE:PROOF [FILE:PROOF ...]"""
import hashlib, json, sys, time, urllib.request, datetime
from opentimestamps.core.timestamp import DetachedTimestampFile
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.serialize import BytesDeserializationContext
UA = {"user-agent": "CSOAI-census/0.1 ots-check (+https://councilof.ai/census)"}
SRC = {"blockstream.info": "https://blockstream.info/api", "mempool.space": "https://mempool.space/api"}

def get(u):
    time.sleep(1.1)
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read().decode().strip()

out = {"schema": "csoai.ots-bitcoin-check/0.1", "checked_utc": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
       "method": ("each BitcoinBlockHeaderAttestation's commitment (byte-reversed) must equal the merkle root of the block header at "
                  "that height as served by two independent public sources; each raw header must double-SHA256 to the block hash it "
                  "is served under. No local Bitcoin node."), "files": {}}
for arg in sys.argv[2:]:
    f, proof = arg.split(":")
    data = open(f, "rb").read()
    d = DetachedTimestampFile.deserialize(BytesDeserializationContext(open(proof, "rb").read()))
    assert d.file_digest == hashlib.sha256(data).digest(), "proof does not bind to file"
    atts = []
    for msg, att in d.timestamp.all_attestations():
        if isinstance(att, BitcoinBlockHeaderAttestation):
            want = msg[::-1].hex()
            srcs = {}
            for name, base in SRC.items():
                h = get(f"{base}/block-height/{att.height}")
                hdr = bytes.fromhex(get(f"{base}/block/{h}/header"))
                ok_hash = hashlib.sha256(hashlib.sha256(hdr).digest()).digest()[::-1].hex() == h
                mr = hdr[36:68][::-1].hex()
                srcs[name] = {"block_hash": h, "header_hashes_to_block_hash": ok_hash, "merkle_root": mr, "matches": ok_hash and mr == want}
            atts.append({"height": att.height, "merkle_root_from_proof": want, "sources": srcs,
                         "state": "BITCOIN_ATTESTED" if all(s["matches"] for s in srcs.values()) else "MISMATCH"})
        elif isinstance(att, PendingAttestation):
            atts.append({"pending": att.uri})
    out["files"][f] = {"sha256": hashlib.sha256(data).hexdigest(), "proof": proof,
                       "proof_sha256": hashlib.sha256(open(proof, "rb").read()).hexdigest(), "attestations": atts,
                       "state": "BITCOIN_ATTESTED" if any(a.get("state") == "BITCOIN_ATTESTED" for a in atts) and
                                not any(a.get("state") == "MISMATCH" for a in atts) else "NOT_ATTESTED"}
json.dump(out, open(sys.argv[1], "w"), indent=1)
print(json.dumps({k: (v["state"], [a.get("height") for a in v["attestations"]]) for k, v in out["files"].items()}))
