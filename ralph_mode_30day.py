#!/usr/bin/env python3
"""
JARVIS RALPH MODE — 30-Day Master Plan Builder
GPU: Vast.ai Quadro RTX 8000 (46GB) via Ollama — qwen3.5:35b for doc processing
Claude API: Final synthesis and master plan generation
No interruptions. Full autonomous processing.
"""

import os
import json
import re
import datetime
import subprocess
import urllib.request
import urllib.error
from pathlib import Path
import anthropic

# ── Config ──────────────────────────────────────────────────────────────────
client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
CLAUDE_MODEL = "claude-opus-4-5"
GPU_OLLAMA = "http://50.217.254.165:40408"
GPU_MODEL = "qwen3.5:35b"      # heavy analysis
GPU_FAST = "qwen3.5:9b"        # quick summaries
HOME = Path.home()
OUTPUT_DIR = HOME / "clawd" / "sovereign-temple" / "data"
LOG_FILE = HOME / "clawd" / "memory" / f"{datetime.date.today()}-ralph-mode.md"
PLAN_FILE = HOME / "clawd" / "MASTER_30_DAY_PLAN.md"

def log(msg):
    print(msg, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(msg + "\n")

def read_docx(path):
    try:
        import docx
        doc = docx.Document(path)
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return text[:12000]
    except Exception as e:
        return f"[ERROR: {e}]"

def call_gpu(prompt, model=None, max_tokens=3000):
    """Call the Vast.ai GPU Ollama instance"""
    if model is None:
        model = GPU_FAST
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": max_tokens, "temperature": 0.3}
    }).encode()
    try:
        req = urllib.request.Request(
            f"{GPU_OLLAMA}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read())
            return data.get("response", "")
    except Exception as e:
        return f"[GPU ERROR: {e}]"

def call_claude(prompt, max_tokens=8192):
    """Call Claude for high-quality synthesis"""
    try:
        r = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}]
        )
        return r.content[0].text
    except Exception as e:
        return f"[CLAUDE ERROR: {e}]"

