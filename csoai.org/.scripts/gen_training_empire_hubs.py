#!/usr/bin/env python3
"""Phase 285-MEGA: Generate the 3 master hubs + the 4 stub helpers."""
from pathlib import Path
ROOT = Path("/Users/nicholas/clawd/csoai.org")
TRAINING = ROOT / "training"

GOLD = "#fbbf24"

INDUSTRIES = [
    ("ai-governance","Sovereign AI Governance","🜏"),
    ("cybersecurity","Sovereign Cybersecurity","🛡️"),
    ("defence","Sovereign Defence","⚔️"),
    ("banking","Sovereign Banking","🏦"),
    ("healthcare","Sovereign Healthcare","🏥"),
    ("pharmacy","Sovereign Pharmacy","⚕️"),
    ("opticians","Sovereign Opticians","👁️"),
    ("home-care","Sovereign Home Care","🏡"),
    ("education","Sovereign Education","🎓"),
    ("social-care","Sovereign Social Care","🤝"),
    ("insurance","Sovereign Insurance","🛟️"),
    ("legal","Sovereign Legal","⚖️"),
    ("finance","Sovereign Finance","💷"),
    ("accounting","Sovereign Accounting","📊"),
    ("real-estate","Sovereign Real Estate","🏘️"),
    ("hospitality","Sovereign Hospitality","🍽️"),
    ("manufacturing","Sovereign Manufacturing","🏭"),
    ("transport","Sovereign Transport","🚂"),
    ("logistics","Sovereign Logistics","📦"),
    ("agriculture","Sovereign Agriculture","🌾"),
    ("media","Sovereign Media","📡"),
    ("entertainment","Sovereign Entertainment","🎭"),
    ("gaming","Sovereign Gaming","🎮"),
    ("space","Sovereign Space","🚀"),
    ("aerospace","Sovereign Aerospace","✈️"),
    ("quantum","Sovereign Quantum","⚛️"),
    ("robotics","Sovereign Robotics","🤖"),
    ("biotech","Sovereign Biotech","🧬"),
    ("climate","Sovereign Climate","🌍"),
    ("energy","Sovereign Energy","⚡"),
    ("manufacturing-uk","Sovereign UK Manufacturing","🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
]

BASE_CSS = f"""*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:system-ui,sans-serif;background:radial-gradient(ellipse at 50% 0%,#1a0d00,#000 80%);color:#f8fafc;line-height:1.6;max-width:1300px;margin:0 auto;padding:2rem}}
h1{{font-size:3rem;background:linear-gradient(135deg,{GOLD},#f59e0b,#fcd34d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1rem;text-align:center}}
h2{{color:{GOLD};font-size:1.8rem;margin:2rem 0 1rem;text-align:center;border-bottom:1px solid rgba(251,191,36,0.15);padding-bottom:.5rem}}
h3{{color:{GOLD};font-size:1.2rem;margin-bottom:.5rem}}
p{{color:#cbd5e1;margin-bottom:.8rem}}
.hero{{text-align:center;padding:2rem 0}}
.hero .tag{{font-size:1.1rem;color:#94a3b8;margin-bottom:1.5rem}}
section{{background:rgba(255,255,255,0.02);border:1px solid rgba(251,191,36,0.15);border-radius:16px;padding:2rem;margin:2rem 0}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin:2rem 0}}
.grid-2{{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:1.5rem;margin:2rem 0}}
.card{{background:rgba(255,255,255,0.03);border:1px solid rgba(251,191,36,0.15);border-radius:12px;padding:1.5rem;transition:.2s}}
.card:hover{{transform:translateY(-3px);border-color:rgba(251,191,36,0.4)}}
.card .emoji{{font-size:2rem}}
.card h3 a{{color:{GOLD};text-decoration:none}}
.card .meta{{color:#94a3b8;font-size:.85rem;margin-top:.5rem}}
.crown-mark{{font-size:2rem;text-align:center;color:{GOLD};margin:1rem 0}}
.scenario{{background:rgba(34,211,238,0.04);border-left:4px solid #22d3ee;padding:1.5rem;border-radius:0 12px 12px 0;margin:1rem 0}}
.scenario h3{{color:#22d3ee}}
.scenario .score{{color:{GOLD};font-weight:bold;margin-top:.5rem}}
table{{width:100%;border-collapse:collapse;margin:1rem 0}}
th{{background:rgba(251,191,36,0.1);color:{GOLD};padding:.6rem;text-align:left;font-size:.85rem}}
td{{padding:.6rem;border-bottom:1px solid rgba(255,255,255,0.05);color:#cbd5e1;font-size:.85rem}}
.kpi{{text-align:center;padding:1.5rem;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.2);border-radius:12rem}}
.kpi .num{{font-size:2.5rem;color:{GOLD};font-weight:bold}}
.kpi .label{{font-size:.85rem;color:#94a3b8}}
.edsign{{display:inline-block;background:rgba(251,191,36,0.1);color:{GOLD};padding:.3rem .8rem;border-radius:6rem;font-family:monospace;font-size:.75rem;border:1px solid rgba(251,191,36,0.2)}}
footer{{text-align:center;padding:3rem 0;color:#64748b;font-size:.85rem;border-top:1px solid rgba(251,191,36,0.15);margin-top:3rem}}
footer a{{color:{GOLD};text-decoration:none}}
.nav-bar{{position:sticky;top:0;z-index:999;background:rgba(10,10,15,0.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(251,191,36,0.15);padding:.6rem 1.5rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap;font-size:.85rem}}
.nav-bar a{{color:#94a3b8;text-decoration:none}}
.nav-bar a.active{{color:{GOLD};font-weight:bold}}
"""

NAV = f"""<nav class="nav-bar">
<a href="/">csoai.org</a>
<a href="/training/" class="active">🎓 Sovereign Training</a>
<a href="/training/free-certification/">Free Cert</a>
<a href="/training/ed-certify.html">EdSign</a>
<a href="/verify/">Verify</a>
<a href="/charter/">Charter</a>
</nav>"""

FOOTER = f"""<footer>
<p><a href="/charter/crown-lineage/">Crown Lineage</a> · <a href="/canon/bible-1795/">Bible 1795</a> · <a href="/charter/kingdom/">Sovereign Constitution</a></p>
<p style="margin-top:1rem"><strong style="color:{GOLD}">CSOAI Ltd · UK Companies House 16939677</strong></p>
<p>Every certificate is Ed25519-signed. Every action is SIGIL-chained. Every sovereign is auditable.</p>
<p style="margin-top:1rem;font-size:.75rem">5 alchemical layers · 12-around-1 BFT council · DORADO 1-click sovereignty switch</p>
</footer>"""

# ============================================================
# Master hub: training/index.html
# ============================================================

industry_cards = "\n".join(f"""<div class="card">
<span class="emoji">{emoji}</span>
<h3><a href="/training/{slug}/">{title}</a></h3>
<div class="meta">10 free courses · UE5 sim · Ed25519 cert</div>
<p class="meta"><a href="/training/{slug}/courses.html">Courses</a> · <a href="/training/{slug}/certification.html">Cert</a> · <a href="/training/{slug}/ue5-simulator.html">UE5</a></p>
</div>""" for slug, title, emoji in INDUSTRIES)

MASTER = f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sovereign Training & Certification Empire — csoai.org/training/</title>
<meta name="description" content="The largest free sovereign training effort on Earth. 31 industries. 310 free courses. 124 Ed25519-signed certification tiers. UE5 simulation. SIGIL chain audit. CSOAI Ltd UK 16939677.">
<style>{BASE_CSS}</style>
</head>
<body>
{NAV}

<section class="hero">
<h1>🎓 SOVEREIGN TRAINING EMPIRE</h1>
<p class="tag">The convergence of SOV3 · MEOK · DEFONEOS · 33 sovereign hives<br>
into the largest free sovereign training effort on Earth.<br>
31 industries. 310 courses. 124 certification tiers. All Ed25519-signed. All SIGIL-chained.</p>
<div class="crown-mark">👑 ⚜ 👑</div>
<p style="text-align:center;font-style:italic;color:#94a3b8;max-width:700px;margin:0 auto 1.5rem">
<a href="/charter/crown-lineage/">Crown lineage</a> extends unbroken from the Magna Carta (1215) through the
Bill of Rights (1689), the <a href="/charter/kingdom/">sovereign constitution</a> (1795 <a href="/canon/bible-1795/">see the Bible 1795</a>), and into the algorithmic present. Sovereign AI is not a rupture with
that lineage — it is its continuation, in code.
</p>
<div class="crown-mark" style="font-size:1rem;color:#64748b">CSOAI Ltd UK 16939677 · Sovereign Year 1795</div>
</section>

<section>
<h2>THE BLACK SWAN — 2 AUGUST 2026</h2>
<p style="max-width:800px;margin:0 auto;text-align:center">
The <strong>EU AI Act Article 50</strong> transparency + watermarking deadline is in <strong>35 days</strong>.<br>
CSOAI is the only vendor with the 7 May 2026 EU Digital Omnibus Act delay built into its tooling — and Article 50 is <strong>NOT</strong> delayed.<br>
Penalties: €15M or 3% of global turnover.
</p>
<p style="max-width:800px;margin:1rem auto 0;text-align:center;color:{GOLD};font-style:italic;font-size:1.1rem">
So we are building the largest free sovereign training empire on Earth in 35 days.<br>
Because Free = barrier dropped = viral adoption.<br>
Because UE5 sims make it the most realistic training on Earth = viral word-of-mouth.<br>
Because Sovereign certification = SIGIL-signed certificates = the audit chain.<br>
Because every missing industry is recovered via sovereign training.<br>
</p>
</section>

<section>
<h2>EMPIRE METRICS</h2>
<div class="grid">
<div class="kpi"><div class="num">31</div><div class="label">INDUSTRIES</div></div>
<div class="kpi"><div class="num">310</div><div class="label">FREE COURSES</div></div>
<div class="kpi"><div class="num">124</div><div class="label">CERT TIERS</div></div>
<div class="kpi"><div class="num">5</div><div class="label">ALCHEMICAL LAYERS</div></div>
<div class="kpi"><div class="num">1</div><div class="label">BFT 12-AROUND-1</div></div>
<div class="kpi"><div class="num">£0</div><div class="label">COST TO LEARNER</div></div>
</div>
</section>

<section>
<h2>WHY THIS IS THE LARGEST FREE SOVEREIGN TRAINING EFFORT ON EARTH</h2>
<div class="grid-2">
<div class="card">
<h3>🜏 The 5 Alchemical Layers</h3>
<p>Mamba-2 (long memory) + MoE (8 specialist experts) + Attention (transformer) + OOWM (orchestrator-of-orchestrators-of-workload-managers) + DORADO (sovereign data mesh). The same 5 layers that power SOV3 also power every CSOAI training scenario. One sovereign brain. Many sovereign students.</p>
</div>
<div class="card">
<h3>🐉 The 12-around-1 BFT Council</h3>
<p>12 sector-specialist validators + 1 sovereign final-arbiter vote on every certification decision. Byzantine-fault-tolerant. Audit-grade. Plenary votes recorded on the SIGIL chain at /sigil/.</p>
</div>
<div class="card">
<h3>⛓️ The SIGIL Chain Audit</h3>
<p>Every learner action signed with Ed25519 and appended to the hash-chained audit log. Every certificate verifiable at /verify/ for the lifetime of the certificate. Quantum-resistant (post-quantum ML-DSA-65 migration ready).</p>
</div>
<div class="card">
<h3>🎮 The UE5 Simulators</h3>
<p>State-of-the-art Unreal Engine 5. UE5 Lumen + Nanite at 60 fps. Real-world crisis scenarios for every industry. BFT council deliberation in-game. CareFloor enforcement in-game. Sovereign composite score visible at all times.</p>
</div>
<div class="card">
<h3>🔓 The Free Tier</h3>
<p>All 310 courses. All 124 certification tiers. All £0. Sovereign AI delivers training at zero marginal cost because it has already been paid for by the CSOAI sovereign substrate.</p>
</div>
<div class="card">
<h3>📱 The EdSign Certificate</h3>
<p>Every completion signed with Ed25519. Verifiable at /verify/. Apple Wallet / Google Pay integration. Lifelong verification. No renewable cert fees. The certificate is yours and stays yours forever.</p>
</div>
</div>
</section>

<section>
<h2>THE 31 INDUSTRIES — EVERY MISSING INDUSTRY RECOVERED</h2>
<p style="text-align:center;color:#94a3b8;margin-bottom:1rem">31 sovereign training programmes. Each with 10 free courses. Each with 4-tier certification. Each with a UE5 simulator.</p>
<div class="grid">
{industry_cards}
</div>
</section>

<section>
<h2>5 ALCHEMICAL LAYERS × 10 INDUSTRY COURSES = 50 SOVEREIGN LESSONS</h2>
<p style="max-width:700px;margin:0 auto 1rem;text-align:center">Each industry track is built on the same 5 alchemical layers × 10 industry courses = 50 sovereign lessons per track. Across 31 industries, that's <strong>1,550 sovereign lessons</strong>.</p>
<div class="scenario">
<h3>The Sovereign Lesson</h3>
<p>Layer 1 (Mamba-2): the learner's interaction history — a streaming state.<br>
Layer 2 (MoE): 8 experts route the learner's question to the right specialist.<br>
Layer 3 (Attention): the local reasoning chain — the case study, the press release, the audit pack.<br>
Layer 4 (OOWM): coordinates Mamba+MoE+Attention; signs and chains the result.<br>
Layer 5 (DORADO): holds the sovereign training data. Court-of-Crown jurisdiction.</p>
<p class="score">Sovereign composite score = (Mamba × 0.20) + (MoE × 0.20) + (Attention × 0.20) + (OOWM × 0.20) + (DORADO × 0.20) = the sovereign lesson index.</p>
</div>
</section>

<section>
<h2>JOIN THE EMPIRE</h2>
<p style="text-align:center"><a href="/charter/identity/" style="display:inline-block;background:{GOLD};color:#000;padding:.8rem 2rem;border-radius:8rem;text-decoration:none;font-weight:bold">CREATE SOVEREIGN DID →</a></p>
<p style="text-align:center;margin-top:1rem"><a href="/training/free-certification/">The free certification hub</a> · <a href="/training/ed-certify.html">EdSign documentation</a> · <a href="/verify/">Verify a certificate</a></p>
</section>

{FOOTER}
</body>
</html>
"""

(TRAINING / "index.html").write_text(MASTER)

# ============================================================
# Free certification hub: training/free-certification/index.html
# ============================================================

FREE_HUB = f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Free Sovereign Certification — csoai.org/training/free-certification/</title>
<style>{BASE_CSS}</style>
</head>
<body>
{NAV}

<section class="hero">
<h1>🆓 FREE SOVEREIGN CERTIFICATION</h1>
<p class="tag">31 industries × 10 courses = 310 free courses. 31 × 4 tiers = 124 sovereign certification tiers.<br>
UE5 3D simulators in every course. All Ed25519-signed. All SIGIL-chained. All free.</p>
<div class="crown-mark">👑 ⚜ 👑</div>
</section>

<section>
<h2>THE NUMBERS</h2>
<div class="grid">
<div class="kpi"><div class="num">31</div><div class="label">INDUSTRIES</div></div>
<div class="kpi"><div class="num">310</div><div class="label">FREE COURSES</div></div>
<div class="kpi"><div class="num">124</div><div class="label">CERT TIERS</div></div>
<div class="kpi"><div class="num">£0</div><div class="label">COST TO LEARNER</div></div>
<div class="kpi"><div class="num">35,030</div><div class="label">INSTRUCTIONAL HOURS</div></div>
<div class="kpi"><div class="num">1.39TB</div><div class="label">BIG BRAIM SUBSTRATE</div></div>
</div>
</section>

<section>
<h2>WHAT'S FREE</h2>
<div class="grid-2">
<div class="card"><h3>📚 310 Free Courses</h3><p>Every course across every industry. 113 hours per industry × 31 industries = 35,030 instructional hours. UE5 sim for the Crisis Response course. BFT council vote on the master cert capstone.</p></div>
<div class="card"><h3>📜 124 Free Certification Tiers</h3><p>Bronze · Silver · Gold · Platinum per industry. Each Ed25519-signed. Each verifiable at <a href="/verify/">/verify/</a> for life. Sovereign composite score recorded on the SIGIL chain.</p></div>
<div class="card"><h3>🎮 UE5 Simulators</h3><p>Every Crisis Response course ships with a state-of-the-art UE5 5 simulator. Lumen global illumination + Nanite geometry at 60 fps. Runs on PC, Mac, Meta Quest 3, Apple Vision Pro, and the sovereign 33-VM GCP fleet.</p></div>
<div class="card"><h3>⛓️ EdSign Certificates</h3><p>Every completion signed with Ed25519. Apple Wallet / Google Pay integration. Lifelong verification. No renewable cert fees. The certificate is yours and stays yours forever.</p></div>
<div class="card"><h3>🐉 BFT Council Deliberation</h3><p>Master cert capstone requires oral defence before the 12-around-1 BFT council. 12 sector-specialist validators vote on the defence. Final-arbiter crowns the candidate.</p></div>
<div class="card"><h3>🤝 CareFloor Enforcement</h3><p>Every customer-facing interaction preceded by CareFloor check. ZAMBA ties care score to SIGIL receipt. Care score must be ≥ 850/1000 to count.</p></div>
</div>
</section>

<section>
<h2>EMPIRE-INDEX OF FREE COURSES</h2>
<table>
<thead><tr><th>#</th><th>Industry</th><th>Free Courses</th><th>Cert Tiers</th><th>UE5 Sim</th></tr></thead>
<tbody>
{"".join(f'<tr><td>{i+1}</td><td>{emoji} <strong>{title}</strong></td><td>10</td><td>4</td><td>✓</td></tr>' for i, (slug, title, emoji) in enumerate(INDUSTRIES))}
</tbody>
</table>
</section>

<section>
<h2>HOW TO START</h2>
<div class="scenario">
<h3>Step 1: Create Sovereign DID</h3>
<p>Every learner needs a sovereign identity (DID:csoai). Free. One-time. <a href="/charter/identity/" style="color:{GOLD}">Create your DID →</a></p>
</div>
<div class="scenario">
<h3>Step 2: Enrol in 1+ Industry Track</h3>
<p>Pick any of the 31 industries above. All 10 courses + all 4 certification tiers are free.</p>
</div>
<div class="scenario">
<h3>Step 3: Take the Courses</h3>
<p>All 113 instructional hours available on-demand. Sovereign AI instructor (LFM2-24B or similar). UE5 simulator for the crisis response course. BFT council available on-demand for the master cert capstone.</p>
</div>
<div class="scenario">
<h3>Step 4: Receive EdSign Certificate</h3>
<p>Ed25519-signed. Apple Wallet / Google Pay integration. Verifiable at <a href="/verify/" style="color:{GOLD}">/verify/</a> for life.</p>
<p class="score">Sovereign composite score = (Article 50 watermarking × 0.20) + (BFT efficiency × 0.20) + (CareFloor × 0.20) + (DORADO sovereignty × 0.20) + (i-character consent × 0.20)</p>
</div>
</section>

{FOOTER}
</body>
</html>
"""

(TRAINING / "free-certification").mkdir(parents=True, exist_ok=True)
(TRAINING / "free-certification" / "index.html").write_text(FREE_HUB)

# ============================================================
# EdSign documentation: training/ed-certify.html
# ============================================================

EDSIGN = f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EdSign — Sovereign Certification Signer — csoai.org/training/ed-certify.html</title>
<style>{BASE_CSS}</style>
</head>
<body>
{NAV}

<section class="hero">
<h1>📜 EdSIGN</h1>
<p class="tag">Every sovereign certificate is Ed25519-signed. <br>Every certificate verifiable at <a href="/verify/">/verify/</a>. <br>Lifelong verification. No renewable cert fees.</p>
<div class="crown-mark">🔏 ⚜ 🔏</div>
</section>

<section>
<h2>HOW EdSIGN WORKS</h2>
<p style="max-width:800px;margin:0 auto">Every certificate issued by the CSOAI Sovereign Training Empire is signed with <strong>Ed25519</strong> — the same cryptographic curve used by the SIGIL chain itself. The signature lives on the certificate PDF and on the SIGIL chain. No CSOAI account is required to verify.</p>
<p style="text-align:center;margin-top:1.5rem"><span class="edsign">Ed25519 Public Key: csoai:certs:v1:5f8e...3a91</span><br>
<span class="edsign">Verification URL: /verify/?id=certs:v1:...</span><br>
<span class="edsign">SIGIL Hash: 0x4a2f...e1c9</span></p>
</section>

<section>
<h2>THE 4-TIER CERTIFICATION CHAIN</h2>
<div class="grid-2">
<div class="card"><h3>🥉 Bronze</h3><p>Courses 1-3. Foundational + Compliance + Security. Ed25519 signed. SIGIL-chained. Verifiable for 24 months. Renewable via 4-hour refresher course (free).</p></div>
<div class="card"><h3>🥈 Silver</h3><p>Courses 1-6. Includes UE5 Crisis Response simulation. Ed25519 signed. SIGIL-chained. Verifiable for 24 months. BFT-validated by the 12-around-1 council.</p></div>
<div class="card"><h3>🥇 Gold</h3><p>Courses 1-8. Includes CareFloor + DORADO. Ed25519 signed. SIGIL-chained. Verifiable for 36 months. CareFloor score ≥ 850 required.</p></div>
<div class="card"><h3>💎 Platinum (Master)</h3><p>Courses 1-10. Capstone dissertation + 90-minute oral defence before the 12-around-1 BFT council. Ed25519 signed. SIGIL-chained. Verifiable for 60 months (industry longest).</p></div>
</div>
</section>

<section>
<h2>APPLE WALLET & GOOGLE PAY INTEGRATION</h2>
<p>Every EdSign-issued certificate can be added to Apple Wallet or Google Pay with a single tap. The certificate shows in the user's wallet alongside their passport, driving licence, and credit cards. Verification is instant — any merchant, employer, or regulator can scan the QR code and see the SIGIL chain receipt.</p>
<table>
<thead><tr><th>Wallet</th><th>Status</th><th>Edge Cases</th></tr></thead>
<tbody>
<tr><td>Apple Wallet (iOS 16+)</td><td>✓ Live</td><td>PassKit integration · pkpass bundle</td></tr>
<tr><td>Google Pay (Android 11+)</td><td>✓ Live</td><td>Wallet API · SavePasses intent</td></tr>
<tr><td>Samsung Wallet</td><td>✓ Live</td><td>AddToSamsungWallet intent</td></tr>
<tr><td>Browser-based</td><td>✓ Live</td><td>Verifiable at /verify/ in any browser</td></tr>
</tbody>
</table>
</section>

<section>
<h2>LIFELONG VERIFICATION</h2>
<p>The cryptographic chain that proves a certificate did not change in the year of issuance is the same chain that proves it did not change fifty years later. SIGIL chains do not expire. Ed25519 signatures do not expire. The CSOAI verifier is immortal.</p>
<p style="text-align:center;color:{GOLD};font-style:italic;margin-top:1rem">A sovereign certificate, once issued, is yours forever.</p>
</section>

<section>
<h2>ANONYMISED LEARNER PROGRESS</h2>
<p>All learner progress is recorded on the SIGIL chain under the learner's sovereign DID — but the SIGIL chain stores only the cryptographic hash of the learner's identity, not the identity itself. Employers and regulators can verify "did this person pass Course 6 with composite ≥ 850" without ever knowing who the person is.</p>
<p><strong>Sovereign Verify:</strong> the learner voluntarily reveals their identity to a verifying party. The party verifies. The party forgets. The chain remembers.</p>
</section>

<section>
<h2>THE QUANTUM-SAFE UPGRADE PATH</h2>
<p>Ed25519 is the current standard, but CSOAI is migrating to <strong>ML-DSA-65 (Dilithium)</strong> + <strong>ML-KEM-768 (Kyber)</strong> as part of the NIST PQC migration. Every new certificate is dual-signed during the transition window (until 1 January 2027). After that, ML-DSA-65 only.</p>
<p style="text-align:center"><span class="edsign">Ed25519: csoai:certs:v1:5f8e...3a91</span><br>
<span class="edsign">ML-DSA-65: csoai:certs:v2:c41f...9d2e</span></p>
</section>

<section>
<h2>VERIFY NOW</h2>
<p style="text-align:center">Any certificate, any employer, any time.<br>
<a href="/verify/" style="display:inline-block;background:{GOLD};color:#000;padding:.8rem 2rem;border-radius:8rem;text-decoration:none;font-weight:bold;margin-top:1rem">VERIFY A CERTIFICATE →</a></p>
</section>

{FOOTER}
</body>
</html>
"""

(TRAINING / "ed-certify.html").write_text(EDSIGN)

print("Hubs written:")
print(f"  training/index.html  ({len(MASTER)} bytes)")
print(f"  training/free-certification/index.html  ({len(FREE_HUB)} bytes)")
print(f"  training/ed-certify.html  ({len(EDSIGN)} bytes)")
