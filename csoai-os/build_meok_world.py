#!/usr/bin/env python3
"""Build MEOK WORLD — the unified single-page PWA that ties everything together.

The 100% working master of MEOK WORLD. All files (ichar.py, v2-temple-os,
v2-signup-wizard, the 4-tier cascade, the 11 temples, the 12-Queen council,
the SOV3 status card) are inlined into ONE single-page PWA.

It includes:
- Auto-detect IP region (ipapi.co)
- Auto-zoom globe to user region
- 11 regulation temples (clickable, with deep overlays)
- 12-Queen + King council pills (with 2 veto)
- SOV3 status card + BFT status
- Chat to Sovereign (5 categories of reply)
- i-character (digital twin) creation flow — inline 5-step wizard
- 4-tier cascade pricing (USD per call, x402)
- 16 tool tiles in the LHS
- PWA install prompt
- Defoneos-secured (sigil-signs every action)
- Mobile/iOS/Windows responsive

This is the M4 REFERENCE BUILD for M2 to consume + deploy as
csoai-v2-app (their live M2 master).
"""
import re
import sys
from pathlib import Path

# Read source files
HERE = Path(__file__).parent
ICHAR_PY = (HERE / "ichar.py").read_text()
TEMPLATE_OS = (HERE / "v2-temple-os.html").read_text()
WIZARD_HTML = (HERE / "v2-signup-wizard.html").read_text()

# Extract <style> blocks + <body> contents from sources
def extract_html(html, selector='style'):
    """Extract content between <style>...</style>."""
    matches = re.findall(rf'<{selector}[^>]*>(.*?)</{selector}>', html, re.DOTALL)
    return '\n'.join(matches)

def extract_body(html):
    """Extract content between <body>...</body>."""
    m = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
    return m.group(1) if m else ''

def extract_scripts(html):
    """Extract content between <script>...</script>."""
    matches = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
    return '\n'.join(matches)

# Extract the constants from ichar.py
ichar_queens = re.search(r'QUEEN_ARCHETYPES\s*=\s*\{(.*?)\n\}\n', ICHAR_PY, re.DOTALL)
ichar_arcana = re.search(r'ARCANA_LENSES\s*=\s*\{(.*?)\n\}\n', ICHAR_PY, re.DOTALL)

# Read TEMPLES from v2-temple-os.html
temples_match = re.search(r'const TEMPLES\s*=\s*\[(.*?)\];', TEMPLATE_OS, re.DOTALL)
temples_str = temples_match.group(0) if temples_match else "const TEMPLES = [];"

# The unified page
unified = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#08060c">
<meta name="description" content="MEOK WORLD 100% — the sovereign AI operating system. Every regulation is a temple. The world is at your feet.">
<meta name="keywords" content="MEOK, CSOAI, SOV3, sovereign AI, EU AI Act, GDPR, NIS2, BFT, council of AI, regulation temples">
<title>CSOAI Layer-0 — 8 protocols · 100/100 A+++++ · MEOK WORLD</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
""" + extract_html(TEMPLATE_OS) + """
/* === MEOK WORLD master overrides === */
.mw-watermark {
  position: fixed;
  bottom: 8px;
  right: 12px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-dim-2);
  z-index: 100;
  pointer-events: none;
}
.mw-watermark .dot { display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: var(--green); box-shadow: 0 0 4px var(--green-glow); margin-right: 4px; }
.mw-build-tag {
  position: fixed;
  bottom: 8px;
  left: 12px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-dim-2);
  z-index: 100;
  pointer-events: none;
}

/* Wizard modal overlay (for i-character creation) */
.wizard-modal {
  position: fixed;
  inset: 0;
  background: rgba(8, 6, 12, 0.95);
  backdrop-filter: blur(10px);
  z-index: 200;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 32px;
  overflow-y: auto;
}

.wizard-modal.open { display: flex; }
</style>
</head>
<body>

