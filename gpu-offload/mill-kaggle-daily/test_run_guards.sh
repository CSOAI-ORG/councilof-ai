#!/bin/bash
# test_run_guards.sh — exercises run.sh's step 3b (HOLD + Kaggle credential deny list) and step 4's build-pod address
# block in isolation: each block is cut out of run.sh by its markers and run against a stub receipt() in a temp HOME.
# Nothing here reads a real credential, touches the network or pushes anything. Exit 0 = all cases pass.
set -uo pipefail
HERE_T=$(cd "$(dirname "$0")" && pwd)
RUN=${1:-$HERE_T/run.sh}
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
guard=$(awk '/^# 3b\. Kaggle credential guard/{p=1} p&&/^\[ -d "\$CLONE\/.git" \]/{exit} p' "$RUN")
addr=$(awk '/^BUILD_POD_PORT=; BUILD_POD_HOST=$/{p=1} p{print} p&&/^PORT=\$BUILD_POD_PORT; HOSTP=\$BUILD_POD_HOST$/{exit}' "$RUN")
[ -n "$guard" ] && [ -n "$addr" ] || { echo "FAIL: markers not found in $RUN"; exit 1; }
pass=0; failn=0
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "ok   $1"; else failn=$((failn+1)); echo "FAIL $1: want [$3] got [$2]"; fi; }
run_guard() {  # prints "<rc>|<state>"
  ( HOME=$T/home HERE=$T/lane
    receipt() { echo "$1" > "$T/state"; }
    eval "$guard"; echo 0 > "$T/rc" ) ; local rc=$?
  [ -f "$T/rc" ] && rc=$(cat "$T/rc")
  echo "$rc|$(cat "$T/state" 2>/dev/null)"; rm -f "$T/rc" "$T/state"
}
mkdir -p "$T/home/.kaggle" "$T/home/.secrets" "$T/lane"
printf 'OLD-FAKE-CREDENTIAL-0123456789' > "$T/home/.kaggle/access_token"
check "no deny list, no hold -> proceeds"            "$(run_guard)" "0|"
echo "rotation pending" > "$T/lane/HOLD"
check "HOLD file -> HELD rc 75"                       "$(run_guard)" "75|HELD"
rm "$T/lane/HOLD"
sha256sum "$T/home/.kaggle/access_token" | cut -c1-64 > "$T/home/.secrets/kaggle-credential-denylist.sha256"
check "denied access_token -> HELD rc 75"            "$(run_guard)" "75|HELD"
printf 'NEW-FAKE-CREDENTIAL-9876543210' > "$T/home/.kaggle/access_token"
check "rotated access_token -> proceeds"             "$(run_guard)" "0|"
printf '{"username":"x","key":"OLD"}' > "$T/home/.kaggle/kaggle.json"
sha256sum "$T/home/.kaggle/kaggle.json" | cut -c1-64 >> "$T/home/.secrets/kaggle-credential-denylist.sha256"
check "denied legacy kaggle.json still present -> HELD" "$(run_guard)" "75|HELD"
rm "$T/home/.kaggle/kaggle.json"
check "legacy moved aside -> proceeds"               "$(run_guard)" "0|"
# a newline-terminated credential file whose token is denied only by its stripped fingerprint (the live file ends in \n)
printf 'NL-FAKE-CREDENTIAL-5555555555\n' > "$T/home/.kaggle/access_token"
printf 'NL-FAKE-CREDENTIAL-5555555555' | sha256sum | cut -c1-64 >> "$T/home/.secrets/kaggle-credential-denylist.sha256"
check "denied by stripped fingerprint (file ends in newline) -> HELD" "$(run_guard)" "75|HELD"
printf 'NEW-FAKE-CREDENTIAL-9876543210' > "$T/home/.kaggle/access_token"
# address block
printf 'BUILD_POD_ID=x\nBUILD_POD_HOST=root@192.0.2.10\nBUILD_POD_PORT=29162\n' > "$T/pod.env"
got=$( MKD_POD_ENV=$T/pod.env; eval "$addr"; echo "$PORT $HOSTP" )
check "address from build-pod.env"                   "$got" "29162 root@192.0.2.10"
got=$( MKD_POD_ENV=$T/absent.env; eval "$addr"; echo "[$PORT][$HOSTP]" )
check "absent env file -> empty, not fatal"          "$got" "[][]"
# rotate-kaggle-credential.sh, against a stub kaggle CLI (no network)
ROT=${2:-$HERE_T/rotate-kaggle-credential.sh}
R=$T/rot; mkdir -p "$R/home/.kaggle" "$R/bin"
printf '#!/bin/sh\necho "nicktempleman/csoai-mill-kaggle-daily has status \\"KernelWorkerStatus.COMPLETE\\""\n' > "$R/bin/kaggle"; chmod +x "$R/bin/kaggle"
printf 'OLD-FAKE-TOKEN-AAAAAAAAAAAAAAAAAAAA' > "$R/home/.kaggle/access_token"
printf '{"username":"u","key":"OLD-LEGACY"}' > "$R/home/.kaggle/kaggle.json"
old_fp=$(sha256sum "$R/home/.kaggle/access_token" | cut -c1-64)
out=$(printf 'OLD-FAKE-TOKEN-AAAAAAAAAAAAAAAAAAAA\n' | HOME=$R/home KAGGLE_BIN=$R/bin/kaggle bash "$ROT" 2>&1); rc=$?
check "rotate refuses the old token"                  "$rc" "1"
check "old file untouched after refusal"              "$(sha256sum "$R/home/.kaggle/access_token" | cut -c1-64)" "$old_fp"
out=$(printf 'NEW-FAKE-TOKEN-BBBBBBBBBBBBBBBBBBBB\n' | HOME=$R/home KAGGLE_BIN=$R/bin/kaggle bash "$ROT" 2>&1); rc=$?
check "rotate installs a new token"                   "$rc" "0"
check "new token in place"                            "$(cat "$R/home/.kaggle/access_token")" "NEW-FAKE-TOKEN-BBBBBBBBBBBBBBBBBBBB"
check "new token mode 600"                            "$(stat -c %a "$R/home/.kaggle/access_token")" "600"
check "legacy kaggle.json moved aside"                "$(ls "$R/home/.kaggle" | grep -c '^kaggle.json.revoked-')" "1"
check "old fingerprint on deny list"                  "$(grep -cxF "$old_fp" "$R/home/.secrets/kaggle-credential-denylist.sha256")" "1"
check "no token bytes in output"                      "$(printf '%s' "$out" | grep -c -E 'NEW-FAKE|OLD-FAKE|OLD-LEGACY')" "0"
( HOME=$R/home HERE=$R/lane; mkdir -p "$HERE"; receipt() { echo "$1" > "$T/state"; }; eval "$guard"; echo 0 > "$T/rc" ); grc=$?
[ -f "$T/rc" ] && grc=$(cat "$T/rc"); rm -f "$T/rc" "$T/state"
check "guard passes after rotation"                   "$grc" "0"
# re-pasting the OLD token must be refused even when the old file ends in a newline
R2=$T/rot2; mkdir -p "$R2/home/.kaggle"
printf 'OLD-NL-TOKEN-CCCCCCCCCCCCCCCCCCCCCC\n' > "$R2/home/.kaggle/access_token"
nl_fp=$(sha256sum "$R2/home/.kaggle/access_token" | cut -c1-64)
out=$(printf 'OLD-NL-TOKEN-CCCCCCCCCCCCCCCCCCCCCC\n' | HOME=$R2/home KAGGLE_BIN=$R/bin/kaggle bash "$ROT" 2>&1); rc=$?
check "rotate refuses the old token from a newline-terminated file" "$rc" "1"
check "newline-terminated old file untouched after refusal" "$(sha256sum "$R2/home/.kaggle/access_token" | cut -c1-64)" "$nl_fp"
echo "passed=$pass failed=$failn"
[ "$failn" -eq 0 ]
