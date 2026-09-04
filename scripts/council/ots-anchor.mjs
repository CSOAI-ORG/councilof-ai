/**
 * Anchor the ONE published root to Bitcoin via OpenTimestamps.
 *
 * OTS needs no key and no account, so this is the anchor that requires no owner action at all.
 * It stamps the root that is ALREADY published at /root.json — not a parallel root computed here,
 * because an anchor for bytes nobody serves proves nothing about the bytes people read.
 *
 *   node scripts/council/ots-anchor.mjs            # stamp the live root, write the receipt
 *   node scripts/council/ots-anchor.mjs --verify   # re-check the receipt on disk
 *
 * Requires the reference python client (opentimestamps) for serialization — it is the only
 * implementation whose .ots the wider ecosystem is guaranteed to read.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";

const ROOT_URL = "https://councilof.ai/root.json";
const PY = `
import binascii, json, sys, urllib.request
from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import BytesSerializationContext, BytesDeserializationContext
from opentimestamps.calendar import RemoteCalendar

mode = sys.argv[1]
if mode == "verify":
    blob = open(sys.argv[2], "rb").read()
    d = DetachedTimestampFile.deserialize(BytesDeserializationContext(blob))
    atts = [(m, a) for m, a in d.timestamp.all_attestations()]
    print(json.dumps({"digest": d.file_digest.hex(), "attestations": len(atts),
                      "kinds": sorted({type(a).__name__ for _, a in atts})}))
    sys.exit(0)

root = json.load(urllib.request.urlopen("${ROOT_URL}", timeout=30))
h = root["merkle_root"]
digest = binascii.unhexlify(h)
ts = Timestamp(digest)
used = []
for url in ["https://a.pool.opentimestamps.org", "https://b.pool.opentimestamps.org",
            "https://alice.btc.calendar.opentimestamps.org"]:
    try:
        ts.merge(RemoteCalendar(url).submit(digest, timeout=30)); used.append(url)
    except Exception as e:
        print(json.dumps({"calendar_failed": url, "why": str(e)[:80]}), file=sys.stderr)
if not used:
    print(json.dumps({"error": "no calendar accepted the digest"})); sys.exit(1)
ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
open(sys.argv[2], "wb").write(ctx.getbytes())
print(json.dumps({"merkle_root": h, "card_count": root.get("card_count"),
                  "as_of": root.get("as_of"), "calendars": used}))
`;

const out = process.argv.includes("--verify") ? "verify" : "stamp";
const file = "public/interop/anchors/public-root-latest.ots";
if (out === "verify" && !existsSync(file)) { console.error(`  no receipt at ${file}`); process.exit(1); }
const res = execFileSync("python3", ["-c", PY, out === "verify" ? "verify" : "stamp", file], { encoding: "utf8" });
console.log("  " + res.trim());
