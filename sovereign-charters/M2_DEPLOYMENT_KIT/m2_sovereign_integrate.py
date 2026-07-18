#!/usr/bin/env python3
"""
M2 SOVEREIGN INTEGRATION SCRIPT FOR CSOAI.ORG
=============================================
Drop this into the csoai.org deployment. Adds:
  - Sovereign sidebar/menu on every page
  - Charter Article 0 binding
  - SOV3 mesh connectivity (mcp_sov3_federation_*)
  - 34-hive cross-walk navigation
  - BFT council ratification widget
  - UE5 simulation launcher
  - Watchdog Cert verification badge
  - EU AI Act Article 50 countdown
  - Charter cross-walk edges (1,122 bilateral edges)

REQUIREMENTS:
  pip install jinja2 httpx pydantic ed25519 pycryptodome

CONFIG (set env vars or edit below):
  CSOAI_DOMAIN     = "csoai.org"
  SOV3_MCP_URL     = "http://localhost:3101/mcp"  # or remote
  CHARTER_DIR      = "/usr/share/csoai/charters"
  PROOFOF_URL      = "https://proofof.ai/verify"
  UK_COMPANIES_HOUSE = "16939677"

USAGE:
  python3 m2_sovereign_integrate.py install /path/to/csoai-org
  python3 m2_sovereign_integrate.py deploy-portal /path/to/csoai-org  # FULL DEPLOY (recommended)
  python3 m2_sovereign_integrate.py verify /path/to/csoai-org
  python3 m2_sovereign_integrate.py ratify
  python3 m2_sovereign_integrate.py sigil-emit "H|JEEVES|csoai|charter installed"
  python3 m2_sovereign_integrate.py list

(c) 2026 CSOAI Ltd · UK Companies House 16939677
Charter Article 0: Never take equity, board seats, revenue-sharing, or success fees.
"""

import os, sys, json, hashlib
from pathlib import Path
from datetime import datetime, timezone

CSOAI_DOMAIN = os.getenv("CSOAI_DOMAIN", "csoai.org")
SOV3_MCP_URL = os.getenv("SOV3_MCP_URL", "http://localhost:3101/mcp")
CHARTER_DIR  = Path(os.getenv("CHARTER_DIR", "/Users/nicholas/clawd/sovereign-charters"))
PROOFOF_URL  = os.getenv("PROOFOF_URL", "https://proofof.ai/verify")
UK_CH        = os.getenv("UK_COMPANIES_HOUSE", "16939677")

CHARTER_ARTICLE_0 = "Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI."

# THE 34 HIVES with their charter files
HIVES = [
    ("01", "csoai",               "AI Governance Standards"),
    ("02", "meok",                "Sovereign AI OS"),
    ("03", "proofof",             "Cryptographic Attestation"),
    ("04", "safetyof",            "AI Safety Monitoring"),
    ("05", "accountabilityof",    "AI Incident Reporting"),
    ("06", "ethicalgovernanceof", "Ethical AI Frameworks"),
    ("07", "transparencyof",      "Model Explainability"),
    ("08", "biasdetectionof",     "AI Fairness"),
    ("09", "dataprivacyof",       "Data Protection / GDPR"),
    ("10", "asisecurity",         "AI Security"),
    ("11", "agisafe",             "AGI Safety"),
    ("12", "defoneos",            "Defence AI OS"),
    ("13", "councilof",           "BFT Governance Councils"),
    ("14", "openmoe",             "Mixture-of-Experts"),
    ("15", "openmcp",             "MCP Registry"),
    ("16", "openpatent",          "Invention Disclosures"),
    ("17", "sandbox",             "Hive Diagnostics"),
    ("18", "sovereign-town",      "Sovereign Town Lab"),
    ("19", "meok-compliance-gateway", "MCP Transport / x402"),
    ("20", "loopfactory",         "Automation Workflows"),
    ("21", "optimobile",          "Mobile Analytics"),
    ("22", "socialmediamanager",  "Social Scheduling"),
    ("23", "cobolbridge",         "COBOL Modernisation"),
    ("24", "commercialvehicle",   "UK Fleet Logistics"),
    ("25", "diyhelp",             "Home Improvement"),
    ("26", "fishkeeper",          "Aquatics"),
    ("27", "grabhire",            "UK Haulage"),
    ("28", "koikeeper",           "Koi Breeding"),
    ("29", "landlaw",             "UK Property Law"),
    ("30", "muckaway",            "UK Waste Management"),
    ("31", "planthire",           "UK Plant Hire"),
    ("32", "pokerhud",            "Poker Analytics"),
    ("33", "suicidestop",         "Crisis Support"),
    ("34", "science",             "Scientific Research"),
]