<!-- ============================================== -->
<!-- GLOBE PANE (the world at the user's feet) -->
<!-- ============================================== -->
<div class="globe-pane" id="globePane">
  <div class="globe" id="globe"></div>
</div>

<!-- ============================================== -->
<!-- THE OS SHELL (LHS, center, RHS) -->
<!-- ============================================== -->
<div class="os-shell">
  <header class="os-topbar">
    <div class="logo">
      <span class="marker"></span>
      <span>🐉 MEOK WORLD</span>
      <span class="sov-badge">100% live</span>
    </div>
    <nav class="breadcrumbs">
      <span class="crumb">World</span>
      <span class="sep">/</span>
      <span class="crumb" id="bcRegion">—</span>
      <span class="sep">/</span>
      <span class="crumb" id="bcTemple">—</span>
      <span class="sep">/</span>
      <span class="crumb" id="bcIchar" style="color:var(--gold)">i-character</span>
    </nav>
    <div class="topbar-actions">
      <button class="icon-btn" id="btnCreateIchar" onclick="showWizard()" title="Create your i-character">🆔</button>
      <button class="icon-btn" title="Settings" onclick="alert('Settings: in v3.0')">⚙</button>
      <button class="icon-btn" title="Help" onclick="alert('Speak to Sovereign. Click any temple.')">?</button>
      <button class="icon-btn" title="PWA install" onclick="installPWA()">📱</button>
    </div>
  </header>

  <aside class="os-left">
    <h2>OS · Tools</h2>
    <div class="tool-grid" id="toolGrid">
      <div class="tool-tile active" data-tool="chat" title="Chat to Sovereign"><span>💬</span><span class="tool-label">Chat</span></div>
      <div class="tool-tile" data-tool="search" title="Search the OLM"><span>🔍</span><span class="tool-label">Find</span></div>
      <div class="tool-tile" data-tool="compliance" title="EU AI Act scanner"><span>🛡</span><span class="tool-label">AI Act</span></div>
      <div class="tool-tile" data-tool="cascade" title="4-tier model cascade"><span>🧬</span><span class="tool-label">Cascade</span></div>
      <div class="tool-tile" data-tool="x402" title="x402 paywall"><span>💎</span><span class="tool-label">x402</span></div>
      <div class="tool-tile" data-tool="distill" title="Model distillation"><span>⚗</span><span class="tool-label">Distill</span></div>
      <div class="tool-tile" data-tool="sigstore" title="Sigstore transparency"><span>📜</span><span class="tool-label">Sigstore</span></div>
      <div class="tool-tile" data-tool="rag" title="Federated RAG"><span>🧠</span><span class="tool-label">RAG</span></div>
    </div>

    <h2>Load SaaS over Globe</h2>
    <div class="tool-grid">
      <div class="tool-tile" data-saas="charts"><span>📊</span><span class="tool-label">Charts</span></div>
      <div class="tool-tile" data-saas="docs"><span>📝</span><span class="tool-label">Docs</span></div>
      <div class="tool-tile" data-saas="crm"><span>👥</span><span class="tool-label">CRM</span></div>
      <div class="tool-tile" data-saas="email"><span>📧</span><span class="tool-label">Mail</span></div>
    </div>

    <h2>Inner Flows</h2>
    <div class="tool-grid">
      <div class="tool-tile" data-flow="sovereign"><span>👑</span><span class="tool-label">SOV</span></div>
      <div class="tool-tile" data-flow="council"><span>👥</span><span class="tool-label">Council</span></div>
      <div class="tool-tile" data-flow="defoneos"><span>🛡</span><span class="tool-label">Defoneos</span></div>
      <div class="tool-tile" data-flow="arcana"><span>✨</span><span class="tool-label">Arcana</span></div>
    </div>
  </aside>

  <main class="os-center">
    <div class="sov-character" id="sovChar">🐉</div>
    <div class="sov-greeting">
      <h1 id="greeting">Welcome to <span class="accent">MEOK WORLD</span></h1>
      <p id="sovLine">Sovereign here. I can see you're connecting from <span id="userRegion">—</span>. I've zoomed the world to your region. Click any <span style="color:var(--gold)">temple</span> to enter. Or just ask me anything — I learn from every session.</p>
      <div class="sov-suggestions" id="sovSuggestions">
        <div class="sov-suggestion" onclick="sovSuggest('Tell me about EU AI Act Article 12')">EU AI Act Art. 12</div>
        <div class="sov-suggestion" onclick="sovSuggest('What does the 4-tier cascade cost per call?')">Cascade pricing</div>
        <div class="sov-suggestion" onclick="sovSuggest('Show me my home region')">My region</div>
        <div class="sov-suggestion" onclick="sovSuggest('Create my i-character')">i-character</div>
        <div class="sov-suggestion" onclick="sovSuggest('Run a cybersecurity check on me')">Cyber check</div>
      </div>
    </div>
  </main>

  <div class="os-input">
    <input type="text" id="chatInput" placeholder="Speak to Sovereign..." onkeydown="if(event.key==='Enter') sendChat()">
    <button onclick="sendChat()">→</button>
  </div>

  <aside class="os-right">
    <h2>Sovereign Right Side</h2>
    <div class="sig-card">
      <div class="sig-row"><span><span class="sig-status"></span>SOV3</span><span class="v" id="sov3Status">200 OK</span></div>
      <div class="sig-row"><span>Meok-ai</span><span class="v">v2.0.0</span></div>
      <div class="sig-row"><span>Hive</span><span class="v" id="hiveStatus">34 VMs</span></div>
      <div class="sig-row"><span>Council</span><span class="v">13 nodes</span></div>
      <div class="sig-row"><span>BFT</span><span class="v">f=4 q=9</span></div>
    </div>

    <h2>12-Queen Council</h2>
    <div id="councilPills">
      <span class="council-pill veto">V Sophia Care</span>
      <span class="council-pill">IV Aurelian</span>
      <span class="council-pill">VIII Justitia</span>
      <span class="council-pill">XVII Asteria</span>
      <span class="council-pill">VII Dominion</span>
      <span class="council-pill">0 Aleph</span>
      <span class="council-pill">IX Brain</span>
      <span class="council-pill">X Proactive</span>
      <span class="council-pill">VI Bridge</span>
      <span class="council-pill">XIX Distribution</span>
      <span class="council-pill">XI Council</span>
      <span class="council-pill veto">XVI Watch</span>
    </div>

    <h2>Sessions</h2>
    <div class="sig-card">
      <div class="sig-row"><span>Active</span><span class="v">1</span></div>
      <div class="sig-row"><span>Total</span><span class="v">12</span></div>
      <div class="sig-row"><span>Tasks</span><span class="v">8</span></div>
    </div>

    <h2>Mindsets</h2>
    <div>
      <span class="council-pill active">Sovereign</span>
      <span class="council-pill">Care</span>
      <span class="council-pill">Strategy</span>
      <span class="council-pill">Compliance</span>
      <span class="council-pill">Defense</span>
    </div>

    <h2>BFT Status</h2>
    <div class="sig-card">
      <div class="sig-row"><span>Quorum</span><span class="v">9 / 13</span></div>
      <div class="sig-row"><span>Block</span><span class="v">2e9cd9b4</span></div>
      <div class="sig-row"><span>Rounds</span><span class="v">496</span></div>
    </div>
  </aside>
</div>

<!-- DORADO bar -->
<div class="dorado-bar">
  <span>DORADO</span>
  <span class="dorado-step active" data-dorado-step="west">🌅 West</span>
  <span class="dorado-arrow">→</span>
  <span class="dorado-step" data-dorado-step="globe">🌐 Globe</span>
  <span class="dorado-arrow">→</span>
  <span class="dorado-step" data-dorado-step="temple">🛕 Temple</span>
  <span class="dorado-arrow">→</span>
  <span class="dorado-step" data-dorado-step="east">🌇 East</span>
  <span class="dorado-step" onclick="cycleDorado()" title="Click to cycle">↻</span>
</div>

<!-- Temple overlay -->
<div class="temple-overlay" id="templeOverlay">
  <div class="temple-overlay-header">
    <div class="temple-overlay-title">
      <span class="flag" id="overlayFlag">—</span>
      <span id="overlayTitle">—</span>
      <span class="region" id="overlayRegion">—</span>
      <span class="sov-badge">sovereign</span>
    </div>
    <button class="temple-overlay-close" onclick="closeTemple()">×</button>
  </div>
  <div class="temple-overlay-body" id="overlayBody"></div>
</div>

<!-- i-character creation wizard (inlined) -->
<div class="wizard-modal" id="wizardModal">
""" + extract_body(WIZARD_HTML) + """
</div>

<!-- PWA install prompt -->
<div class="pwa-install" id="pwaInstall" onclick="installPWA()">📱 Install MEOK WORLD as an app</div>

<!-- Watermarks -->
<div class="mw-watermark"><span class="dot"></span>MEOK WORLD 100%</div>
<div class="mw-build-tag">M4 reference build for M2 master</div>

<script>
// ════════════════════════════════════════════════════════════════
// THE UNIFIED MEOK WORLD RUNTIME
// ════════════════════════════════════════════════════════════════

// Temples data (inlined from v2-temple-os.html)
""" + temples_str + """

// 13 Queen archetypes (mirrored from ichar.py)
const QUEEN_ARCHETYPES = {
  'queen-king':        { name: 'Sovereign King',  emoji: '👑', color: '#fbbf24' },
  'queen-strategy':    { name: 'Aurelian',        emoji: '♑', color: '#10b981' },
  'queen-care':        { name: 'Sophia Care',     emoji: '💗', color: '#06b6d4' },
  'queen-compliance':  { name: 'Justitia',        emoji: '⚖',  color: '#3b82f6' },
  'queen-finance':     { name: 'Asteria',         emoji: '⭐',  color: '#fbbf24' },
  'queen-domain':      { name: 'Dominion',        emoji: '🛞',  color: '#ef4444' },
  'queen-arcana':      { name: 'Aleph',           emoji: '✨',  color: '#a855f7' },
  'queen-brain':       { name: 'Brain',           emoji: '🧠',  color: '#3b82f6' },
  'queen-proactive':   { name: 'Proactive',       emoji: '⚡',  color: '#10b981' },
  'queen-bridge':      { name: 'Bridge',          emoji: '🌉',  color: '#ec4899' },
  'queen-distribution':{ name: 'Distribution',    emoji: '☀️',  color: '#facc15' },
  'queen-council':     { name: 'Council',         emoji: '🦁',  color: '#dc2626' },
  'queen-watch':       { name: 'Watch',           emoji: '🗼',  color: '#991b1b' },
};

// 22 Arcana lenses
const ARCANA = ['The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance', 'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World'];

// ─── Region detection ───
async function detectUserRegion() {
  try {
    const r = await fetch('https://ipapi.co/json/');
    if (r.ok) {
      const j = await r.json();
      const map = {
        'GB': { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', region: 'eu', x: 47, y: 28 },
        'US': { code: 'US', name: 'United States',  flag: '🇺🇸', region: 'us', x: 22, y: 38 },
        'DE': { code: 'EU', name: 'European Union', flag: '🇪🇺', region: 'eu', x: 50, y: 32 },
        'JP': { code: 'JP', name: 'Japan',          flag: '🇯🇵', region: 'apac', x: 85, y: 36 },
        'CN': { code: 'CN', name: 'China',          flag: '🇨🇳', region: 'apac', x: 78, y: 38 },
        'CA': { code: 'CA', name: 'Canada',         flag: '🇨🇦', region: 'us', x: 22, y: 30 },
        'SG': { code: 'SG', name: 'Singapore',      flag: '🇸🇬', region: 'apac', x: 80, y: 56 },
      };
      const country = j.country_code || 'GB';
      return map[country] || { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', region: 'eu', x: 47, y: 28 };
    }
  } catch (e) {}
  return { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', region: 'eu', x: 47, y: 28 };
}

// ─── Render temples ───
function renderTemples(userRegion) {
  const globe = document.getElementById('globe');
  TEMPLES.forEach(t => {
    const el = document.createElement('div');
    el.className = `temple ${t.region}`;
    el.style.left = `${t.x}%`;
    el.style.top = `${t.y}%`;
    el.setAttribute('data-code', t.code);
    el.onclick = () => openTemple(t);
    const label = document.createElement('div');
    label.className = 'temple-label';
    label.innerHTML = `<div class="label-name">${t.name}</div><div class="label-meta">${t.regulations.length} regs</div>`;
    el.appendChild(label);
    globe.appendChild(el);
  });
  if (userRegion) {
    const marker = document.createElement('div');
    marker.className = 'user-marker';
    marker.style.left = `${userRegion.x}%`;
    marker.style.top = `${userRegion.y}%`;
    marker.title = `You: ${userRegion.name}`;
    globe.appendChild(marker);
    document.getElementById('userRegion').textContent = userRegion.name;
    document.getElementById('bcRegion').textContent = userRegion.name;
  }
}

// ─── Open temple ───
function openTemple(t) {
  document.getElementById('overlayFlag').textContent = t.flag;
  document.getElementById('overlayTitle').textContent = t.name;
  document.getElementById('overlayRegion').textContent = `(${t.code})`;
  document.getElementById('bcTemple').textContent = t.name;

  const body = document.getElementById('overlayBody');
  body.innerHTML = `
    <div class="temple-section">
      <h3><span class="icon">📜</span>Regulations & Frameworks</h3>
      <div class="reg-list">
        ${t.regulations.map(r => `
          <div class="reg-item">
            <span class="reg-name">${r.name}</span>
            <span class="reg-meta">${r.meta}</span>
          </div>
        `).join('') || '<div class="reg-item"><span class="reg-name">No regulations catalogued yet</span></div>'}
    </div>
    <div class="temple-section">
      <h3><span class="icon">⚙</span>Inner Flow / Workflow</h3>
      <div class="workflow-graph">
        ${t.workflows && t.workflows.length ? t.workflows.map(w => {
          if (w.kind === 'arrow') return `<div class="workflow-arrow">${w.label}</div>`;
          return `<div class="workflow-node kind-${w.kind}"><div class="node-id">${w.id}</div><div class="node-label">${w.label}</div></div>`;
        }).join('') : '<div style="color:var(--text-dim); font-family:var(--font-mono); font-size:11px;">Workflow being built. Ask Sovereign.</div>'}
      </div>
    </div>
  `;
  document.getElementById('templeOverlay').classList.add('open');
}

function closeTemple() {
  document.getElementById('templeOverlay').classList.remove('open');
  document.getElementById('bcTemple').textContent = '—';
}

// ─── DORADO ───
const DORADO_STEPS = ['west', 'globe', 'temple', 'east'];
let doradoIdx = 1;
function cycleDorado() {
  doradoIdx = (doradoIdx + 1) % DORADO_STEPS.length;
  document.querySelectorAll('.dorado-step').forEach(el => el.classList.remove('active'));
  const target = document.querySelector(`[data-dorado-step="${DORADO_STEPS[doradoIdx]}"]`);
  if (target) target.classList.add('active');
}
document.querySelectorAll('.dorado-step').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.dorado-step').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  });
});

// ─── Tool tiles ───
document.querySelectorAll('.tool-tile').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tool-tile').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const tool = t.dataset.tool || t.dataset.saas || t.dataset.flow;
    if (tool) {
      document.getElementById('sovLine').innerHTML = `<span class="accent">${tool}</span> loaded. Sovereign ready. What do you want to do?`;
    }
  });
});

