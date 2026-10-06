#!/usr/bin/env python3
"""Builds the STAGED claim-maintenance record for Pulse Verity from ONE evidence folder (the final re-check).

    python3 scripts/claims/pulse-verity/build_final.py evidence-2026-10-06   # a folder written by final_run.sh

Spec: https://councilof.ai/spec/claim-maintenance/v0.2/ (canonical JSON per 6.1; artifact digest per 6.4).
Reads public/claims/pulse-verity/<evidence>/fetch_times.txt (one line per fetch: name, UTC time, HTTP code, URL, IP)
and <evidence>/verify_result.json. Writes public/claims/claimreg-pulse-verity-<day>.json, where <day> is the
evidence day. Publishes nothing, signs nothing, sends nothing.
"""
import json, hashlib, pathlib, sys, datetime

HERE = pathlib.Path(__file__).resolve().parent            # scripts/claims/pulse-verity/
ROOT = HERE.parents[2]                                      # repository root
CLAIMS = ROOT / 'public' / 'claims'                         # the record is written here
SUBJ = CLAIMS / 'pulse-verity'                              # checker + evidence folders, beside the record
EV = SUBJ / (sys.argv[1] if len(sys.argv) > 1 else 'evidence-2026-10-06')

def sha_file(p): return hashlib.sha256((EV / p).read_bytes()).hexdigest()
def canon(o): return json.dumps(o, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
def sha_text(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()

T = {}
for line in (EV / 'fetch_times.txt').read_text().splitlines():
    name, when, code, *_ = line.split()
    assert code == '200', line
    T[name] = when
vr = json.loads((EV / 'verify_result.json').read_text())
assert vr['all_pass'] is True, 'final re-check did not pass: do not stage'
api = json.loads((EV / 'pubkey.json').read_text())
ring = json.loads((EV / 'keyring.json').read_text())

T_RING, T_API, T_BTC, T_ETH, T_SOL = T['keyring'], T['pubkey'], T['sample_btc'], T['sample_eth'], T['sample_sol']
secs = int((datetime.datetime.fromisoformat(T_SOL.replace('Z', '+00:00')) - datetime.datetime.fromisoformat(T_RING.replace('Z', '+00:00'))).total_seconds())
DAY = T_RING[:10]
RING_URL = 'https://thepulse.markets/.well-known/pulse-verity-keys.json'
API_URL = 'https://mcp.thepulse.markets/api/index/v1/pubkey'
SAMPLE = 'https://mcp.thepulse.markets/api/index/v1/sample?symbol='
RING_SHA_26SEP = 'a96d6c5c29368caa3279ecf2be9d870e7335ee514cec6b1975a5fecd32c9ddb6'
SUBJECT = {"name": "Pulse Labs OpCo LLC (Pulse Verity Index)", "identifier": "thepulse.markets", "identifier_kind": "domain",
           "identifier_note": "Publisher named in the key ring file: \"Pulse Labs OpCo LLC\". The signing API is at mcp.thepulse.markets."}
NEXT_READ = (datetime.date.fromisoformat(DAY) + datetime.timedelta(days=7)).isoformat() + 'T14:00:00Z'
evidence = [
    {"url": RING_URL, "access_date": T_RING, "content_hash": sha_file('keyring.json')},
    {"url": API_URL, "access_date": T_API, "content_hash": sha_file('pubkey.json')},
    {"url": SAMPLE + 'BTC', "access_date": T_BTC, "content_hash": sha_file('sample_btc.json')},
    {"url": SAMPLE + 'ETH', "access_date": T_ETH, "content_hash": sha_file('sample_eth.json')},
    {"url": SAMPLE + 'SOL', "access_date": T_SOL, "content_hash": sha_file('sample_sol.json')},
]
NOT_FALSE = "that any claim here is false, misleading or exaggerated. Nothing in this record states or implies that, and nothing derived from it may be read that way"
NOT_VERDICT = "that CLAIM_MEASURED is a verdict. It means a measurement exists beside the claim; it is not a pass, a fail, a tick or a cross"
NOT_ACCURACY = "anything about the accuracy of any Pulse quoted value, contributor count, dispersion, interval or cadence value. A valid signature shows who committed to the bytes, not that the numbers are right (spec 9.5)"
# Restored at Pulse's request (30 September): the 28 September limits named endorsement, certification, listing and partnership.
NOT_ENDORSE = "an endorsement, certification, listing or partnership, or a recommendation or approval of the Pulse Verity Index or of any use of it"

S = vr['samples']; n = len(S)
n_ok = sum(1 for s in S if s['v2_valid_as_given'] and s['kid_in_keyring'] and not s['v2_line_vs_field_mismatches'])
n_tamper = sum(1 for s in S if not s['tamper_v2_canonical_one_byte']['valid'])
n_sigflip = sum(1 for s in S if not s['tamper_v2_signature_one_byte']['valid'])
n_line = sum(1 for s in S if s['tamper_json_sources_detected_by_line_check'])
n_v1 = sum(1 for s in S if s['v1_valid'])
n_v1_tamper = sum(1 for s in S if not s['tamper_v1_priceText_last_byte']['valid'])
window = {"from": T_RING, "to": T_SOL}
ring_unchanged = sha_file('keyring.json') == RING_SHA_26SEP

def artifact(**kw):
    a = {"schema": "csoai.claim-maintenance.artifact/0.2", "subject": SUBJECT, "conflicts": [],
         "observed_changes": [], "next_read_utc": NEXT_READ, "first_captured_utc": "2026-09-26T13:51:30Z"}
    a.update(kw)
    a['claim_hash'] = sha_text(a['claim_verbatim'])
    a['artifact_sha256'] = hashlib.sha256(canon({k: v for k, v in a.items() if k not in ('artifact_sha256', 'sig')})).hexdigest()
    return a

v2_claim = api['noteV2'].split(' Verify v2.signature')[0]
v1_claim = 'v1 is unchanged and still verifies.'
assert v1_claim in api['noteV2']
METHOD_V2 = ("For each print: (1) select the key in the separately hosted key ring whose kid equals v2.kid; "
             "(2) ECDSA P-256/SHA-256 verify v2.signature (IEEE-P1363 r||s, base64) over the UTF-8 bytes of v2.canonical as given; "
             "(3) check the first line is 'pulse-index-v2' and the field paths equal canonicalV2Fields.index in the published order; "
             "(4) JSON-parse each line's value and compare it with the field it names in the print (absent = null); "
             "(5) independently rebuild the canonical text from the print's own fields and compare it with v2.canonical; "
             "(6) controls: flip one bit of one byte inside the 'sources=' value of v2.canonical and re-verify; flip one bit of the signature and re-verify; "
             "change 'sources' in the parsed print and re-run step 4. Script: pulse-verity/verify_pulse.py beside this record (Python 3, library 'cryptography' 49.0.0).")
claims = [
    artifact(claim_id="PV-1", claim_verbatim=v2_claim, excerpt=True, claim_type="signature-coverage",
             source_url=API_URL, access_date=T_API,
             source_content_hash={"alg": "sha256", "value": sha_file('pubkey.json'), "covers": "raw-bytes"},
             state="CLAIM_MEASURED", window=window,
             denominator={"description": "Keyless sample prints read in the window, one per symbol. The keyless sample is limited to BTC, ETH and SOL, so this is every symbol a stranger can read without a key, one print each.",
                          "n": n, "source_url": SAMPLE + 'BTC',
                          "excluded": ["the other supported assets, batch reads and recorded prints available only with a developer key: not read",
                                       "price and batch responses, and recorded prints served by /v1/print, /v1/sample-print and /v1/record: not read",
                                       "print types other than 'index' (for example 'meme', whose v2 field list differs): not read",
                                       "prints outside the window: not read"]},
             method={"description": METHOD_V2, "evidence": evidence},
             result={"value": f"{n_ok} of {n} v2 signatures VALID under the key-ring key with every canonical line equal to its field; {n_tamper} of {n} one-byte tamper controls INVALID; {n_sigflip} of {n} signature bit-flips INVALID; {n_line} of {n} source-count changes caught by the line check",
                     "unit": "prints", "n": n},
             does_not_prove=[NOT_FALSE, NOT_VERDICT, NOT_ACCURACY,
                             f"that every print carries a valid v2 block. {n} prints were read, in a {secs}-second window, from the keyless sample only",
                             "that fields outside v2.canonical are signed. The publisher lists signature, sig, kid, v2 and request-envelope fields as unsigned, and they are",
                             "that the private key is held securely or only by Pulse. A signature shows that the holder of the key committed to the bytes",
                             NOT_ENDORSE]),
    artifact(claim_id="PV-2", claim_verbatim=ring['independentCopy'], claim_type="key-distribution",
             source_url=RING_URL, access_date=T_RING,
             source_content_hash={"alg": "sha256", "value": sha_file('keyring.json'), "covers": "raw-bytes"},
             state="CLAIM_MEASURED", window={"from": T_RING, "to": T_API},
             denominator={"description": "Keys listed in the key ring file and in the API key ring (verificationKeys), compared by kid and by PEM text", "n": len(ring['keys'])},
             method={"description": ("GET both surfaces with User-Agent CSOAI-verify/0.1. Compare the set of kids, the PEM text of each key and activeKid. "
                                     "Record the host and resolved address of each response (see fetch_times.txt and the *.headers files)."),
                     "evidence": evidence[:2]},
             result={"value": ("kid sets identical ({k} key); PEM identical; activeKid identical; served from two hostnames on two hosting providers; "
                               "key-ring bytes {u} the 2026-09-26 read").format(k=len(ring['keys']), u='identical to' if ring_unchanged else 'CHANGED since'),
                     "unit": "keys", "n": len(ring['keys'])},
             does_not_prove=[NOT_FALSE, NOT_VERDICT,
                             "that the key is anchored outside Pulse's control. Both copies are under the one domain, thepulse.markets, with one DNS operator; whoever controls that domain controls both copies. The separation is of hosting, not of control",
                             "that the two copies will stay in agreement after this window. That is what the scheduled re-read checks",
                             NOT_ACCURACY, NOT_ENDORSE]),
    artifact(claim_id="PV-3", claim_verbatim=ring['rotation'], claim_type="key-rotation-policy",
             source_url=RING_URL, access_date=T_RING,
             source_content_hash={"alg": "sha256", "value": sha_file('keyring.json'), "covers": "raw-bytes"},
             state="UNMEASURED",
             measurement_plan=("Settleable only when a rotation occurs. Re-read both key rings weekly. When activeKid changes: check that both surfaces list the same kids on the same UTC day, "
                               "that the previous kid remains listed with active=false, and that a print signed under the previous kid, held from an earlier read, still verifies against the ring. "
                               "Until a rotation is observed there is nothing to measure. Observed at this read, recorded without comment: one key is listed, it is active and equals activeKid; "
                               "the file carries a file-level 'updated' date (2026-09-25) and no per-key created, not-before, not-after or retired dates."),
             does_not_prove=[NOT_FALSE, "that the rotation procedure works or will be followed. No rotation has been observed", NOT_ENDORSE]),
    artifact(claim_id="PV-4", claim_verbatim=v1_claim, excerpt=True, claim_type="signature-coverage",
             source_url=API_URL, access_date=T_API,
             source_content_hash={"alg": "sha256", "value": sha_file('pubkey.json'), "covers": "raw-bytes"},
             state="CLAIM_MEASURED", window=window,
             denominator={"description": "Keyless sample prints read in the window, one per symbol (BTC, ETH, SOL)", "n": n, "source_url": SAMPLE + 'BTC',
                          "excluded": ["prints requiring a developer key", "prints outside the window"]},
             method={"description": "Build 'pulse-index-v1\\n{symbol}\\n{priceText}\\n{at}\\n{grade}' from the print, verify the top-level signature with the key-ring key named by the print's kid; control: flip one bit in the last byte of priceText and re-verify. Script: pulse-verity/verify_pulse.py.",
                     "evidence": evidence},
             result={"value": f"{n_v1} of {n} v1 signatures VALID; {n_v1_tamper} of {n} one-byte tamper controls INVALID", "unit": "prints", "n": n},
             does_not_prove=[NOT_FALSE, NOT_VERDICT, NOT_ACCURACY,
                             "that v1 covers anything beyond symbol, quoted value text, timestamp and grade. It does not, and says so; the full record is covered only by v2 (PV-1)",
                             NOT_ENDORSE]),
]

history = [
    {"utc": "2026-09-19T23:09Z", "who": "Pulse", "what": "Unsolicited email to the maintainer describing the Pulse Verity MCP server; states that each observation is signed ECDSA P-256 over symbol, quoted value, timestamp and grade, and that each print also carries a venue count and dispersion.", "public": False},
    {"utc": "2026-09-20T01:29Z", "who": "CSOAI", "what": "Reply: a valid publisher signature establishes integrity and origin, not truth; asked for the signing specification, key rotation and revocation, and whether venue count and spread can be reproduced; asked Pulse not to write an adapter.", "public": False},
    {"utc": "2026-09-22T03:44Z", "who": "CSOAI", "what": "Classified contributor count and dispersion as UNMEASURED (publisher assertions that no outside party can reproduce). This message called them 'signed Pulse assertions'. That wording was inaccurate for the v1 signature, which does not cover them; see the next CSOAI entry.", "public": False},
    {"utc": "2026-09-23T05:56Z", "who": "CSOAI", "what": "ORIGINAL OBSERVATION AND PRIVATE NOTICE. Reported that a fresh BTC sample verified against Pulse's published P-256 key, that the v1 signature binds symbol, quoted value text, timestamp and grade, and that changing sources, dispersionBps, interval or cadence in the downloaded JSON leaves the signature valid. Suggested a versioned signature over the complete print. The working files of that 23 September run are not held with this record; the observation is stated here as reported in that message.", "public": False},
    {"utc": "2026-09-24T21:53Z", "who": "Pulse", "what": "Acknowledged that the signature covered symbol, quoted value, timestamp and grade but not venue count or spread; said the signature would be extended to the full record.", "public": False},
    {"utc": "2026-09-25T00:29:58Z", "who": "Pulse", "what": "FIX 1: pulse-index-v2 went live when backend release r1305 finished deploying. Time supplied by Pulse on 2026-09-27 and confirmed by Pulse on 2026-09-28 as matching its deployment records; not independently established from the current public URLs. The second, versioned signature, pulse-index-v2, over the full record, was added to the REST index prints, not to every print: Pulse's correction of 30 September says streaming frames, webhooks, history rows and meme tape still carry v1 only. v1 unchanged.", "public": False},
    {"utc": "2026-09-26T01:19Z", "who": "CSOAI", "what": "First re-verification (reported privately): v2 canonical rebuilt from the record's fields matched Pulse's, the v2 signature verified, and changing one field (source count) made it stop verifying. Noted that the key was published only on the signing API's own endpoint and suggested a separately hosted copy with a rotation note.", "public": False},
    {"utc": "2026-09-26T04:39Z", "who": "Pulse", "what": "FIX 2: the separately hosted key-ring file went live at https://thepulse.markets/.well-known/pulse-verity-keys.json. Time supplied by Pulse on 2026-09-27 and confirmed on 2026-09-28; Pulse says the file's 'updated' field reads 2026-09-25 because that field records the date in Pacific time. The current public file does not independently establish its first publication time.", "public": False},
    {"utc": "2026-09-26T13:51:30Z to 13:52:08Z", "who": "CSOAI", "what": "Second re-verification (draft record of 26 September) using the separately hosted key ring and three fresh prints; all tamper controls came back INVALID, as they should. Evidence: pulse-verity/evidence-2026-09-26/.", "public": True},
    {"utc": "2026-09-27T17:20Z", "who": "Pulse", "what": "Reviewed the draft; supplied the two UTC times above; agreed to publication on 1 October after a final re-check. In Pulse's words (the wording Pulse asked us to quote, 30 September): \"Everything else about our actions reads correctly to us.\"", "public": False},
    {"utc": "2026-09-28T03:28:06Z to 03:32:51Z", "who": "CSOAI", "what": "Maintenance re-read: key-ring bytes unchanged from 26 September; fresh BTC, ETH and SOL v2 and v1 signatures verified; tamper controls INVALID. Evidence: pulse-verity/evidence-2026-09-28/ (RECHECK.json).", "public": True},
    {"utc": "2026-09-28T16:02Z", "who": "Pulse", "what": "Confirmed the corrected times match its deployment records. Pulse's note: \"these sample tests demonstrate verification of the signed fields, not price accuracy, independent key control, or a tested rotation.\" Asked to see the final re-check results and any changed wording before publication.", "public": False},
]
# Dated entries after 28 September, keyed by when each ended. Each is carried only when the final re-check started after it.
LATER = [
    ("2026-09-30T03:53:12Z", {"utc": "2026-09-30T03:53:11Z to 03:53:12Z", "who": "CSOAI", "what": "Pre-publication re-read: 3 of 3 v2 and v1 signatures verified under the separately hosted key ring; tamper controls INVALID; key-ring bytes unchanged. Evidence: pulse-verity/evidence-2026-09-30/.", "public": True}),
    ("2026-09-30T21:16Z", {"utc": "2026-09-30T21:16Z", "who": "Pulse", "what": "Corrected its /pubkey note, which had said every print carries a v2 block: the v2 block is carried by its REST price responses (price, sample, batch and archived prints), while streaming frames, webhooks, history rows and meme tape still carry v1 only. Gave a written OK to publish this record and the account of its own actions, on two conditions: the final re-check gives the same outcome, and five wording changes are made (all five are made in this version). Pulse said its OK is not an endorsement of CSOAI or of the Claim Maintenance specification, and that it keeps its right of reply.", "public": False}),
    ("2026-10-01T07:50:07Z", {"utc": "2026-10-01T07:50:04Z to 07:50:07Z", "who": "CSOAI", "what": "Scheduled daily re-read by the maintainer's claim watch, with the same checker (verify_pulse.py, same sha256): 3 of 3 v2 and v1 signatures verified under the separately hosted key ring; tamper controls INVALID; key-ring bytes unchanged. The PV-1 source wording had changed, as Pulse said on 30 September it would; the wording quoted under PV-1 is the corrected one. Evidence: pulse-verity/evidence-2026-10-01/.", "public": True}),
]
for after, h in LATER:
    if T_RING > after:
        history.append(h)
history.append({"utc": f"{T_RING} to {T_SOL[11:]}", "who": "CSOAI", "what": f"FINAL RE-CHECK recorded in this file (PV-1, PV-2, PV-4): {n_ok} of {n} v2 signatures VALID under the separately hosted key ring; all tamper controls INVALID; key-ring bytes {'unchanged since 26 September' if ring_unchanged else 'CHANGED since 26 September'}. Evidence: pulse-verity/{EV.name}/.", "public": True})
EARLIER_READS = [d for d in ('2026-09-26', '2026-09-28', '2026-09-30', '2026-10-01') if d < DAY]

registry = {
    "schema": "csoai.claim-registry/0.3",
    "registry_id": f"claimreg-pulse-verity-{DAY}",
    "status": "STAGED, NOT PUBLISHED. Pulse gave a written OK on 30 September, conditional on the same outcome at the final re-check and five wording changes; this version carries both. It publishes only after Pulse's last look at this exact wording, if Pulse wants one, and the owner's yes.",
    "created_utc": "2026-09-26",
    "built_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    "maintainer": "CSOAI Ltd (Council of AI), UK Companies House 16939677 - claim maintenance (measurement, never certification)",
    "conforms_to": "https://councilof.ai/spec/claim-maintenance/v0.2/",
    "conforms_to_sha256_of_markdown_read": "d649ba0fdefb63abc205102bc8863db2e7852b207fd4e9e23e05e286e13e3b2e",
    "artifact_schema": "csoai.claim-maintenance.artifact/0.2",
    "selection_rule": "A public claim that is specific enough to capture verbatim and is about infrastructure a third party relies on. This subject entered because the maintainer tested the signature boundary of its feed after the subject wrote to the maintainer.",
    "totals": {"subjects": 1, "claims": len(claims), "by_state": {s: sum(1 for c in claims if c['state'] == s) for s in ("CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE")}},
    "claims": claims,
    "case_history": history,
    "case_history_note": "Dated account of how this record arose. Entries marked public:false come from private email between the maintainer and the subject; they are carried here with the subject's written agreement to publication of a dated record, and none of them is a claim artifact (spec 1.3). Times are UTC, converted from message headers.",
    "what_this_record_establishes": [
        f"Between {T_RING} and {T_SOL}, three keyless Pulse prints (BTC, ETH, SOL) carried a pulse-index-v2 signature that verified under the only key in the separately hosted key ring, and every signed line matched the field it names.",
        "Changing one byte of the signed text, or one bit of the signature, made each of those signatures INVALID; changing the source count in a print was caught by the line check.",
        "The key ring file and the signing API listed the same single key, from two hostnames on two hosting providers.",
        f"The same checks gave the same outcome at the {len(EARLIER_READS)} earlier reads ({', '.join(EARLIER_READS)}), with identical key-ring bytes.",
    ],
    "what_this_record_does_not_establish": [
        "It is not an endorsement, certification, listing or partnership, and not a recommendation or approval of the Pulse Verity Index. It says nothing about whether any quoted value, contributor count, dispersion, interval or cadence value is accurate: a valid signature shows who committed to the bytes, not that the numbers are right (spec 9.5). Those values remain publisher-asserted values that no outside party can reproduce, because the contributor-level inputs, weights and selection rules are not published.",
        f"It does not show that every print is signed this way: three prints were read, from the keyless sample, in one {secs}-second window.",
        "It does not show independent control of the key: both copies of the key ring sit under one domain.",
        "It does not test key rotation or revocation: no rotation has happened.",
        "It is not a mark, grade, rating or audit of any kind, and none may be derived from it.",
    ],
    "subject_review": "Pulse reviewed the 26 September draft and on 27 September supplied two corrected UTC times for its own actions, confirming on 28 September that they match its deployment records. In Pulse's words (the wording Pulse asked us to quote, 30 September): \"Everything else about our actions reads correctly to us.\" On 30 September Pulse also corrected its own /pubkey note (see PV-1 and the 25 September entry) and asked for five wording changes, all made in this version. Pulse's OK covers publishing the record and the account of its own actions; it is not an endorsement of CSOAI or of the Claim Maintenance specification, and Pulse keeps its right of reply. The deployment times remain attributed to Pulse. States, measurements, limits and the publication decision remain the maintainer's (spec 1.2).",
    "conflicts_note": "No commercial relationship, membership, investment, employment or standards-body co-participation exists between CSOAI Ltd and Pulse Labs OpCo LLC. Pulse offered to write an integration on 19 September; the maintainer declined on 20 September. No payment has passed in either direction.",
    "right_of_reply": "Report any defect in this record to nicholas@csoai.org. Corrections are published at https://councilof.ai/api/corrections.",
    "how_to_rerun": {"verify": f"python3 public/claims/pulse-verity/verify_pulse.py public/claims/pulse-verity/{EV.name}", "refetch": "bash scripts/claims/pulse-verity/final_run.sh (fetches the five URLs into a new dated folder, verifies, rebuilds)", "build": f"python3 scripts/claims/pulse-verity/build_final.py {EV.name}"},
    "evidence_files": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(EV.iterdir()) if p.is_file()},
    "tools": {"verify_pulse.py": hashlib.sha256((SUBJ / 'verify_pulse.py').read_bytes()).hexdigest()},
    "signature_state": "UNSIGNED UNTIL PUBLICATION. On publication it is signed by sidecar under did:web:csoai.org#board-attestation-1, as the existing registries are.",
    "timestamp_state": "NONE until publication.",
    "does_not_prove": [NOT_FALSE, NOT_VERDICT, NOT_ACCURACY, NOT_ENDORSE, "that a digest in this file was committed to any external timestamp. None has been yet"],
}
registry['registry_digest'] = hashlib.sha256(canon({k: v for k, v in registry.items() if k != 'registry_digest'})).hexdigest()
out = CLAIMS / f"{registry['registry_id']}.json"
out.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({"out": str(out.relative_to(ROOT)), "registry_digest": registry['registry_digest'], "file_sha256": hashlib.sha256(out.read_bytes()).hexdigest(),
                  "window": window, "seconds": secs, "v2_ok": f"{n_ok}/{n}", "ring_unchanged": ring_unchanged,
                  "artifacts": {c['claim_id']: c['artifact_sha256'] for c in claims}}, indent=1))
