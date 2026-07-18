# CLAUDE PATTERNS LEARNED — JEEVES Front-End Playbook

> **Status**: Read-only extraction. Patterns extracted from `csoai-static-deploy2/` (380+ HTML files, 19 Vercel serverless endpoints) + `meok-ai-landing/` (8 pages) + `AGENTS.md` / `CLAUDE.md` / skill files.
> **Date**: 13 Jul 2026
> **Author**: Heavy parallel CLAUDE-CODE-LEARNER subagent under JEEVES.
> **Mission**: Produce a single-source playbook any front-end agent can follow to extend the DEFONEOS / MEOK / SOV3 surfaces without re-deriving the patterns.

---

## 0. TL;DR — The 6 Patterns At A Glance

1. **HTML structural pattern** — `<nav>` (sticky backdrop-blur) → `<header.hero>` (h1 + subtitle + 2 CTAs) → `.trust-bar` → `<section>` blocks (persona-grid, tier-grid, form-card) → `<footer>`.
2. **CSS conventions** — `--gold:#c9a84c` (DEFONEOS) or `--bg:#0a0e1a;--accent:#d4af37` (SOV33) or `#F2ECE2 / #C8A05C` (MEOK landing) color tokens; sticky translucent nav; auto-fit CSS grid for cards; pill badges; gradient h1 text.
3. **JS pattern** — `fetch('/api/...', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...}) })` with progressive enh. forms; honeypot field; `event.preventDefault()` + `alert()` validation; `localStorage` for persona persistence.
4. **SIGIL receipt format** — `crypto.randomBytes(16).toString('hex')` ⇒ `sig_<id>` (32 chars); payload = canonical JSON of all inputs + timestamp + `tier_routed_to`; signed with `crypto.createHmac('sha512', SIGN_KEY).update(payload).digest('hex')`; persisted to `/tmp/*.jsonl`.
5. **Persona routing logic** — 7 personas (defence_prime / defence_sme / regulator / governance / academic / end_user / media) each with a default tier; routing table keyed by tier → Stripe URL or fallback (`/install`, `/sandbox`, `/press`, mailto).
6. **CTA cascade pattern** — Trust bar → Persona grid → Tier grid → Form (3-step) → SIGIL receipt → Persona-specific next-step panel → Stripe checkout (or install/sandbox/briefing) → Welcome email.

---

## 1. HTML STRUCTURAL PATTERNS

### 1.1 Canonical Page Skeleton (DEFONEOS landing-class)

Used across: `defoneos-signup-hub.html`, `meok-ai-landing/index.html`, `meok-ai-landing/pricing.html`, every `defoneos-*.html`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Product} — {One-liner}</title>
  <meta name="description" content="...">
  <meta property="og:title" content="...">
  <meta property="og:type" content="website">
  <link rel="canonical" href="https://csoai-static-deploy2.vercel.app/{slug}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>...</style>
</head>
<body>
  <nav>{ nav }</nav>            <!-- sticky, backdrop-blur, 62-68px -->
  <div class="container">        <!-- max-width:1100-1280px -->
    <header.hero>{ h1 + eyebrow + 2 CTAs }</header>
    <div class="trust-bar">{ social-proof grid }</div>
    <section>{ persona-grid OR tier-grid OR pricing OR cards }</section>
    <section>{ form-card }</section>
    <section>{ FAQ or compare-table }</section>
    <section>{ final CTA + owner-gated contact }</section>
  </div>
  <footer>{ brand + 3 link columns + © line }</footer>
  <script>{ form handlers + counters + progressive enhance }</script>
</body>
</html>
```

**Source**: `csoai-static-deploy2/defoneos-signup-hub.html:1-444`, `meok-ai-landing/index.html:1-338`.

### 1.2 Step-Based Form Pattern (signup hub)

> Three-step wizard (persona → tier → form) for defoneos, single-step page-progress-bar (3-dot indicator) for SOV33.

```html
<div class="progress-bar">
  <div class="progress-step active"><div class="dot">1</div>Name</div>
  <div class="progress-step"><div class="dot">2</div>Character</div>
  <div class="progress-step"><div class="dot">3</div>Done</div>
</div>
<div class="step active" id="step-1"><!-- ... --></div>
<div class="step hidden" id="step-2"><!-- ... --></div>
<div class="step hidden" id="step-3"><!-- ... --></div>
```

JS flow: `goStep(n)` validates input, persists to `localStorage`, toggles `.active`/`.hidden`, updates `.progress-fill` width.

**Source**: `csoai-static-deploy2/signup.html:97-148`.

### 1.3 SOV33 Heavy Doc Page (HERO-style audit surface)

For long-form single-document pages (SOV33_HERO, OWEM explainer, BFT-33 council), the structure flips:

```html
<header class="hero">                 <!-- gradient panel, big h1, pills, 2-3 CTA buttons -->
<h2>Section title</h2>
<div class="card gold">                <!-- bordered cards w/ left accent stripe -->
  <h3>...</h3><p>...</p>
</div>
<table>...</table>                    <!-- data tables w/ accent colour header -->
<pre><code>                          <!-- ASCII pipeline diagrams -->
User prompt
   │
   ▼
Care-floor check (0.95) — veto sub-floor BEFORE backend
   ▼
Cache check (SHA-256 of prompt+system) — instant if hit
   ▼
Per-OWEM preferred backend chain (auto-fallback on failure)
   ▼
Output care-floor check — veto sub-floor BEFORE return
   ▼