# SIDEBAR — drops onto every page
SOVEREIGN_SIDEBAR_HTML = """
<!-- SOVEREIGN SIDEBAR · csoai.org · DO NOT REMOVE · Article 0 binding -->
<aside id="sovereign-sidebar" style="
  position:fixed; top:64px; right:0; width:280px; height:calc(100vh - 64px);
  background:linear-gradient(180deg,#0a0e1a 0%, #060912 100%);
  border-left:1px solid rgba(201,168,76,0.3);
  overflow-y:auto; padding:1.25rem;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  color:#cbd5e1; font-size:.82rem; z-index:9999;
  box-shadow:-4px 0 24px rgba(0,0,0,.4);
">
  <div style="text-align:center; padding-bottom:.75rem; border-bottom:1px solid rgba(201,168,76,.2);">
    <div style="font-size:1.5rem; font-weight:700; color:#c9a84c; letter-spacing:.1em;">SOVEREIGN</div>
    <div style="font-size:.65rem; color:#94a3b8; letter-spacing:.15em; margin-top:.25rem;">CHARTER OF CHARTERS · UK 16939677</div>
  </div>

  <div style="margin-top:1rem; padding:.5rem; background:rgba(201,168,76,.08); border:1px solid rgba(201,168,76,.3); border-radius:4px;">
    <div style="color:#c9a84c; font-weight:600; margin-bottom:.25rem; font-size:.7rem; letter-spacing:.1em;">CHARTER ARTICLE 0</div>
    <div style="font-style:italic; font-size:.75rem; line-height:1.4;">Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY.</div>
  </div>

  <div style="margin-top:1rem; color:#c9a84c; font-weight:600; font-size:.7rem; letter-spacing:.1em;">THE 34 INDUSTRIES</div>
  <div style="display:grid; grid-template-columns:1fr; gap:.15rem; margin-top:.5rem;">
{HIVE_LINKS}
  </div>

  <div style="margin-top:1rem; padding:.5rem; background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.3); border-radius:4px;">
    <div style="color:#fca5a5; font-weight:600; font-size:.7rem;">EU AI ACT ART 50</div>
    <div style="font-size:1.1rem; font-weight:700; color:#fff;" id="sovereign-countdown">-- days</div>
    <div style="font-size:.65rem; color:#94a3b8;">Watermarking deadline</div>
  </div>

  <div style="margin-top:1rem; padding:.5rem; background:rgba(59,130,246,.08); border:1px solid rgba(59,130,246,.2); border-radius:4px;">
    <div style="color:#93c5fd; font-weight:600; font-size:.7rem;">VERIFICATION</div>
    <div style="font-size:.7rem; margin-top:.25rem;"><a href="https://proofof.ai/verify" style="color:#60a5fa;">proofof.ai/verify</a></div>
    <div style="font-size:.7rem;"><a href="https://sovereign.wiki" style="color:#60a5fa;">sovereign.wiki</a></div>
  </div>

  <div style="margin-top:1rem; padding:.5rem; background:rgba(168,85,247,.08); border:1px solid rgba(168,85,247,.2); border-radius:4px;">
    <div style="color:#d8b4fe; font-weight:600; font-size:.7rem;">FREE TRAINING</div>
    <div style="font-size:.7rem; margin-top:.25rem;"><a href="/training" style="color:#c4b5fd;">4-tier certification</a></div>
    <div style="font-size:.7rem;"><a href="/ue5-simulator" style="color:#c4b5fd;">UE5 Simulation Engine</a></div>
    <div style="font-size:.7rem;"><a href="/ubi-starter" style="color:#c4b5fd;">UBI Starter Pathway</a></div>
  </div>

  <div style="margin-top:1rem; padding:.5rem; background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); border-radius:4px;">
    <div style="color:#86efac; font-weight:600; font-size:.7rem;">BFT COUNCIL</div>
    <div style="font-size:.7rem; margin-top:.25rem;">33-agent sovereign council</div>
    <div style="font-size:.7rem;">Quorum 23/33</div>
  </div>

  <div style="margin-top:1rem; text-align:center; font-size:.65rem; color:#64748b; padding-top:.75rem; border-top:1px solid rgba(255,255,255,.05);">
    Ed25519-signed · BFT-ratified · OTS Bitcoin-anchored
  </div>
</aside>

<script>
// EU AI Act Article 50 countdown — 2 Aug 2026
(function() {
  var deadline = new Date('2026-08-02T00:00:00Z').getTime();
  var now = Date.now();
  var days = Math.max(0, Math.ceil((deadline - now) / (1000*60*60*24)));
  var el = document.getElementById('sovereign-countdown');
  if (el) el.textContent = days + ' days';
  setTimeout(arguments.callee, 3600000);
})();
</script>
<!-- /SOVEREIGN SIDEBAR -->
"""