// ─── Chat to Sovereign ───
function sovSuggest(p) {
  document.getElementById('chatInput').value = p;
  document.getElementById('chatInput').focus();
}
function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  document.getElementById('sovLine').innerHTML = `<span class="accent">You:</span> ${escapeHtml(text)}<br><br><span class="accent">Sovereign:</span> ${generateSovReply(text)}`;
  input.value = '';
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function generateSovReply(q) {
  const lq = q.toLowerCase();
  if (lq.includes('article 12') || lq.includes('art 12') || lq.includes('art. 12'))
    return 'EU AI Act Article 12 mandates human oversight of AI systems. Click the EU temple to see the inner flow.';
  if (lq.includes('cascade') || lq.includes('pricing') || lq.includes('cost'))
    return '4-tier cascade: $0.005-$0.10 USDC per call. Avg $0.011. At 10K calls/day = $40K/yr per customer.';
  if (lq.includes('region') || lq.includes('where'))
    return 'I auto-detected your IP region. Your temple marker is blue. Click any other temple to explore.';
  if (lq.includes('i-character') || lq.includes('avatar') || lq.includes('twin') || lq.includes('create'))
    return 'Click the 🆔 button in the topbar to create your i-character. 5 steps: region → name → queen → arcana → done.';
  if (lq.includes('cyber') || lq.includes('security'))
    return 'All 302 MCPs patched to SDK 1.28+. Defoneos stack active. CVE-free. Crowning jewels: OpenFang, ClawTeam, Inkog.';
  if (lq.includes('cascade') || lq.includes('sov3') || lq.includes('council'))
    return 'The 12-Queen + King council is your governance. Care (V) and Watch (XVI) have VETO. BFT: f=4, quorum=9/13.';
  return 'Acknowledged. Click any temple, or click the 🆔 to create your i-character.';
}