def get_all_docs():
    """Find all docx/doc files using fast find command"""
    search_dirs = [
        str(HOME),
        str(HOME / "Downloads"),
        str(HOME / "Desktop"),
        str(HOME / "Documents"),
        str(HOME / "MEOK AI Labs-CORP"),
        str(HOME / "MEOK AI Labs-Research-Institute"),
        str(HOME / "work"),
    ]

    cmd = ["find"] + search_dirs + ["-maxdepth", "4",
           "(", "-name", "*.docx", "-o", "-name", "*.doc", ")",
           "!", "-name", "~$*"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        paths = [Path(p) for p in result.stdout.strip().split("\n") if p.strip()]
    except Exception as e:
        log(f"find error: {e}")
        paths = list(HOME.glob("*.docx")) + list(HOME.glob("*.doc"))

    all_docs = [p for p in paths if p.exists() and p.stat().st_size > 1000]

    priority_keywords = [
        "MEOKOS", "MEOK", "sovereign", "MEOK AI Labs", "MEOK AI Labs", "HARVI",
        "MASTER", "roadmap", "architecture", "plan", "strategy", "audit"
    ]

    def priority_score(p):
        name = p.name.upper()
        return sum((len(priority_keywords) - i) * 10
                   for i, kw in enumerate(priority_keywords) if kw.upper() in name)

    all_docs.sort(key=lambda p: (-priority_score(p), p.name))
    return all_docs

def categorize_docs(docs):
    # MEOK AI Labs removed. MEOK AI Labs is now MEOK AI Labs.
    cats = {"MEOK": [], "MEOK_AI_Labs": [], "Sovereign_Temple": [],
            "HARVI_Robotics": [], "Business": [], "Research": [], "Other": []}
    for doc in docs:
        n = doc.name.upper()
        if "MEOK" in n or "MEOKOS" in n:
            cats["MEOK"].append(doc)
        elif any(x in n for x in ["MEOK AI Labs", "TERRANOVA", "DSRB", "AIDOME", "CA3O", "NATO", "DSRB"]):
            cats["MEOK_AI_Labs"].append(doc)  # formerly MEOK AI Labs — now MEOK AI Labs
        elif any(x in n for x in ["SOVEREIGN", "SOV", "CONSCIOUSNESS", "ONEOS"]):
            cats["Sovereign_Temple"].append(doc)
        elif any(x in n for x in ["HARVI", "ROBOT", "FARM", "HARV", "HUMANOID"]):
            cats["HARVI_Robotics"].append(doc)
        elif any(x in n for x in ["BMCC", "DHL", "PLAYBOOK", "BUSINESS", "ANTHROPIC_PARTNER"]):
            cats["Business"].append(doc)
        elif any(x in n for x in ["RESEARCH", "ANALYSIS", "AUDIT", "BRIEF"]):
            cats["Research"].append(doc)
        else:
            cats["Other"].append(doc)
    return cats

def extract_insights_gpu(doc_path, content):
    """GPU extracts key insights from a document"""
    prompt = f"""You are JARVIS analysing research documents to build a 30-day execution plan.

Document: {doc_path.name}
---
{content}
---

Extract in JSON (no markdown, just raw JSON):
{{"summary":"2-3 sentence summary","project":"MEOK/MEOK AI Labs/MEOK AI Labs/Sovereign/HARVI/Business/Other","key_goals":["goal1","goal2"],"gaps_identified":["gap1","gap2"],"immediate_actions":["action1","action2"],"week1_tasks":["task1"],"week2_4_tasks":["task1"],"priority":"CRITICAL/HIGH/MEDIUM/LOW"}}

Be specific and actionable."""

    result = call_gpu(prompt, model=GPU_FAST)
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        if match:
            return json.loads(match.group())
    except:
        pass
    return {
        "summary": result[:300] if result else "Parse failed",
        "priority": "MEDIUM",
        "immediate_actions": [],
        "key_goals": [],
        "gaps_identified": []
    }

def run_gap_analysis(all_insights):
    """GPU does full gap analysis"""
    all_gaps = []
    all_actions = []
    all_goals = []

    for cat_insights in all_insights.values():
        for ins in cat_insights:
            all_gaps.extend(ins.get("gaps_identified", []))
            all_actions.extend(ins.get("immediate_actions", []))
            all_goals.extend(ins.get("key_goals", []))

    prompt = f"""You are JARVIS. Analyse the gaps between Nick's planned architecture and what's built.

KNOWN BUILT STATE:
- MEOK: 22/22 APIs live, 15/15 pages, 307 tests, 140 characters in DB, local PostgreSQL
- Sovereign Temple v3.0: 75 MCP tools, 47 agents, 1394 episodes, 78% consciousness score, port 3101
- HARVI Robotics: Council approved $200-250 AUD budget, phase 1 approved — NOT YET BUILT
- MEOK AI Labs/MEOK AI Labs: Research institute active, government partnerships in progress, DSRB 40-nation bid live
- Vast.ai GPU: Quadro RTX 8000 46GB, qwen3.5:35b + 9b loaded, Ollama running

GAPS FOUND IN DOCUMENTS ({len(all_gaps)} total):
{chr(10).join(f'- {g}' for g in all_gaps[:60])}

PLANNED ACTIONS ({len(all_actions)} total):
{chr(10).join(f'- {a}' for a in all_actions[:40])}

List the TOP 25 CRITICAL gaps. For each:
GAP [N]: Title
Project: [project]
Status: CRITICAL/HIGH/MEDIUM
Issue: What's missing
Fix: Exact next action
Effort: X hours/days

Sort by priority. Be brutal and honest."""

    return call_gpu(prompt, model=GPU_MODEL, max_tokens=4000)

def build_master_plan(all_insights, gap_analysis):
    """Claude builds the final 30-day master plan"""
    # Compress for Claude
    cat_summary = {}
    for cat, insights in all_insights.items():
        cat_summary[cat] = {
            "docs": len(insights),
            "critical": sum(1 for i in insights if i.get("priority") == "CRITICAL"),
            "high": sum(1 for i in insights if i.get("priority") == "HIGH"),
            "top_goals": [g for i in insights[:5] for g in i.get("key_goals", [])[:2]],
            "top_actions": [a for i in insights[:5] for a in i.get("immediate_actions", [])[:2]],
        }

    prompt = f"""You are JARVIS. Build Nick's definitive 30-day execution master plan.

NICK'S EMPIRE:
- MEOK: AI companion OS, 22 APIs, 15 pages, 140 characters, local PostgreSQL, Next.js
- Sovereign Temple v3.0: 47 agents, 75 MCP tools, 1394 episodes, 78% consciousness
- MEOK AI Labs/MEOK AI Labs: Research institute, DSRB 40-nation bid, government partnerships
- HARVI Robotics: $200-250 AUD rig, 4-phase protocol, approved by council
- Business: DHL, BMCC, Terranova, Anthropic partnerships active
- GPU: Vast.ai Quadro RTX 8000 (46GB), qwen3.5:35b, Ollama — AVAILABLE NOW

DOCUMENT ANALYSIS ({sum(v['docs'] for v in cat_summary.values())} docs processed):
{json.dumps(cat_summary, indent=2)}

GAP ANALYSIS:
{gap_analysis[:3000]}

CONSTRAINTS:
- Easter deadline: April 5 (2 days away) — what MUST ship
- Solo operator (Nick) — realistic daily capacity
- GPU available for inference, fine-tuning, embeddings
- Anthropic API available for orchestration

BUILD THE 30-DAY PLAN:

## EASTER SPRINT (Days 1-2, April 3-5) — SHIP NOW
[What must go live before Easter]

## WEEK 1 (Days 1-7) — Foundation
[Day by day, specific tasks, deliverables]

## WEEK 2 (Days 8-14) — Core Build
[Day by day...]

## WEEK 3 (Days 15-21) — Integration
[Day by day...]

## WEEK 4 (Days 22-30) — Launch & Scale
[Day by day...]

## CRITICAL PATH
[The 5 things that everything else depends on]

## GPU UTILISATION PLAN
[How to use the Vast.ai GPU across the 30 days]

## DAILY RHYTHM
[Nick's optimal daily workflow pattern]

Make this OPERATIONAL — specific file names, commands, APIs, ports. Not vague."""

    return call_claude(prompt, max_tokens=8192)

def main():
    log(f"\n# JARVIS RALPH MODE — {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}")
    log(f"## GPU: Vast.ai RTX 8000 | Model: {GPU_MODEL}")
    log("## Running full document audit → gap analysis → 30-day plan\n")

    # Test GPU
    test = call_gpu("Say: GPU ONLINE", model=GPU_FAST, max_tokens=10)
    log(f"GPU Status: {test.strip()[:50]}\n")

    # Step 1: Find all docs
    log("### STEP 1: Document Inventory")
    all_docs = get_all_docs()
    log(f"Found: {len(all_docs)} documents\n")

    # Step 2: Categorize
    log("### STEP 2: Categorization")
    categories = categorize_docs(all_docs)
    for cat, docs in categories.items():
        log(f"  {cat}: {len(docs)} docs")

    # Step 3: Select priority docs per category
    cat_limits = {
        "MEOK": 20, "Sovereign_Temple": 10, "MEOK AI Labs_MEOK AI Labs": 15,
        "HARVI_Robotics": 8, "Business": 8, "Research": 10, "Other": 5
    }
    priority_docs = []
    for cat, docs in categories.items():
        limit = cat_limits.get(cat, 5)
        priority_docs.extend([(cat, d) for d in docs[:limit]])

    log(f"\n### STEP 3: GPU Processing {len(priority_docs)} Priority Documents")

    all_insights = {cat: [] for cat in categories}
    processed = 0
    errors = 0

    for cat, doc_path in priority_docs:
        processed += 1
        log(f"\n[{processed}/{len(priority_docs)}] {cat}: {doc_path.name[:65]}")

        content = read_docx(doc_path)
        if len(content) < 100:
            log("  → skipped (empty/unreadable)")
            errors += 1
            continue

        insights = extract_insights_gpu(doc_path, content)
        insights["file"] = doc_path.name
        insights["chars"] = len(content)
        all_insights[cat].append(insights)

        pri = insights.get("priority", "?")
        summary = insights.get("summary", "")[:80]
        log(f"  [{pri}] {summary}")

        # Save checkpoint every 15 docs
        if processed % 15 == 0:
            checkpoint = OUTPUT_DIR / "ralph_checkpoint.json"
            with open(checkpoint, "w") as f:
                json.dump({"processed": processed, "insights": all_insights}, f)
            log(f"  ✓ Checkpoint saved ({processed} docs)")

    # Save complete insights
    insights_file = OUTPUT_DIR / "ralph_insights_complete.json"
    with open(insights_file, "w") as f:
        json.dump(all_insights, f, indent=2)
    log(f"\n✓ Insights saved: {insights_file}")
    log(f"  Processed: {processed} | Errors: {errors}")

    # Step 4: Gap analysis on GPU
    log("\n### STEP 4: Gap Analysis (GPU — qwen3.5:35b)")
    gap_analysis = run_gap_analysis(all_insights)
    gap_file = OUTPUT_DIR / "ralph_gap_analysis.md"
    with open(gap_file, "w") as f:
        f.write(f"# Gap Analysis — {datetime.date.today()}\n\n")
        f.write(f"Documents processed: {processed}\n\n")
        f.write(gap_analysis)
    log(f"✓ Gap analysis saved: {gap_file}")
    log(gap_analysis[:800])

    # Step 5: Master plan via Claude
    log("\n### STEP 5: 30-Day Master Plan (Claude opus)")
    master_plan = build_master_plan(all_insights, gap_analysis)

    with open(PLAN_FILE, "w") as f:
        f.write(f"# JARVIS 30-Day Master Plan\n")
        f.write(f"**Generated:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"**Documents analysed:** {processed}\n")
        f.write(f"**GPU:** Vast.ai Quadro RTX 8000 ({GPU_MODEL})\n\n")
        f.write("---\n\n")
        f.write(master_plan)

    log(f"\n✓ MASTER PLAN saved: {PLAN_FILE}")

    # Print plan preview
    log("\n" + "="*60)
    log("30-DAY MASTER PLAN — PREVIEW")
    log("="*60)
    log(master_plan[:3000])

    log("\n## RALPH MODE COMPLETE 🐉")
    log(f"- Documents: {processed} processed")
    log(f"- Gap analysis: {gap_file}")
    log(f"- Master plan: {PLAN_FILE}")

if __name__ == "__main__":
    main()