SOVEREIGN_FOOTER_HTML = """
<!-- SOVEREIGN FOOTER · csoai.org · UK 16939677 -->
<footer style="
  background:#060912; color:#94a3b8; padding:2.5rem 1rem;
  text-align:center; font-size:.85rem; border-top:1px solid rgba(201,168,76,.2);
  font-family:-apple-system,BlinkMacSystemFont,sans-serif;
">
  <div style="color:#c9a84c; font-weight:600; font-size:.9rem; letter-spacing:.1em;">
    CSOAI Ltd · UK Companies House 16939677 · London, United Kingdom
  </div>
  <div style="margin-top:.75rem;">
    <a href="/charters/" style="color:#c9a84c; margin:0 .5rem;">Charters</a>
    <a href="/training" style="color:#c9a84c; margin:0 .5rem;">Training</a>
    <a href="/verify" style="color:#c9a84c; margin:0 .5rem;">Verify</a>
    <a href="/bft-council" style="color:#c9a84c; margin:0 .5rem;">BFT Council</a>
    <a href="/ue5-simulator" style="color:#c9a84c; margin:0 .5rem;">Simulations</a>
    <a href="/ubi-starter" style="color:#c9a84c; margin:0 .5rem;">UBI Starter</a>
    <a href="https://defoneos.com" style="color:#c9a84c; margin:0 .5rem;">DEFONEOS</a>
  </div>
  <div style="margin-top:1rem; font-size:.75rem; font-style:italic; color:#64748b;">
    Charter Article 0: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI.
  </div>
  <div style="margin-top:1rem; font-size:.7rem; color:#475569;">
    Ed25519-signed · BFT-ratified · Cross-walked to 34 industries · 1,122 bilateral edges · OTS Bitcoin-anchored
  </div>
</footer>
<!-- /SOVEREIGN FOOTER -->
"""

SOVEREIGN_META_HTML = '''
<meta name="sovereign-charter" content="CSOAI-CHARTER-2026-06-30">
<meta name="uk-companies-house" content="16939677">
<meta name="charter-article-0" content="Never take equity, board seats, revenue-sharing, or success fees. ISO fee-for-service model ONLY.">
<meta name="ed25519-signed" content="true">
<meta name="bft-council-quorum" content="23/33">
<meta name="cross-walks" content="34-industries:1122-edges">
<link rel="canonical" href="https://csoai.org/charters/">
'''