Cache + SIGIL → return
</code></pre>
```

**Source**: `csoai-static-deploy2/SOV33_HERO.html:1-330`.

### 1.4 Persona + Tier Grid (7 + 7 selectable cards)

> The signature layout for the sales funnel.

```html
<div class="persona-grid" id="personaGrid">
  <div class="persona" data-persona="defence_prime">
    <span class="emoji">🛡️</span>
    <div class="title">Defence Prime Contractor</div>
    <div class="blurb">BAE · Rolls-Royce · Leonardo · ...</div>
    <span class="price-tag">Crown tier · Custom RFQ</span>
  </div>
  <div class="persona" data-persona="defence_sme">...</div>
  ...
</div>
```

Click handlers auto-advance to tier grid. Each persona has a default tier from `DEFAULT_TIER_BY_PERSONA` map (see §5).

**Source**: `csoai-static-deploy2/defoneos-signup-hub.html:142-191`.

### 1.5 Footer Convention

3-column link grid + slim bottom row + brand repeat.

```html
<footer><div class="container">
  <div class="footer-top">
    <div>{ brand svg + tagline }</div>
    <div class="footer-links">
      <div class="footer-col"><h4>Platform</h4><a>...</a>...</div>
      <div class="footer-col"><h4>Developers</h4>...</div>
      <div class="footer-col"><h4>Ecosystem</h4>...</div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© 2026 ... Companies House 16939677</p>
    <div><a>primary domain</a><a>sister site</a><a>manifest</a></div>
  </div>
</div></footer>
```

**Source**: `meok-ai-landing/index.html:264-307`, `csoai-static-deploy2/defoneos-signup-hub.html:438-441`.

---

## 2. CSS CONVENTIONS

### 2.1 Color Tokens (3 Brand Palettes)

The empire uses **three separate palettes** depending on the audience. DO NOT mix tokens across products.

| Brand | Bg | Text | Accent 1 | Accent 2 | Warn | Source |
|-------|----|------|----------|----------|------|--------|
| **DEFONEOS** (defence sales) | `#0a0a0f` radial `→#0a1a3a` | `#f8fafc` | `--cyan:#22d3ee` | `--gold:#fbbf24` `--purple:#a78bfa` | `--red:#ef4444` | `defoneos-signup-hub.html:14` |
| **SOV33 / MEOK dark** (substrate) | `--bg:#0a0e1a;--bg2:#0d1220` | `--ink:#e6e6e6` | `--accent:#d4af37` | `--accent2:#00ff9d` | `--warn:#ff6b6b` | `SOV33_HERO.html:10`, `signup.html:8` |
| **MEOK landing** (commercial EU) | `#F2ECE2` paper | `#1A1714` | `--gold-bright:#e8c86a` (`#C8A05C`) | `#00d4aa` (cyan tick) | `#ef4444` (cliff) | `meok-ai-landing/index.html:19`, `pricing.html:19` |

Token convention: everything goes under `:root { --token:value; }` so it's reset-able per surface.

### 2.2 Spacing Scale

Universal: `0.25 / 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2 / 2.5 / 3 / 4 rem`. Container widths: 720 (forms), 760 (scorecards), 1000 (api-spec), 1100 (landing), 1280 (sales), 1400 (dashboards).

`gap` is **always** in `rem`, not `px`. Use `gap:.8rem` `gap:1.2rem` `gap:1.5rem`. Hover lift uses `transform: translateY(-2px to -4px)`.

### 2.3 Typography Stack

```css
font-family:'Inter', system-ui, -apple-system, sans-serif;  /* body */
font-family:'Space Grotesk', sans-serif;                     /* headings */
font-family:'SF Mono',Menlo,monospace;                       /* sigils, code */
font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","JetBrains Mono",ui-monospace,monospace;  /* SOV33 doc pages */
```

Heading sizes use `clamp()` for fluid scaling: `clamp(1.8rem, 4vw, 2.6rem)`, `clamp(2.8rem, 6vw, 4.8rem)`.

### 2.4 Button System (5 Universal Styles)

```css
/* Pill primary (DEFONEOS/MEOK) */
.btn-primary{padding:14px 32px;border-radius:999px;background:linear-gradient(135deg,var(--gold),var(--gold-dim));color:var(--ink);font-weight:700}
.btn-secondary{padding:14px 32px;border-radius:999px;background:transparent;border:1.5px solid rgba(255,255,255,0.15);font-weight:600}

/* Bordered "ghost" (DEFONEOS) */
.btn-ghost{background:transparent;color:var(--cyan);border:1px solid var(--cyan)}
.btn-gold{background:linear-gradient(135deg,var(--gold),#f59e0b);color:#000}

/* Square corner (SOV33) */
.cta{background:var(--accent);color:#0a0e1a;padding:.7rem 1.4rem;border-radius:8px;display:inline-block;font-weight:bold}

/* Mono big-btn (wizard step) */
button{width:100%;padding:1.2rem;background:var(--accent);color:#0a0e1a;border:none;border-radius:8px;font-size:1.2rem;font-weight:bold;cursor:pointer}
```

**Source**: `meok-ai-landing/index.html:62-65`, `defoneos-signup-hub.html:33-40`, `SOV33_HERO.html:44-45`, `signup.html:22-30`.

### 2.5 Card + Grid Pattern

```css
.feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
.feature-card{padding:32px;border-radius:20px;background:rgba(255,255,255,0.02);border:1px solid var(--border);transition:all .3s;position:relative;overflow:hidden}
.feature-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:0;transition:opacity .3s}
.feature-card:hover{border-color:rgba(201,168,76,0.25);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.3)}
.feature-card:hover::before{opacity:1}
```

