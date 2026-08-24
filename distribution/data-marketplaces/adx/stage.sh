#!/usr/bin/env bash
# Validate ADX listing manifest — does NOT submit.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
node -e "
const m = require('$DIR/listing-manifest.json');
const required = ['name','displayName','description','publisher','endpoints'];
for (const k of required) {
  if (!m[k]) { console.error('Missing:', k); process.exit(1); }
}
console.log('[adx] Manifest valid:', m.name);
console.log('[adx] NOT SUBMITTED — owner gate for seller-of-record');
"