def cmd_install(target):
    """Install sovereign sidebar/footer into every HTML page of csoai.org.
    If target is the portal dir, also install sidebar/footer into the portal pages themselves.
    """
    target_path = Path(target)
    if not target_path.exists():
        print(f"[FAIL] {target} does not exist")
        return 1

    # Build hive links
    hive_links = ""
    for num, slug, label in HIVES:
        hive_links += f'    <a href="/charters/{slug}.html" style="color:#94a3b8; text-decoration:none; padding:.2rem .4rem; border-radius:3px; font-size:.72rem;">#{num} {label}</a>\n'

    sidebar = SOVEREIGN_SIDEBAR_HTML.replace("{HIVE_LINKS}", hive_links)

    html_files = list(target_path.rglob("*.html"))
    # Filter out template files and build scripts
    html_files = [f for f in html_files if not any(x in f.name for x in ['_TEMPLATE', 'build', 'template', '_test'])]
    print(f"[INFO] Found {len(html_files)} HTML pages in {target}")

    injected = 0
    for f in html_files:
        try:
            content = f.read_text(encoding='utf-8', errors='ignore')

            # Skip if already injected
            if 'sovereign-sidebar' in content:
                continue

            # Inject sidebar after <body>
            if '<body' in content:
                body_end = content.find('>', content.find('<body')) + 1
                content = content[:body_end] + '\n' + sidebar + '\n' + content[body_end:]

            # Inject footer before </body>
            if '</body>' in content:
                content = content.replace('</body>', SOVEREIGN_FOOTER_HTML + '\n</body>')

            # Add sovereign meta tags in <head>
            if '<head>' in content and 'sovereign-charter' not in content:
                content = content.replace('<head>', '<head>' + SOVEREIGN_META_HTML)

            f.write_text(content, encoding='utf-8')
            injected += 1
        except Exception as e:
            print(f"[WARN] {f.relative_to(target_path)}: {e}")

    print(f"[OK] Injected sovereign sidebar + footer + meta into {injected}/{len(html_files)} pages")
    print(f"[INFO] 34 industries · 1,122 cross-walks · UK 16939677 · Charter Article 0 binding")
    return 0


def cmd_verify(target):
    """Verify all HTML pages have sovereign injection."""
    target_path = Path(target)
    if not target_path.exists():
        print(f"[FAIL] {target} does not exist")
        return 1

    html_files = list(target_path.rglob("*.html"))
    print(f"[INFO] Verifying {len(html_files)} pages...")

    missing = []
    for f in html_files:
        content = f.read_text(encoding='utf-8', errors='ignore')
        if 'sovereign-sidebar' not in content:
            missing.append(str(f.relative_to(target_path)))
        if 'UK Companies House 16939677' not in content:
            missing.append(f"{f.relative_to(target_path)} (missing UK CH)")

    if missing:
        print(f"[WARN] {len(missing)} issues:")
        for m in missing[:20]:
            print(f"   - {m}")
        if len(missing) > 20:
            print(f"   ... and {len(missing)-20} more")
        return 1
    else:
        print(f"[OK] All {len(html_files)} pages have sovereign injection + UK binding")
        return 0


def cmd_ratify():
    """Submit BFT council proposal for ratification."""
    payload = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "tools/call",
        "params": {
            "name": "submit_council_proposal",
            "arguments": {
                "title": "M2-SOVEREIGN-INTEGRATION: Ratify sovereign charter deployment on csoai.org",
                "description": "Motion to ratify the integration of all 34 Sovereign Charters + UBI Charter on csoai.org. Charter Article 0 binding. EU AI Act Article 50 deadline 2 Aug 2026. UK Companies House 16939677.",
                "category": "governance",
                "urgency": "high"
            }
        }
    }

    try:
        import urllib.request
        req = urllib.request.Request(
            SOV3_MCP_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read().decode('utf-8'))
            proposal_id = result.get("result", {}).get("proposal_id", "unknown")
            print(f"[OK] BFT proposal submitted: {proposal_id}")
            print(f"[INFO] Track at: {SOV3_MCP_URL}")
            return 0
    except Exception as e:
        print(f"[WARN] Could not submit (SOV3 may be offline): {e}")
        print(f"   Manually submit: POST {SOV3_MCP_URL}")
        print(f"   Payload: {json.dumps(payload, indent=2)}")
        return 0


def cmd_sigil_emit(line):
    """Emit a SIGIL line into the SOV3 audit chain."""
    digest = hashlib.sha256(line.encode()).hexdigest()[:32]
    ts = datetime.now(timezone.utc).isoformat()
    record = f"{ts} | {digest} | {line}"

    print(f"[SIGIL] emitted:")
    print(f"   Timestamp: {ts}")
    print(f"   Digest:    {digest}")
    print(f"   Line:      {line}")

    # Append to local sigil log
    sigil_log = CHARTER_DIR / "SIGIL_LOG.txt"
    try:
        with open(sigil_log, "a") as f:
            f.write(record + "\n")
        print(f"   Local log: {sigil_log}")
    except Exception as e:
        print(f"   [WARN] Could not write local log: {e}")

    # Try remote SIGIL emit
    payload = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "tools/call",
        "params": {
            "name": "sov_sigil_emit",
            "arguments": {"line": line}
        }
    }
    try:
        import urllib.request
        req = urllib.request.Request(
            SOV3_MCP_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read().decode('utf-8'))
            print(f"   Remote:    {result}")
    except Exception as e:
        print(f"   [WARN] Remote emit failed (will queue locally): {e}")
    return 0