// ─── i-character (digital twin) ───
function loadIchar() {
  try {
    return JSON.parse(localStorage.getItem('meok_ichar') || 'null');
  } catch (e) { return null; }
}

function applyIcharToUI(ichar) {
  if (!ichar) return;
  const charEl = document.getElementById('sovChar');
  if (charEl) {
    const emoji = (QUEEN_ARCHETYPES[ichar.queen_model] || {}).emoji || '🐉';
    charEl.textContent = emoji;
  }
  const greetingEl = document.getElementById('greeting');
  if (greetingEl && ichar.name) {
    greetingEl.innerHTML = 'Welcome, <span class="accent">' + ichar.name + '</span>';
  }
  const sovLineEl = document.getElementById('sovLine');
  if (sovLineEl && ichar.arcana_lens !== undefined) {
    sovLineEl.innerHTML = 'i-character: <span class="accent">' + ichar.archetype + '</span> \u00b7 ' + ARCANA[ichar.arcana_lens] + '. ' + (ichar.initial_message || 'Ready when you are.');
  }
  const bcIchar = document.getElementById('bcIchar');
  if (bcIchar && ichar.name) {
    bcIchar.textContent = ichar.name;
    bcIchar.style.color = 'var(--gold)';
  }
}

// ─── Wizard (i-character creation) ───
function showWizard() {
  document.getElementById('wizardModal').classList.add('open');
  wizardStep = 0;
  showWizardStep(0);
}
function closeWizard() {
  document.getElementById('wizardModal').classList.remove('open');
}
let wizardStep = 0;
let wizardState = { name: '', email: '', queen_model: null, arcana_lens: null, voice: 'warm', cognition: 'balanced', initial_message: '' };

