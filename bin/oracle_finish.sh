#!/usr/bin/env bash
# oracle_finish.sh — finish the Oracle catapult. Written by MEOK-SOV3 2026-07-10.
# Uses the NEW oci at ~/bin/oci explicitly (two `oci` binaries are on PATH: ~/bin/oci and
# /opt/homebrew/bin/oci — pin one to avoid ambiguity). NOTE: root cause of the earlier
# `region list` timeout is NOT confirmed — candidates are (a) no ~/.oci/config existed at that
# point, (b) public key not uploaded to Oracle. This script fixes both by regenerating config
# state and printing the key to upload; run `region list` after upload to see which it was.
set -u
OCI="$HOME/bin/oci"
KEY="$HOME/.oci/api_key.pem"
PUB="$HOME/.oci/api_key_public.pem"
TENANCY="ocid1.tenancy.oc1..aaaaaaaajyluwrdhqfgf6auzgomu3i7v3uvfzxhbc7me6xy5t4wgayjnu7zq"

echo "🜏 ORACLE FINISH — step 1: derive the public key that MUST be uploaded"
openssl rsa -pubout -in "$KEY" -out "$PUB" 2>/dev/null
echo "   Fingerprint of your local key (must match what you upload):"
openssl rsa -pubout -outform DER -in "$KEY" 2>/dev/null | openssl md5 -c | awk '{print "   "$2}'
echo
echo "   >>> COPY THE BLOCK BELOW and paste into:"
echo "   cloud.oracle.com -> Profile (top-right) -> User settings -> API keys -> Add API key"
echo "   -> 'Paste a public key' -> paste this -> Add:"
echo "   ----------------------------------------------------------------"
cat "$PUB"
echo "   ----------------------------------------------------------------"
echo
echo "🜏 step 2: AFTER you've added it in the console, test auth (should list regions):"
echo "   $OCI iam region list --output table"
echo
echo "🜏 step 3: when auth works, provision the free ARM A1 (run: bash $HOME/clawd/bin/oracle_provision.sh)"