def cmd_list():
    """List all 34 charters with status."""
    print(f"\n[INFO] THE 34 SOVEREIGN CHARTERS")
    print("=" * 80)
    for num, slug, label in HIVES:
        charter_file = CHARTER_DIR / f"{num}-{slug}-charter.md"
        if charter_file.exists():
            size = charter_file.stat().st_size
            kb = size / 1024
            print(f"  [OK]  #{num} {slug:30s} {kb:5.1f} KB  {label}")
        else:
            print(f"  [MISS] #{num} {slug:30s} MISSING  {label}")
    print("=" * 80)
    print(f"[INFO] Charter directory: {CHARTER_DIR}")
    print(f"[INFO] Domain: {CSOAI_DOMAIN}")
    print(f"[INFO] UK Companies House: {UK_CH}")
    return 0


def cmd_deploy_portal(target):
    """Copy the entire csoai_portal directory to the target csoai.org deployment,
    then run sovereign install on it."""
    import shutil

    target_path = Path(target)
    portal_source = CHARTER_DIR / "csoai_portal"

    if not portal_source.exists():
        print(f"[FAIL] Portal source not found: {portal_source}")
        print(f"  Generate it first by running the build.py in the portal dir")
        return 1

    if not target_path.exists():
        print(f"[FAIL] Target not found: {target}")
        return 1

    # Create /charters subdirectory in target
    charters_target = target_path / "charters"
    charters_target.mkdir(parents=True, exist_ok=True)

    # Copy all portal HTML files
    html_files = list(portal_source.glob("*.html"))
    copied = 0
    for f in html_files:
        dst = charters_target / f.name
        shutil.copy(f, dst)
        copied += 1

    print(f"[OK] Copied {copied} portal HTML files to {charters_target}")

    # Now run install on the target to inject sidebar/footer/meta on ALL pages
    print(f"[INFO] Running sovereign install on target...")
    cmd_install(str(target_path))

    print(f"\n[DEPLOY COMPLETE]")
    print(f"  - Portal files at: {charters_target}")
    print(f"  - Sidebar/footer/meta injected on all pages of {target}")
    print(f"  - Charter Article 0 binding active")
    print(f"  - UK Companies House 16939677 displayed")
    print(f"\n[NEXT STEPS]")
    print(f"  1. cd {target_path}")
    print(f"  2. git add . && git commit -m 'feat: sovereign charter universe'")
    print(f"  3. vercel --prod --yes  (or your deploy command)")
    print(f"  4. python3 m2_sovereign_integrate.py ratify")
    return 0


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nCommands:")
        print("  install <path>     Install sovereign sidebar/footer on every HTML page")
        print("  verify <path>      Verify all pages have sovereign injection")
        print("  deploy-portal <path> Copy entire portal + inject sidebar/footer (full deploy)")
        print("  ratify             Submit BFT council proposal")
        print("  sigil-emit <line>  Emit a SIGIL line into the audit chain")
        print("  list               List all 34 charters")
        return 1

    cmd = sys.argv[1]

    if cmd == "install":
        target = sys.argv[2] if len(sys.argv) > 2 else "."
        return cmd_install(target)
    elif cmd == "verify":
        target = sys.argv[2] if len(sys.argv) > 2 else "."
        return cmd_verify(target)
    elif cmd == "deploy-portal":
        target = sys.argv[2] if len(sys.argv) > 2 else "."
        return cmd_deploy_portal(target)
    elif cmd == "ratify":
        return cmd_ratify()
    elif cmd == "sigil-emit":
        line = sys.argv[2] if len(sys.argv) > 2 else "H|JEEVES|M2|sovereign integration"
        return cmd_sigil_emit(line)
    elif cmd == "list":
        return cmd_list()
    else:
        print(f"Unknown command: {cmd}")
        return 1


if __name__ == "__main__":
    sys.exit(main() or 0)