**Source**: `meok-ai-landing/index.html:83-87`.

### 2.6 Sticky Translucent Nav

```css
nav{position:sticky;top:0;z-index:100;background:rgba(10,9,20,0.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:all .3s}
.nav-inner{max-width:1100px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:68px;gap:16px}
```

**Source**: `meok-ai-landing/index.html:39-40`; `meok-ai-landing/pricing.html:20-21`.

### 2.7 Gradient h1 Text

```css
.hero h1 .gradient{background:linear-gradient(135deg,var(--gold-bright),var(--gold),#d4a843);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
```

**Source**: `meok-ai-landing/index.html:59`.

### 2.8 Responsive Collapse (≤768px)

```css
@media(max-width:768px){
  .nav-links{display:none}
  .hero{padding:120px 0 60px}
  .hero-actions{flex-direction:column;align-items:center}
  .btn-primary,.btn-secondary{width:100%;max-width:320px;justify-content:center}
  .stats-bar{grid-template-columns:repeat(2,1fr)}
  .footer-top{flex-direction:column}
  .footer-links{width:100%}
}
```

**Source**: `meok-ai-landing/index.html:122-130`.

---

## 3. JAVASCRIPT PATTERNS

### 3.1 HMAC-SHA512 SIGIL Signing (Server)

The empire's signature pattern. HMAC-SHA512 of the canonical JSON payload of all inputs:

```javascript
const crypto = require('crypto');

const signingSecret = process.env.SIGN_KEY
  || process.env.VERCEL_ENV_SIGN_KEY
  || 'CSOAI-DEFONEOS-SOV-KEY-V1-FALLBACK-NOT-FOR-PRODUCTION';

const payload = JSON.stringify({
  email, name, org, persona, tier, useCase,   // form inputs
  timestamp, receiptId, stripeUrl,             // envelope
});
const sigil = crypto.createHmac('sha512', signingSecret).update(payload).digest('hex');
```

**Note**: Real receipt ID is `sig_` + 16 random bytes (hex). The HMAC is the integrity hash; the receipt ID is the lookup key.

**Source**: `csoai-static-deploy2/api/signup.js:99-104`. See also `api/crown-rfq.js:38-46` which uses HMAC-SHA256:

```javascript
function hmac(payload, key = HMAC_KEY) {
  return crypto.createHmac('sha256', key)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
}
function sha512(payload) {
  return crypto.createHash('sha512')
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
}
```

> **Convention drift warning**: `signup.js` uses HMAC-SHA512, `crown-rfq.js` and most other places use HMAC-SHA256. **Normalise to SHA-256** for any new endpoint to avoid the divergence.

### 3.2 Generic /api/fetch Handler Pattern

```javascript
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Send-Key');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  // ─── Honeypot (bots) — always 200, never store ───────────
  if (body.honeypot) return res.status(200).json({ ok: true });

  // ... validate + process + persist + return receipt ...
};
```

**Source**: `csoai-static-deploy2/api/signup.js:48-70`. Same template across `crown-rfq.js`, `newsletter.js`, `welcome.js`, `invite.js`, `eat-tick.js`.

### 3.3 Form Validation (Client-Side)

Two patterns coexist:

**A. Alert-and-block** (oldest, in SOV33 wizard & scorecard):

```javascript
function goStep(n) {
  if (n === 2) {
    const name = document.getElementById('name').value.trim();
    if (!name) { alert('Please type a name (anything works!)'); return; }
    localStorage.setItem('sov33_user_name', name);
  }
  // ...
  document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
  document.getElementById('step-' + n).classList.remove('hidden');
}
```

**B. Inline visible-state** (scorecard-style):

```javascript
document.querySelectorAll('.q input').forEach(inp => {
  inp.addEventListener('change', () => inp.closest('.q').classList.add('answered'));
});
// + form submit handlers:
function submitScorecard(ev) {
  ev.preventDefault();
  // ... compute score, populate result div, render tier CTA, fire and forget POST ...
  return false;
}
```

**Source**: `csoai-static-deploy2/signup.html:97-148`, `meok-ai-landing/scorecard.html:235-321`.

### 3.4 Tier Routing (Client-Side Scorecard → Stripe)

```javascript
let tier, tierText, ctaText, ctaHref;
if (pct >= 85) {
  tier = 'Continuous';
  tierText = "You're audit-ready in posture. Switch to continuous monitoring so it stays that way.";
  ctaText = 'Start Defence — £999/mo';
  ctaHref = 'https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836';
} else if (pct >= 60) {
  tier = 'Pro';
  ctaText = 'Start Pro — £149/mo';
  ctaHref = 'https://buy.stripe.com/eVq9AV4O87sudMF42k8k839';
} else if (pct >= 30) {
  tier = 'Starter + Audit';
  ctaText = 'Book 48h gap audit — £4,950';
  ctaHref = 'https://buy.stripe.com/4gM7sN2G0bIKeQJfL28k833';
} else {
  tier = 'Audit-first';
  ctaText = 'Book 48h gap audit — £4,950';
  ctaHref = 'https://buy.stripe.com/4gM7sN2G0bIKeQJfL28k833';
}
```

**Source**: `meok-ai-landing/scorecard.html:273-301`.

### 3.5 Front-End fetch / POST Receipt Handling

