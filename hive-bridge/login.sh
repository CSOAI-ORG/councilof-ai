#!/usr/bin/env bash
# ONE-TIME human step. Opens the dedicated hive-bridge Chrome profile HEADED so
# Nick logs into the SaaS the hives need to act in. Whatever you log into is
# written to ~/.meok-browser-profile and reused forever (cookies + localStorage
# + IndexedDB persist — this is what fixes the Supabase/Lovable JWT-in-localStorage
# problem that killed the cookie-copy approach).
#
# Log into ALL of these, then just close the window:
#   • https://lovable.dev          (→ unblocks FishKeeper/KoiKeeper source export)
#   • https://vercel.com           (→ domain reattach, /api 403, aliases)
#   • https://dashboard.stripe.com (→ live flip, products, webhook)
#   • https://github.com           (→ repo create, mcp-publisher device flow)
#   • https://accounts.google.com  (→ anything Google-gated)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PROFILE="${HIVE_BRIDGE_PROFILE:-$HOME/.meok-browser-profile}"
mkdir -p "$PROFILE"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
echo "Opening dedicated profile — log into Lovable, Vercel, Stripe, GitHub, Google, then close the window."
exec "$CHROME" --user-data-dir="$PROFILE" \
  https://lovable.dev/projects \
  https://vercel.com/dashboard \
  https://dashboard.stripe.com \
  https://github.com