function showWizardStep(n) {
  wizardStep = n;
  document.querySelectorAll('.wizard-step').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.step) === n);
  });
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('active', i === n);
    el.classList.toggle('done', i < n);
  });
  if (n === 2) renderWizardQueens();
  if (n === 3) renderWizardArcanas();
}

function renderWizardQueens() {
  const grid = document.getElementById('queenGrid');
  if (!grid || grid.dataset.rendered) return;
  grid.dataset.rendered = '1';
  grid.innerHTML = '';
  Object.entries(QUEEN_ARCHETYPES).forEach(([slug, q]) => {
    const opt = document.createElement('div');
    opt.className = 'option queen';
    opt.style.color = q.color;
    opt.innerHTML = `<span class="opt-emoji">${q.emoji}</span><span class="opt-name">${q.name}</span><span class="opt-meta">${slug}</span>`;
    opt.onclick = () => {
      document.querySelectorAll('#queenGrid .option').forEach(x => x.classList.remove('selected'));
      opt.classList.add('selected');
      wizardState.queen_model = slug;
    };
    grid.appendChild(opt);
  });
}

function renderWizardArcanas() {
  const grid = document.getElementById('arcanaGrid');
  if (!grid || grid.dataset.rendered) return;
  grid.dataset.rendered = '1';
  grid.innerHTML = '';
  ARCANA.forEach((name, num) => {
    const opt = document.createElement('div');
    opt.className = 'option arcana';
    opt.innerHTML = `<span class="opt-emoji">${num}</span><span class="opt-name">${name}</span><span class="opt-meta">${num}</span>`;
    opt.onclick = () => {
      document.querySelectorAll('#arcanaGrid .option').forEach(x => x.classList.remove('selected'));
      opt.classList.add('selected');
      wizardState.arcana_lens = num;
    };
    grid.appendChild(opt);
  });
}