```javascript
const res = await fetch('/api/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const data = await res.json();

// Show success — populate the receipt
document.getElementById('sigilId').textContent = data.receipt ? data.receipt.full_sigil : data.error || 'see server logs';
document.getElementById('successPersona').textContent = data.receipt ? data.receipt.persona : 'unknown';
document.getElementById('nextSteps').textContent = data.receipt ? data.receipt.next_steps : 'We will reach out within 24h.';

// CTA cascade: pick the right button based on what /api returned
const stripeUrl = data.receipt ? data.receipt.tier_routed_to : '/contact';
const sl = document.getElementById('stripeLink');
if (stripeUrl.startsWith('mailto:') || stripeUrl.startsWith('/install') || stripeUrl.startsWith('/sandbox') || stripeUrl.startsWith('/press')) {
  sl.href = stripeUrl;
  sl.textContent = stripeUrl.startsWith('mailto:') ? 'Email a Director →' :
                    stripeUrl.includes('install') ? 'Open Install Guide →' :
                    stripeUrl.includes('sandbox') ? 'Activate Sandbox →' :
                    'Press Brief →';
  sl.className = 'btn btn-ghost';
} else if (stripeUrl.startsWith('http')) {
  sl.href = stripeUrl;
  sl.textContent = 'Continue to Stripe Checkout →';
} else {
  sl.href = '#';
  sl.textContent = 'Talk to a Director →';
}
```

**Source**: `csoai-static-deploy2/defoneos-signup-hub.html:525-554`.

### 3.6 fetch Failover With Truthful Error

The `askSov33` pattern shows how to handle API down — don't pretend success, point the user at the right fix:

```javascript
} catch (e) {
  resp.innerHTML = '<span style="color:var(--warn)">API error: ' + e.message + '</span><br>' +
    '<small>Start the API server: <code>python /Users/nicholas/clawd/bin/sov33_api_server.py</code></small>';
}
```

**Source**: `csoai-static-deploy2/SOV33_HERO.html:281-284`.

### 3.7 Progressive Enhancement: localStorage Persona

```javascript
localStorage.setItem('sov33_user_name', name);
localStorage.setItem('sov33_character', char);
localStorage.setItem('sov33_citizen_id', d.citizen_id); // from /api/signup response
```

**Source**: `csoai-static-deploy2/signup.html:106, 142`.

### 3.8 Persona-Prefilled Tier Auto-Select

```javascript
const DEFAULT_TIER_BY_PERSONA = {
  defence_prime: 'Crown RFQ',
  defence_sme:   'Enterprise (£9,999+/mo)',
  regulator:     'Free sandbox',
  governance:    'Pro (£499/mo)',
  academic:      'Open Source',
  end_user:      'Open Source',
  media:         'Free briefing',
};
// on persona click:
selectedTier = DEFAULT_TIER_BY_PERSONA[selectedPersona];
document.querySelectorAll('.tier').forEach(t => t.classList.toggle('selected', t.dataset.tier === defaultTier));
// advance to tier step
```

**Source**: `csoai-static-deploy2/defoneos-signup-hub.html:450-478`.

---

## 4. SIGIL RECEIPT FORMAT

### 4.1 Receipt Wire Schema

`/api/signup` returns:

```json
{
  "ok": true,
  "receipt": {
    "sigil": "sig_a3f1e9b2c8d74651",            // 32-char hex (16 random bytes, hex)
    "full_sigil": "a3f1e9b2c8d74651...",          // first 32 chars of HMAC, suffixed "…"
    "timestamp": "2026-07-13T00:34:21.918Z",      // ISO8601
    "persona": "Defence Prime (BAE/Rolls/...)",   // persona label, NOT slug
    "tier": "Crown RFQ",                           // tier as user supplied
    "tier_routed_to": "mailto:crown@csoai.org?...", // the CTA the user should hit
    "routing": "Director of AI Defence",
    "next_steps": "Crown RFQ flow initiated..."
  }
}
```

The **server-side persisted record** has the same shape plus: source IP, region, ua, full sigil hash, sigil_algo, sigil_signed_by.

**Source**: `csoai-static-deploy2/api/signup.js:108-145, 233-245`.

### 4.2 SIGIL Field Schema (Server Side)

```javascript
{
  receipt: receiptId,                  // "sig_<16 hex>"
  timestamp,
  email,
  name,
  org,
  persona, persona_label: personaMeta.label,
  tier, tier_routed_to: stripeUrl,
  use_case,
  gdpr_consent, marketing_opt_in,
  source: req.headers.referer,
  ip_country: req.headers['x-vercel-ip-country'],
  ip_region:  req.headers['x-vercel-ip-country-region'],
  ua: req.headers['user-agent'].slice(0,200),
  sigil,                              // full HMAC-SHA512 hex
  sigil_algo: 'HMAC-SHA512',
  sigil_signed_by: 'CSOAI-DEFONEOS-receipt-signer',
}
```

**Source**: `csoai-static-deploy2/api/signup.js:122-143`.

### 4.3 SHA-256 Chain Hash (Tick Logs)

