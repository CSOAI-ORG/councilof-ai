# Wire the Sovereign Kit into the LIVE CSOAI (Next.js `csoai-org-v2`) — for M2

The static `csoai.org` (this repo) now has the kit (verified live on a preview — orb + sidebar +
brain answering "what governs a bank"). The **live** csoai.org is your Next.js app (`csoai-org-v2`).
Here's the 2-minute add — no rebuild of sidebars/dock/Sovereign.

## Add to `app/layout.tsx` (inside `<body>`, end)
```tsx
import Script from 'next/script';
// ...
<Script id="sovereign-config" strategy="beforeInteractive">{`
  window.SOVEREIGN_CONFIG = {
    brand: 'CSOAI', accent: '#c9a84c', face: '🐉',
    sections: [
      { label:'Home',  href:'/' },
      { label:'Graph', href:'/graph',   icon:'🕸️' },
      { label:'World', href:'/world-3d', icon:'🌍' },
      { label:'Plans', href:'/plans',   icon:'💎' },
      { label:'Verify',href:'/verify',  icon:'✓' }
    ],
    // let the Sovereign drive YOUR app (extend freely):
    commands: {
      open_graph: () => location.href = '/graph',
      focus_country: (a) => window.__csoaiMap?.flyTo?.(a.country)
    }
  };
`}</Script>
<Script src="https://os.meok.ai/sovereign-embed.js" strategy="afterInteractive" />
```

## Make it your AI-OS (optional, recommended)
Feed your map/page state so the Sovereign answers in sync + explains nodes in chat:
```ts
// wherever your map lives
window.getScreenContext = () => ({
  surface: 'csoai-web', url: location.pathname, title: document.title,
  selected_node: window.__csoaiMap?.selected,  // the pin the user clicked
  active_layers: window.__csoaiMap?.layers
});
// on pin click → the Sovereign explains it in the dock:
map.on('pinClick', n => window.sovereign.ask('Tell me about ' + n.name));
```

## What you get (verified live)
🐉 dock + chat · ☰ sidebar from `sections` · `window.sovereign.{ask,govern,validate,sign,verify,nodes}`
· the Sovereign speaks **and takes real actions** (open_app/set_space/govern/sign/validate) · Care
Floor 0.95 server-side · Ed25519 SIGIL (verify offline, cross-origin proven).

## Shared backend (all CORS-open, os.meok.ai)
Brain: `/api/orchestrate` (`{say,actions}`) or `/api/v1/chat/completions` (OpenAI stream+tools, the
DEFONEOS drop-in). Tools: `/api/sign` `/api/verify` `/api/bridge` `/api/govern` `/api/nodes`. Health:
`/api/health`. Kit: `/sovereign-embed.js`. Full guide: `SOVEREIGN_KIT_FOR_CSOAI.md`.

## Note on the static `csoai.org` copy
This repo's static `csoai.org` is an older snapshot (title "Council for Safety of AI") — NOT what's
live (title "The Sovereign AI Council"). I did NOT alias it to the domain. It carries the kit as a
reference only. Wire the two `<Script>` tags above into the live Next.js app instead.

— M4