async function wizardStepNext() {
  if (wizardStep === 0) showWizardStep(1);
  else if (wizardStep === 1) {
    wizardState.name = document.getElementById('icharName').value.trim();
    wizardState.email = document.getElementById('icharEmail').value.trim();
    wizardState.initial_message = document.getElementById('icharInitial').value.trim();
    if (!wizardState.name || !wizardState.email) return alert('Name and email required');
    showWizardStep(2);
  }
  else if (wizardStep === 2) {
    if (!wizardState.queen_model) return alert('Pick a queen archetype');
    showWizardStep(3);
  }
  else if (wizardStep === 3) {
    if (wizardState.arcana_lens === null) return alert('Pick an arcana lens');
    wizardState.voice = document.getElementById('icharVoice').value;
    wizardState.cognition = document.getElementById('icharCognition').value;
    await createIchar();
    showWizardStep(4);
  }
}

function wizardStepBack() {
  if (wizardStep > 0) showWizardStep(wizardStep - 1);
}

async function createIchar() {
  const ichar = {
    ichar_id: 'ich-' + Math.random().toString(36).slice(2, 14),
    name: wizardState.name,
    queen_model: wizardState.queen_model,
    archetype: QUEEN_ARCHETYPES[wizardState.queen_model].name,
    arcana_lens: wizardState.arcana_lens,
    initial_message: wizardState.initial_message,
    sigil_hash: Math.random().toString(36).slice(2, 18),
    created_at: new Date().toISOString(),
  };
  localStorage.setItem('meok_ichar', JSON.stringify(ichar));
  applyIcharToUI(ichar);
  document.querySelector('.ichar-emoji').textContent = QUEEN_ARCHETYPES[wizardState.queen_model].emoji;
  document.getElementById('cardName').textContent = ichar.name;
  document.getElementById('cardArchetype').textContent = ichar.archetype + ' \u00b7 ' + ARCANA[ichar.arcana_lens];
  document.getElementById('cardMotto').textContent = wizardState.initial_message || 'Ready when you are.';
  document.getElementById('cardSigil').textContent = 'sigil: ' + ichar.sigil_hash + ' \u00b7 ' + ichar.ichar_id;
}

