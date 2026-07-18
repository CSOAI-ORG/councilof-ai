# CSOAI.ORG STRIPE ENV KEYS (to set in Vercel)
# These 3 lines need to be in Vercel dashboard → Settings → Environment Variables
# Until set: checkout shows the buttons but no payment processes
# After set: first £ flows in immediately

STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Existing env
ANTHROPIC_API_KEY=***
ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
