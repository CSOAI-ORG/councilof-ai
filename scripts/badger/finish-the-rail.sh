#!/usr/bin/env bash
# finish-the-rail.sh — every remaining step of the x402 revenue chain, in order, in one command.
#
# Each stage checks the world before acting and refuses to invent a result. Run it as often as
# you like: stages that are already done report DONE and cost nothing.
#
#   bash scripts/badger/finish-the-rail.sh              # everything free; never moves real money
#   bash scripts/badger/finish-the-rail.sh --earn       # ALSO does the real $0.02 call (needs funds)
#
# WHAT IS FREE AND WHAT IS NOT. Stages 1-4 move no money: a zero-value EIP-3009 transfer settles
# with an empty wallet because there is no balance to be insufficient. Only --earn spends, and
# only 0.02 USDC.
set -uo pipefail
cd "$(dirname "$0")/../.."

DOOR="https://councilof.ai/api/free-door"
PAID="https://councilof.ai/api/request-attestation?subject=gpt-4o"
ESTATE="0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
USDC="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
BAZAAR="https://facilitator.payai.network/discovery/resources"
UA="csoai-finish/1.0"
say() { printf "\n\033[1m%s\033[0m\n" "$*"; }

say "1/5  is the free door deployed?"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -A "$UA" "$DOOR")
if [ "$CODE" != "402" ]; then
  echo "     $DOOR -> $CODE (want 402)"
  echo "     NOT READY. The deploy has not shipped it. Re-run when GHA deploy.yml is green."
  exit 1
fi
echo "     402 — live, and it is a real x402 door priced at zero."

say "2/5  seed it into the Bazaar (zero value, no funds needed)"
python3 - "$DOOR" <<'PY'
import json,secrets,sys,time,urllib.request,urllib.error
from eth_account import Account
from eth_account.messages import encode_typed_data
door=sys.argv[1]
req=urllib.request.Request(door,headers={"User-Agent":"csoai-finish/1.0","Accept":"application/json"})
try: ch=json.loads(urllib.request.urlopen(req,timeout=60).read())
except urllib.error.HTTPError as e: ch=json.loads(e.read())
acc=ch["accepts"][0]
amt=acc.get("amount") or acc["maxAmountRequired"]
if str(amt)!="0":
    print(f"     REFUSING: the door advertises {amt}, not 0. A seed must cost nothing."); sys.exit(1)
a=Account.create(); now=int(time.time())
auth={"from":a.address,"to":acc["payTo"],"value":0,"validAfter":0,
      "validBefore":now+900,"nonce":"0x"+secrets.token_hex(32)}
t={"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},
     {"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],
   "TransferWithAuthorization":[{"name":"from","type":"address"},{"name":"to","type":"address"},
     {"name":"value","type":"uint256"},{"name":"validAfter","type":"uint256"},
     {"name":"validBefore","type":"uint256"},{"name":"nonce","type":"bytes32"}]},
  "primaryType":"TransferWithAuthorization",
  "domain":{"name":acc["extra"]["name"],"version":acc["extra"]["version"],
            "chainId":8453,"verifyingContract":acc["asset"]},"message":auth}
sg=Account.sign_message(encode_typed_data(full_message=t),a.key).signature.hex()
if not sg.startswith("0x"): sg="0x"+sg
reqs={"scheme":"exact","network":"base","maxAmountRequired":"0","resource":door.split("?")[0],
      "description":ch["resource"].get("description","")[:120],"mimeType":"application/json",
      "payTo":acc["payTo"],"maxTimeoutSeconds":900,"asset":acc["asset"],
      "extra":{k:v for k,v in acc["extra"].items() if k in ("name","version")}}
body={"x402Version":1,"paymentPayload":{"x402Version":1,"scheme":"exact","network":"base",
      "payload":{"signature":sg,"authorization":{k:(str(v) if isinstance(v,int) else v)
                                                 for k,v in auth.items()}}},
      "paymentRequirements":reqs}
def post(p):
    r=urllib.request.Request("https://facilitator.payai.network"+p,data=json.dumps(body).encode(),
      headers={"Content-Type":"application/json","User-Agent":"csoai-finish/1.0"})
    try:
        x=urllib.request.urlopen(r,timeout=90); return x.status,json.loads(x.read() or b"{}")
    except urllib.error.HTTPError as e:
        raw=e.read()
        try: return e.code,json.loads(raw or b"{}")
        except Exception: return e.code,{"raw":raw.decode()[:200]}
c,v=post("/verify")
if c!=200 or not v.get("isValid"):
    print(f"     verify failed: HTTP {c} {v.get('invalidReason') or v}"); sys.exit(1)
c,s=post("/settle")
print(f"     settle: HTTP {c} success={s.get('success')} tx={s.get('transaction')}")
sys.exit(0 if s.get("success") else 1)
PY
[ $? -ne 0 ] && { echo "     seed did not settle — stopping."; exit 1; }

say "3/5  did the index pick us up? (may lag; re-run later if not)"
python3 - "$BAZAAR" "$ESTATE" <<'PY'
import json,sys,urllib.request
base,ours=sys.argv[1],sys.argv[2].lower()
found=0
for off in (0,1000,2000,3000):
    try:
        r=urllib.request.Request(f"{base}?limit=1000&offset={off}",headers={"User-Agent":"csoai-finish/1.0"})
        d=json.load(urllib.request.urlopen(r,timeout=60))
    except Exception: break
    for it in d.get("items",[]):
        for a in (it.get("accepts") or []):
            if (a.get("payTo") or "").lower()==ours:
                res=it.get("resource") or {}
                print("     INDEXED:", res.get("url") if isinstance(res,dict) else res); found+=1
    if off+1000>=(d.get("pagination") or {}).get("total",0): break
print(f"     listings under the estate payTo: {found}" + ("" if found else "  (not yet — indexing can lag)"))
PY

say "4/5  is the payer wallet funded?"
if [ ! -f .payer.key ]; then
  echo "     no .payer.key — run: bash scripts/badger/make-payer-wallet.sh"
else
  ADDR=$(python3 -c "from eth_account import Account;print(Account.from_key(open('.payer.key').read().strip()).address)")
  BAL=$(curl -s --max-time 25 -X POST -H "Content-Type: application/json" \
    --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$USDC\",\"data\":\"0x70a08231000000000000000000000000${ADDR#0x}\"},\"latest\"]}" \
    https://mainnet.base.org | python3 -c "import sys,json;print(int(json.load(sys.stdin).get('result','0x0'),16)/1e6)")
  echo "     payer $ADDR holds $BAL USDC"
fi

say "5/5  the earning call"
if [ "${1:-}" != "--earn" ]; then
  echo "     skipped. Re-run with --earn once the payer holds >= 0.02 USDC."
  echo "     This is the only stage that spends anything."
  exit 0
fi
export X402_PAYER_KEY=$(cat .payer.key)
python3 scripts/badger/csoai-open-facilitator.py --resource "$PAID" --settle