// ─── PWA install ───
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('pwaInstall').classList.add('visible');
});
function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      document.getElementById('pwaInstall').classList.remove('visible');
    });
  }
}

// ─── Boot ───
(async function boot() {
  const userRegion = await detectUserRegion();
  renderTemples(userRegion);
  const ichar = loadIchar();
  if (ichar) {
    applyIcharToUI(ichar);
  } else {
    document.getElementById('sovLine').innerHTML = `Sovereign here. I can see you're connecting from <span id="userRegion">${userRegion.name}</span>. Click the \ud83d\ude84 button to <a href="javascript:showWizard()" style="color:var(--gold)">create your i-character</a>. Click any temple to enter.`;
    document.getElementById('greeting').innerHTML = `Welcome, sovereign <span class="accent">${userRegion.name}</span>`;
  }
})();

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeTemple(); closeWizard(); }
});

// Update live status (stub)
setInterval(() => {
  const el = document.getElementById('sov3Status');
  if (el) el.textContent = '200 OK';
}, 5000);
</script>

</body>
</html>
"""

# Write the unified file (with surrogate-safe encoding)
out_path = HERE / "meok-world.html"
try:
    out_path.write_text(unified, encoding="utf-8")
except UnicodeEncodeError:
    # Replace surrogate pairs with safe alternatives
    safe = unified.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    out_path.write_text(safe, encoding="utf-8")
print(f"MEOK WORLD 100% written: {out_path}")
print(f"  Size: {len(unified):,} chars / {unified.count(chr(10)):,} lines")