For cron / loop / tick logs, the pattern is **SHA-512 of the canonical JSON record**, no HMAC key (it's a tamper-evident log not a signed receipt):

```javascript
const tick_record = {
  tick_id: 'eat_' + crypto.randomBytes(8).toString('hex'),
  task: taskName,
  started_at: new Date(t0).toISOString(),
  elapsed_ms: ms,
  result,
  sigil_chain_hash: 'will_be_hashed',
};
const payload = JSON.stringify(tick_record);
const sigil_hash = crypto.createHash('sha512').update(payload).digest('hex');
tick_record.sigil_chain_hash = sigil_hash;

await fs.appendFile('/tmp/eat.log', JSON.stringify(tick_record) + '\n');
```

**Source**: `csoai-static-deploy2/api/eat-tick.js:81-96`.

### 4.4 SIGIL OP-Code Format (EAT cycles)

```json
{
  "op": "C",
  "fields": {
    "actor": "jeeves",
    "subject": "defoneos-eat-cycle",
    "tick": 84,
    "scope": "DEFONEOS",
    "result": "PASS",
    "metrics": { ... },
    "care_score": 0.91,
    "next_actions": [ ... ]
  }
}
```

> Op codes seen in the wild: `P`, `V`, `M`, `Q`, `C`, `H`, `S`, `A` (matches `mcp__sov3_federation` `sigil_emit` op enum).

**Source**: `csoai-static-deploy2/tick-84-eat-sigil.json`. Also referenced in `mcp__sov3_federation_sigil_emit` tool schema.

### 4.5 Tick Wrap (Daily-Golden Format)

`/api/daily-golden` hits every page + every endpoint on a 4-hour cron, returns structured per-call results:

```javascript
{ path, method, status, latency_ms, body_len, body_head, ok }
```

`ok = status >= 200 && < 400`.

**Source**: `csoai-static-deploy2/api/daily-golden.js:32-40`.

### 4.6 Verification Surface

The DEFONEOS site exposes `/api/sigil-status` (live SOC), `/defoneos-verify` (public lookup), `/api/welcome` (resend welcome email using receipt), `/api/invite` (referral chain). All rely on `/tmp/<x>.jsonl` files which are owner-cron synced to canonical stores (Google Sheets, etc.).

---

## 5. PERSONA ROUTING LOGIC

### 5.1 The 7 Personas (Single Source Of Truth)

Declared in `api/signup.js`:
```javascript
const PERSONAS = {
  defence_prime:  { label: 'Defence Prime (BAE/Rolls/Leonardo/Thales/Raytheon/LM/L3Harris)', tier: 'Crown RFQ',                 next: 'Director of AI Defence' },
  defence_sme:    { label: 'Defence SME / Vendor',                                             tier: 'Enterprise (£9,999+/mo)',  next: 'Head of Product' },
  regulator:      { label: 'Regulator (ICO/NCSC/AI Office/NCAS/DG-CONNECT)',                  tier: 'Free sandbox',             next: 'Sandbox + audit pack' },
  governance:     { label: 'Governance / CISO / Risk / Compliance',                          tier: 'Pro (£499/mo)',            next: 'Audit-prep kit' },
  academic:       { label: 'Academic / Researcher',                                           tier: 'Open Source',              next: 'Sovereign dev kit' },
  end_user:       { label: 'End-user / Engineer / Builder',                                   tier: 'Open Source',              next: 'Sovereign OS install' },
  media:          { label: 'Media / Press',                                                    tier: 'Free briefing',            next: '40-min press brief' },
};
```

Mirrored EXACTLY in `/api/welcome.js` (`NEXT_STEPS` map adds a per-persona `subject` + `cta` + next prose), `defoneos-signup-hub.html` (`DEFAULT_TIER_BY_PERSONA`), and every other persona-aware page.

**Source**: `csoai-static-deploy2/api/signup.js:25-33`.

### 5.2 Tier → URL Map

```javascript
const TIER_URLS = {
  'Open Source':             '/install',
  'Free sandbox':            '/sandbox',
  'Free briefing':           '/press',
  'Crown RFQ':               'mailto:crown@csoai.org?subject=Crown%20RFQ%20defence&body=Hi%20Nick%2C%20defence%20prime%20interested%20in%20Crown%20tier.',
  'Pro (£499/mo)':           'https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836',
  'Governance (£2,499/mo)':  'https://buy.stripe.com/28EcN7fsM002fUN1Uc8k835',
  'Enterprise (£9,999+/mo)': 'https://buy.stripe.com/28EcN7fsM002fUN1Uc8k835?utm_source=defoneos&tier=enterprise',
  'Sovereign (£4,950/mo)':   'https://buy.stripe.com/8x2eVf1BW9ACaAt1Uc8k842',
  'LAUNCH50 (£499)':         'https://buy.stripe.com/4gMcN7a8s6oq0ZTaqI8k91Z',
};
```

**Source**: `csoai-static-deploy2/api/signup.js:44-56` (declared in the JSDoc comment block).

### 5.3 Routing Decision Tree

```
persona  +  tier  →  URL?
Crown RFQ                → mailto:crown@csoai.org  (DM A/S 24h SLA)
Free sandbox / briefing  → /sandbox  or  /press  (on-site panel)
Open Source              → /install  (on-site PyPI + GitHub + sovereign dev kit)
Pro / Governance / Ent   → buy.stripe.com  (Stripe Checkout)
Sovereign / Crown        → mailto  (white-glove, not self-serve)
```

### 5.4 Crown Tier Special Path

For Crown, route to `/api/crown-rfq` instead of `/api/signup`. Validation stricter:

```javascript
const VALID_CLEARANCE = ['Official', 'Sensitive', 'Secret', 'TS', 'TOP SECRET'];
const VALID_PROCUREMENT = ['Direct Award', 'Crown Agreement', 'G-Cloud', 'DOS', 'DASA', 'Other', 'Framework RM', 'CCS'];

// PII redaction for log (full payload only in response)
function redactEmail(email) {
  const [user, domain] = email.split('@');
  const u = user.length <= 2 ? user[0] + '*' : user.slice(0, 2) + '***';
  const d = domain.length <= 4 ? domain : domain.slice(0, 3) + '***.' + domain.split('.').pop();
  return u + '@' + d;
}
```

**Source**: `csoai-static-deploy2/api/crown-rfq.js:50-74`.

---

## 6. CTA CASCADE PATTERN

### 6.1 The 7-Stage Cascade

```
┌─────────────────────────────────────────────────────────────────────────┐
│ (1) TRUST BAR                                                           │
│   240+ MCPs · 78.8% consciousness · 5,108 episodes · 53 agents · £49/mo │
│   OR: 225 Pages Shipped · 30/30 MCPs Live · 15/15 Repos · £285k vs £12.5M│
├─────────────────────────────────────────────────────────────────────────┤
│ (2) PERSONA GRID — 7 cards, click to expand                            │
│   🛡️ Defence Prime → Crown RFQ     ⚖️ Regulator → Free sandbox          │
│   🛠️ Defence SME → Enterprise      📊 CISO/Governance → Pro             │
│   🔬 Academic → Open Source        ⚡ End-User → Open Source            │
│   📰 Media/Press → Free briefing                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ (3) TIER GRID — 5+ tiers, default pre-selected by persona               │
│   Open Source (£0) · Pro (£499) · Governance (£2,499) · Enterprise (£9,999)│
│   Crown RFQ (custom) · Sovereign (£4,950) · Free sandbox · Free brief   │
├─────────────────────────────────────────────────────────────────────────┤
│ (4) FORM — 5 fields + GDPR consent + marketing opt-in + honeypot       │
│   POST /api/signup → SIGIL HMAC receipt                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ (5) RECEIPT PANEL — shows full_sigil + persona + tier + next steps     │
├─────────────────────────────────────────────────────────────────────────┤
│ (6) ROUTED CTA — auto-resolved from tier_routed_to URL                 │
│   Stripe Checkout  /  Install  /  Sandbox  /  Press  /  mailto:Crown   │
├─────────────────────────────────────────────────────────────────────────┤
│ (7) SIDE-CHANNEL — Welcome email (Resend), Telegram notify Nick,        │
│   referral code generated, CRM row appended                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Stage-6 Resolver (Client-Side)

```javascript
const stripeUrl = data.receipt ? data.receipt.tier_routed_to : '/contact';
const sl = document.getElementById('stripeLink');
if (stripeUrl.startsWith('mailto:')) {
  sl.href = stripeUrl;                          // → email a Director
  sl.textContent = 'Email a Director →';
  sl.className = 'btn btn-ghost';
} else if (stripeUrl.startsWith('/install')) {
  sl.href = stripeUrl;                          // → install guide
  sl.textContent = 'Open Install Guide →';
  sl.className = 'btn btn-ghost';
} else if (stripeUrl.startsWith('/sandbox')) {
  sl.href = stripeUrl;                          // → activate sandbox
  sl.textContent = 'Activate Sandbox →';
  sl.className = 'btn btn-ghost';
} else if (stripeUrl.startsWith('/press')) {
  sl.href = stripeUrl;                          // → press brief
  sl.textContent = 'Press Brief →';
  sl.className = 'btn btn-ghost';
} else if (stripeUrl.startsWith('http')) {      // → Stripe Checkout
  sl.href = stripeUrl;
  sl.textContent = 'Continue to Stripe Checkout →';
} else {
  sl.href = '#';
  sl.textContent = 'Talk to a Director →';
}
```

**Source**: `csoai-static-deploy2/defoneos-signup-hub.html:539-551`.

### 6.3 Side-Channel Trigger Order (Server Side)

```javascript
// 1. Build record with SIGIL
// 2. fs.appendFile('/tmp/signups.jsonl', JSON.stringify(record)+'\n')   — canonical store
// 3. If marketing + email → fs.appendFile('/tmp/newsletter.jsonl', ...) — weekly digest list
// 4. fetch(SIGNUP_WEBHOOK_URL, ...)                                      — CRM fanout (fire-and-forget)
// 5. require('./_notify.js').notify(record, 'defoneos-signup')           — Telegram to Nick
// 6. Build referral_code = SHA256(sigil|email|persona|tier).digest(...).base64 — referral chain
//    fs.appendFile('/tmp/referrals.jsonl', ref_record)
// 7. Return res.status(200).json({ ok:true, receipt:{...} })
```

**Source**: `csoai-static-deploy2/api/signup.js:146-245`.

### 6.4 CTA Color-by-Intent

```css
.btn-primary  { background: linear-gradient(135deg, var(--cyan), var(--purple)); color: #000; }  /* main flow */
.btn-gold     { background: linear-gradient(135deg, var(--gold), #f59e0b); color: #000; }       /* Crown / upgrade */
.btn-green    { background: var(--green); color: #000; }                                       /* confirm / success */
.btn-ghost    { background: transparent; color: var(--cyan); border: 1px solid var(--cyan); }   /* secondary */
```

**Source**: `csoai-static-deploy2/defoneos-signup-hub.html:33-39`.

---

## 7. ADDITIONAL PATTERNS WORTH KNOWING

### 7.1 Progressive Enhancement: Anonymous Signup (Free API Key)

```html
<form onsubmit="return meokKey(event)" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
  <input type="email" id="meokEmail" required placeholder="you@company.com" style="flex:1;min-width:200px;padding:11px 13px;border-radius:8px;border:1px solid rgba(201,168,76,0.4);background:rgba(10,9,20,0.6);color:#fff;font-size:0.95rem">
  <button type="submit" class="nav-cta" style="font-size:0.9rem">Get free key</button>
</form>
<div id="meokOut" style="margin-top:10px;font-size:0.88rem;color:var(--text-dim);word-break:break-all"></div>
<script>
async function meokKey(e){
  e.preventDefault();
  var o=document.getElementById('meokOut');
  o.textContent='Issuing key…';
  try{
    var r=await fetch('https://www.proofof.ai/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('meokEmail').value})});
    var j=await r.json();
    o.innerHTML=j.ok?('✅ Your key: <code>'+j.api_key+'</code><br>Set <code>MEOK_API_KEY</code> in your MCP client env. Emailed nothing — copy it now.'):('⚠️ '+(j.error||'Something went wrong — try again.'));
  } catch(err){ o.textContent='⚠️ Network error — try again.'; }
  return false;
}
</script>
```

> Note the **honesty copy**: "Emailed nothing — copy it now." — matches the `HONESTY:` docstring convention that every endpoint carries.

**Source**: `meok-ai-landing/index.html:249-262`.

### 7.2 OWEM (Open World Emergence Model) Status Indicator

```html
<span class="live-indicator"></span>
```
```css
.live-indicator{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent2);margin-right:6px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
```

**Source**: `csoai-static-deploy2/SOV33_HERO.html:42-43`.

### 7.3 Cliff-Countdown Banner

```javascript
(function(){
  const target = new Date('2026-12-02T00:00:00Z').getTime();
  const days = Math.max(0, Math.ceil((target - Date.now()) / 86400000));
  const el = document.getElementById('days-to-cliff');
  if (el) el.textContent = days;
})();
```

```html
<div class="cliff">⏰ <strong id="days-to-cliff">…</strong> days until the 2 Dec 2026 Article 50 watermarking cliff (post-Omnibus accelerated)</div>
```

**Source**: `meok-ai-landing/scorecard.html:235-241, 101-103`.

### 7.4 Schema.org JSON-LD on Every Page

```html
<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "MEOK Starter",
    "description": "...",
    "offers": { "@type": "Offer", "price": "49", "priceCurrency": "GBP", "availability": "https://schema.org/InStock" }
  },
  ...
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{"@type":"Question","name":"...","acceptedAnswer":{"@type":"Answer","text":"..."}}]
  }
]
</script>
```

**Source**: `meok-ai-landing/pricing.html:61-141`.

### 7.5 5-Question Progressive Onboarding

For DEFONEOS, the user picks a persona and the system auto-fills the rest:

```
[Persona grid click] → DEFAULT_TIER_BY_PERSONA[persona] pre-selects → [Tier click]→ form
```

For SOV33, the user fills step-by-step name → character → confirm:

```
[step 1 name → step 2 character → step 3 confirm] → POST /api/signup at :8101 → citizen_id
```

> Both patterns persist to `localStorage`; both call /api/signup on success.

**Source**: `csoai-static-deploy2/defoneos-signup-hub.html:445-562`, `csoai-static-deploy2/signup.html:97-148`.

### 7.6 HONESTY Docstring Convention

Every Vercel endpoint opens with a HONESTY block. Example from `/api/welcome`:

```javascript
// /api/welcome — Send a SIGIL-receipted welcome email on every signup
// POST /api/welcome?receipt=<sigid>&email=<email>&persona=<p> — composes + sends
//
// HONESTY:
// - This endpoint requires a private SEND_KEY in env to prevent spam.
// - Without RESEND_API_KEY (etc.), it persists the message to /tmp/email.outbox.jsonl for owner-cron sync.
// - The welcome email includes the SIGIL hash, persona, tier, and a 1-click "next step" CTA.
```

> **All new endpoints must follow this convention**: what the endpoint does, the failure modes, what happens when env vars are missing.

**Source**: `csoai-static-deploy2/api/welcome.js:1-9` (and every other API file in `api/`).

### 7.7 SIGIL Receipt In Email Body

```javascript
text: [
  next.subject, '',
  `Hi ${record.name || 'there'},`,
  '',
  `Welcome to DEFONEOS. Your signup has been SIGIL-signed and routed.`,
  '',
  `Receipt details:`,
  `  • SIGIL: ${record.sigil}`,
  `  • Persona: ${persona}`,
  `  • Tier: ${record.tier || 'pending'}`,
  `  • Issuer: CSOAI LTD UK 16939677`,
  `  • Timestamp: ${record.timestamp}`,
  `  • Verify at: https://csoai-static-deploy2.vercel.app/defoneos-verify`,
  ...
].join('\n'),
```

**Source**: `csoai-static-deploy2/api/welcome.js:40-65`.

### 7.8 Vercel Serverless Constraints

- Persistence is `/tmp/*.jsonl` (ephemeral; owner-cron syncs).
- All endpoints set CORS headers: `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Methods: POST, GET, OPTIONS`.
- All secrets pulled from `process.env.<NAME>` with stable fallbacks so dev/CI works.
- All routes return JSON `{ok: true, receipt: {...}}` or `{error: "..."}` with a 4xx status; never silently drop.
- Sigil logs append lines to `/tmp/*.log` not `/tmp/*.jsonl` (e.g. `/tmp/eat.log`, `/tmp/defoneos-eat.log`).

**Source**: every `api/*.js` file under `csoai-static-deploy2/`.

---

## 8. HOUSE RULES (For New Pages / Endpoints)

1. **Choose palette** before writing CSS — DEFONEOS / SOV33 dark / MEOK light. Don't mix.
2. **Use `:root { --token }`** for every reusable value; no inline magic colours.
3. **Use `Inter` for body, `Space Grotesk` for headings**; load via `<link rel="preconnect">` + Google Fonts CDN.
4. **`.container { max-width:1100px; margin:0 auto; padding:0 24px }`** — every page.
5. **Nav is sticky + translucent** + `border-bottom:1px solid var(--border)`.
6. **All CTAs are pills (`border-radius:999px`) or squares (`border-radius:8px`)** — never a third style.
7. **Every form** must have a honeypot field (`<input type="text" name="honeypot" style="display:none">`).
8. **Every endpoint** must declare its env-var dependencies + HONESTY block at the top.
9. **HMAC-SHA256** (not 512) for new SIGIL receipts to align with `crown-rfq.js` + `eat-tick.js`.
10. **Every persona-aware page** uses `DEFAULT_TIER_BY_PERSONA` to pre-select tier.
11. **Cascade-resolve the CTA** in the client: `mailto:` → "Email a Director"; `/install` → "Open Install Guide"; `/sandbox` → "Activate Sandbox"; `/press` → "Press Brief"; `https://...` → "Continue to Stripe Checkout →".
12. **JSON-LD** on every landing/pricing page (Product + FAQPage minimum).
13. **cliff-countdown banner** on every EU AI Act / compliance page.
14. **Email copy includes the full SIGIL** + Issuer (CSOAI LTD UK 16939677) + Verify URL.
15. **BFT council sign-off log** should be appended as a SIGIL receipt (see `AGENTS.md` format: `28 approve / 5 amend / 0 reject (quorum 23/33)`).

---

## 9. SOURCE FILE INDEX

### Front-End Pages (`csoai-static-deploy2/`)
| File | Purpose |
|------|---------|
| `defoneos-signup-hub.html` | 3-step persona→tier→form + CTA cascade (586 lines) |
| `signup.html` | SOV33 wizard (3-step name→character→confirm) (169 lines) |
| `SOV33_HERO.html` | Long-form OWEM hero, SIGIL + BFT-33 + care-floor (330 lines) |
| `api-v1-spec.html` | API spec with sigil cert endpoints (208 lines) |

### Front-End Pages (`meok-ai-landing/`)
| File | Purpose |
|------|---------|
| `index.html` | Canonical landing page (338 lines, palette reference) |
| `pricing.html` | 5-tier pricing grid + schema.org JSON-LD (273 lines) |
| `scorecard.html` | 10-question EU AI Act scorecard → tier routing (325 lines) |
| `eu-ai-act.html`, `fine-calculator.html`, `cobol-bridge.html`, `prompt-injection-firewall.html`, `characters-preview.html` | Feature pages |

### Serverless Endpoints (`csoai-static-deploy2/api/`)
| File | Purpose |
|------|---------|
| `signup.js` | SIGIL receipt issuer, persona+tier router (246 lines) — **THE canonical pattern** |
| `crown-rfq.js` | Crown-tier RFQ with HMAC-SHA256, PII redaction (uses sha256, not sha512) |
| `welcome.js` | SIGIL-receipted welcome email via Resend |
| `newsletter.js` | Marketing opt-in mirror |
| `invite.js` | Referral chain |
| `eat-tick.js` | Cron-driven EAT tick with SIGIL chain hash |
| `sigil-status.js` | Live SOV3 indicator (live / not-reached, no faking) |
| `framing.js` | Press/distribution framing library |
| `daily-golden.js` | 4-hour E2E test pass |
| `_notify.js` | Telegram fanout helper |

### Tick Receipts
| File | Pattern |
|------|---------|
| `tick-84-eat-sigil.json` | EAT-mode op-code `C` format |
| `DEFONEOS_SPRINT_STATE.json` | Sprint counters (`pages_live`, `mcp_count`, `ticks_completed`, `care_score`) |

### Documentation
| File | Notes |
|------|-------|
| `CLAUDE.md` | Sovereign-temple CLI quickstart |
| `AGENTS.md` | Append-only release log (SIGIL digest format reference) |

---

## 10. SUMMARY

| Pattern | Where it lives | Snippet ID |
|---------|---------------|------------|
| HTML skeleton (5-block page) | `defoneos-signup-hub.html`, `meok-ai-landing/index.html` | §1.1 |
| CSS color tokens (3 palettes) | Per-product `<style>` blocks | §2.1 |
| Sticky translucent nav | All marketing pages | §2.6 |
| Gradient h1 + clamp typography | All hero sections | §2.3, §2.7 |
| HMAC sigil signing (server) | `api/signup.js:99-104` | §3.1 |
| Generic /api handler template | Every `api/*.js` | §3.2 |
| Persona + tier routing | `defoneos-signup-hub.html:445-478` | §3.8 |
| Tier → URL resolver | `defoneos-signup-hub.html:539-551` | §6.2 |
| 7-persona spec | `api/signup.js:25-33` | §5.1 |
| 7-tier URL map | `api/signup.js:44-56` | §5.2 |
| CTA cascade (7 stages) | End-to-end funnel | §6.1 |
| Receipt wire schema | `api/signup.js:233-245` | §4.1 |
| SIGIL chain-hash (cron) | `api/eat-tick.js:81-96` | §4.3 |
| SIGIL EAT op-code | `tick-84-eat-sigil.json` | §4.4 |
| Cliff countdown | `scorecard.html:235-241` | §7.3 |
| Schema.org JSON-LD | `pricing.html:61-141` | §7.4 |
| HONESTY docstring | Every endpoint header | §7.6 |

---

**This file is now the JEEVES front-end playbook.** Pass to any subagent with:

> "Use `/Users/nicholas/clawd/CLAUDE_PATTERNS_LEARNED.md` as the playbook for any DEFONEOS / MEOK / SOV3 page or endpoint. Cite the §X.Y section in every PR."

— 🐉🔥 End of playbook.
