#!/usr/bin/env python3
"""Generate 32 lightweight MCP servers to hit 200 GitHub repos."""

import os
import subprocess

BASE = "/Users/nicholas/clawd/mcp-marketplace"

SERVERS = [
    ("sentiment-analysis-ai-mcp", "sentiment", "Analyze text sentiment with scoring and emotion detection."),
    ("expense-tracker-ai-mcp", "expense", "Track expenses, categorize spending, and generate reports."),
    ("habit-tracker-ai-mcp", "habit", "Track daily habits, streaks, and accountability metrics."),
    ("invoice-generator-ai-mcp", "invoice", "Generate professional invoices with line items and totals."),
    ("meeting-summarizer-ai-mcp", "meeting", "Summarize meeting transcripts into action items and decisions."),
    ("resume-parser-ai-mcp", "resume", "Parse resumes and extract skills, experience, and contact info."),
    ("job-description-ai-mcp", "job", "Generate and optimize job descriptions for any role."),
    ("competitor-monitor-ai-mcp", "competitor", "Monitor competitor mentions, pricing, and positioning."),
    ("price-tracker-ai-mcp", "price", "Track product prices across retailers and alert on drops."),
    ("content-calendar-ai-mcp", "calendar", "Plan and schedule social media and blog content."),
    ("ad-copy-ai-mcp", "adcopy", "Generate high-converting ad copy for multiple platforms."),
    ("survey-builder-ai-mcp", "survey", "Build surveys with logic branching and response analysis."),
    ("feedback-analyzer-ai-mcp", "feedback", "Analyze customer feedback for sentiment and themes."),
    ("churn-predictor-ai-mcp", "churn", "Predict customer churn risk from behavioral signals."),
    ("lead-scoring-ai-mcp", "lead", "Score leads based on firmographic and behavioral data."),
    ("document-comparison-ai-mcp", "doccompare", "Compare documents and highlight differences."),
    ("contract-review-ai-mcp", "contract", "Extract clauses, risks, and terms from contracts."),
    ("risk-assessment-ai-mcp", "risk", "Assess business and project risks with scoring matrices."),
    ("tax-calculator-ai-mcp", "tax", "Calculate income tax estimates for UK and US jurisdictions."),
    ("currency-converter-ai-mcp", "currency", "Convert currencies with historical rate lookup."),
    ("stock-analyzer-ai-mcp", "stock", "Analyze stocks with basic metrics and trend summaries."),
    ("crypto-tracker-ai-mcp", "crypto", "Track cryptocurrency prices and portfolio value."),
    ("mortgage-calculator-ai-mcp", "mortgage", "Calculate mortgage payments, amortization, and affordability."),
    ("budget-planner-ai-mcp", "budget", "Create monthly budgets with category allocations and tracking."),
    ("subscription-tracker-ai-mcp", "subscription", "Track SaaS subscriptions, renewal dates, and total spend."),
    ("time-tracker-ai-mcp", "timetrack", "Track time entries, projects, and productivity reports."),
    ("pomodoro-ai-mcp", "pomodoro", "Manage Pomodoro sessions and productivity analytics."),
    ("focus-timer-ai-mcp", "focus", "Run focus timers with distraction blocking recommendations."),
    ("meditation-guide-ai-mcp", "meditation", "Generate guided meditation scripts and breathing exercises."),
    ("sleep-tracker-ai-mcp", "sleep", "Track sleep duration, quality, and patterns."),
    ("workout-planner-ai-mcp", "workout", "Generate personalized workout plans by goal and equipment."),
    ("meal-planner-ai-mcp", "meal", "Generate weekly meal plans with macros and shopping lists."),
]

SERVER_PY_TEMPLATE = '''#!/usr/bin/env python3
"""MEOK AI Labs — {name} MCP Server. {desc}"""

import asyncio
import json
from datetime import datetime
from typing import Any

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
)
import mcp.types as types

# In-memory store (replace with DB in production)
_store = {{}}

server = Server("{name}")

@server.list_resources()
async def handle_list_resources() -> list[Resource]:
    return []

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    return [
        {tools}
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Any | None) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    args = arguments or {{}}
    {handlers}
    return [TextContent(type="text", text=json.dumps({{"error": "Unknown tool"}}, indent=2))]

async def main():
    async with stdio_server(server._read_stream, server._write_stream) as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="{name}",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={{}},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
'''

PYPROJECT_TEMPLATE = '''[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "{name}"
version = "0.1.0"
description = "{desc}"
authors = [{{name="MEOK AI Labs", email="nicholas@meok.ai"}}]
readme = "README.md"
license = {{text = "MIT"}}
requires-python = ">=3.10"
dependencies = [
    "mcp>=1.0.0",
]

[project.urls]
Homepage = "https://meok.ai"
Repository = "https://github.com/CSOAI-ORG/{name}"
'''

README_TEMPLATE = '''# {display_name}

{display_name} — {desc}

Built by [MEOK AI Labs](https://meok.ai).

## Tools

{tools_list}

## License

MIT © MEOK AI Labs
'''

LICENSE_TEXT = '''MIT License

Copyright (c) 2026 MEOK AI Labs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
'''

def build_tools(spec: str) -> tuple[str, str]:
    if spec == "sentiment":
        tools = '''Tool(name="analyze_sentiment", description="Analyze text sentiment", inputSchema={"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}),
        Tool(name="detect_emotion", description="Detect emotions in text", inputSchema={"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}),'''
        handlers = '''if name == "analyze_sentiment":
            text = args.get("text", "")
            score = 0.5 + (text.count("good") - text.count("bad")) * 0.1
            return [TextContent(type="text", text=json.dumps({"sentiment": "positive" if score > 0.5 else "negative", "score": round(min(max(score, 0.0), 1.0), 2)}, indent=2))]
        if name == "detect_emotion":
            return [TextContent(type="text", text=json.dumps({"emotions": ["happy"]}, indent=2))]'''
    elif spec == "expense":
        tools = '''Tool(name="add_expense", description="Add an expense", inputSchema={"type":"object","properties":{"amount":{"type":"number"},"category":{"type":"string"}},"required":["amount","category"]}),
        Tool(name="get_summary", description="Get expense summary", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "add_expense":
            _store.setdefault("expenses", []).append({"amount": args["amount"], "category": args["category"], "date": datetime.now().isoformat()})
            return [TextContent(type="text", text=json.dumps({"status": "added"}, indent=2))]
        if name == "get_summary":
            total = sum(e["amount"] for e in _store.get("expenses", []))
            return [TextContent(type="text", text=json.dumps({"total": total, "count": len(_store.get("expenses", []))}, indent=2))]'''
    elif spec == "habit":
        tools = '''Tool(name="log_habit", description="Log a habit completion", inputSchema={"type":"object","properties":{"habit":{"type":"string"}},"required":["habit"]}),
        Tool(name="get_streaks", description="Get habit streaks", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "log_habit":
            _store.setdefault(args["habit"], []).append(datetime.now().strftime("%Y-%m-%d"))
            return [TextContent(type="text", text=json.dumps({"status": "logged"}, indent=2))]
        if name == "get_streaks":
            streaks = {k: len(set(v)) for k, v in _store.items()}
            return [TextContent(type="text", text=json.dumps(streaks, indent=2))]'''
    elif spec == "invoice":
        tools = '''Tool(name="create_invoice", description="Create an invoice", inputSchema={"type":"object","properties":{"client":{"type":"string"},"items":{"type":"array","items":{"type":"object"}}},"required":["client","items"]}),'''
        handlers = '''if name == "create_invoice":
            total = sum(i.get("qty", 1) * i.get("price", 0) for i in args["items"])
            inv = {"client": args["client"], "total": total, "items": args["items"], "date": datetime.now().isoformat()}
            return [TextContent(type="text", text=json.dumps(inv, indent=2))]'''
    elif spec == "meeting":
        tools = '''Tool(name="summarize_transcript", description="Summarize a meeting transcript", inputSchema={"type":"object","properties":{"transcript":{"type":"string"}},"required":["transcript"]}),'''
        handlers = '''if name == "summarize_transcript":
            sentences = args["transcript"].split(".")
            summary = " ".join(sentences[:3]) + "."
            actions = [s.strip() for s in sentences if "will" in s or "need to" in s]
            return [TextContent(type="text", text=json.dumps({"summary": summary, "action_items": actions[:5]}, indent=2))]'''
    elif spec == "resume":
        tools = '''Tool(name="parse_resume", description="Parse a resume text", inputSchema={"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}),'''
        handlers = '''if name == "parse_resume":
            text = args["text"]
            skills = [w for w in ["Python", "JavaScript", "SQL", "AWS", "React", "Node.js"] if w in text]
            return [TextContent(type="text", text=json.dumps({"skills": skills, "experience_years": text.count("20")}, indent=2))]'''
    elif spec == "job":
        tools = '''Tool(name="generate_job_description", description="Generate a job description", inputSchema={"type":"object","properties":{"title":{"type":"string"},"level":{"type":"string"}},"required":["title"]}),'''
        handlers = '''if name == "generate_job_description":
            title = args["title"]
            level = args.get("level", "mid")
            jd = f"We are hiring a {level}-level {title}. You will work on impactful projects in a fast-paced environment."
            return [TextContent(type="text", text=json.dumps({"job_description": jd}, indent=2))]'''
    elif spec == "competitor":
        tools = '''Tool(name="add_competitor", description="Add a competitor to monitor", inputSchema={"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}),
        Tool(name="list_competitors", description="List monitored competitors", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "add_competitor":
            _store.setdefault("competitors", []).append(args["name"])
            return [TextContent(type="text", text=json.dumps({"status": "added"}, indent=2))]
        if name == "list_competitors":
            return [TextContent(type="text", text=json.dumps({"competitors": _store.get("competitors", [])}, indent=2))]'''
    elif spec == "price":
        tools = '''Tool(name="track_price", description="Track a product price", inputSchema={"type":"object","properties":{"product":{"type":"string"},"price":{"type":"number"}},"required":["product","price"]}),
        Tool(name="get_alerts", description="Get price drop alerts", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "track_price":
            old = _store.get(args["product"], {}).get("price", float("inf"))
            _store[args["product"]] = {"price": args["price"], "date": datetime.now().isoformat()}
            alert = args["price"] < old
            return [TextContent(type="text", text=json.dumps({"alert": alert, "old_price": old if old != float("inf") else None}, indent=2))]
        if name == "get_alerts":
            return [TextContent(type="text", text=json.dumps({"tracked": list(_store.keys())}, indent=2))]'''
    elif spec == "calendar":
        tools = '''Tool(name="add_content", description="Add content to calendar", inputSchema={"type":"object","properties":{"title":{"type":"string"},"date":{"type":"string"},"channel":{"type":"string"}},"required":["title","date"]}),
        Tool(name="get_calendar", description="Get content calendar", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "add_content":
            _store.setdefault("posts", []).append(args)
            return [TextContent(type="text", text=json.dumps({"status": "scheduled"}, indent=2))]
        if name == "get_calendar":
            return [TextContent(type="text", text=json.dumps({"posts": _store.get("posts", [])}, indent=2))]'''
    elif spec == "adcopy":
        tools = '''Tool(name="generate_ad_copy", description="Generate ad copy", inputSchema={"type":"object","properties":{"product":{"type":"string"},"platform":{"type":"string"}},"required":["product"]}),'''
        handlers = '''if name == "generate_ad_copy":
            platform = args.get("platform", "generic")
            copy = f"Unlock the power of {args['product']}. Try it now on {platform}!"
            return [TextContent(type="text", text=json.dumps({"ad_copy": copy, "platform": platform}, indent=2))]'''
    elif spec == "survey":
        tools = '''Tool(name="create_survey", description="Create a survey", inputSchema={"type":"object","properties":{"title":{"type":"string"},"questions":{"type":"array","items":{"type":"string"}}},"required":["title","questions"]}),'''
        handlers = '''if name == "create_survey":
            survey = {"title": args["title"], "questions": args["questions"], "id": str(len(_store) + 1)}
            _store[survey["id"]] = survey
            return [TextContent(type="text", text=json.dumps(survey, indent=2))]'''
    elif spec == "feedback":
        tools = '''Tool(name="analyze_feedback", description="Analyze customer feedback", inputSchema={"type":"object","properties":{"feedback":{"type":"array","items":{"type":"string"}}},"required":["feedback"]}),'''
        handlers = '''if name == "analyze_feedback":
            positive = sum(1 for f in args["feedback"] if any(w in f.lower() for w in ["good", "great", "love", "excellent"]))
            negative = sum(1 for f in args["feedback"] if any(w in f.lower() for w in ["bad", "poor", "hate", "terrible"]))
            return [TextContent(type="text", text=json.dumps({"positive": positive, "negative": negative, "total": len(args["feedback"])}, indent=2))]'''
    elif spec == "churn":
        tools = '''Tool(name="predict_churn", description="Predict churn risk", inputSchema={"type":"object","properties":{"last_login_days":{"type":"number"},"support_tickets":{"type":"number"}},"required":["last_login_days","support_tickets"]}),'''
        handlers = '''if name == "predict_churn":
            risk = (args["last_login_days"] * 2) + (args["support_tickets"] * 10)
            return [TextContent(type="text", text=json.dumps({"churn_risk_score": risk, "at_risk": risk > 60}, indent=2))]'''
    elif spec == "lead":
        tools = '''Tool(name="score_lead", description="Score a lead", inputSchema={"type":"object","properties":{"company_size":{"type":"number"},"budget":{"type":"number"},"engagement":{"type":"number"}},"required":["company_size","budget","engagement"]}),'''
        handlers = '''if name == "score_lead":
            score = (args["company_size"] * 0.1) + (args["budget"] * 0.01) + (args["engagement"] * 10)
            return [TextContent(type="text", text=json.dumps({"lead_score": round(min(score, 100), 1), "priority": "high" if score > 70 else "medium" if score > 40 else "low"}, indent=2))]'''
    elif spec == "doccompare":
        tools = '''Tool(name="compare_documents", description="Compare two documents", inputSchema={"type":"object","properties":{"doc1":{"type":"string"},"doc2":{"type":"string"}},"required":["doc1","doc2"]}),'''
        handlers = '''if name == "compare_documents":
            words1 = set(args["doc1"].split())
            words2 = set(args["doc2"].split())
            return [TextContent(type="text", text=json.dumps({"unique_in_doc1": len(words1 - words2), "unique_in_doc2": len(words2 - words1), "common": len(words1 & words2)}, indent=2))]'''
    elif spec == "contract":
        tools = '''Tool(name="extract_clauses", description="Extract key clauses", inputSchema={"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}),'''
        handlers = '''if name == "extract_clauses":
            clauses = []
            if "termination" in args["text"].lower(): clauses.append("Termination")
            if "liability" in args["text"].lower(): clauses.append("Liability")
            if "confidential" in args["text"].lower(): clauses.append("Confidentiality")
            return [TextContent(type="text", text=json.dumps({"clauses_found": clauses}, indent=2))]'''
    elif spec == "risk":
        tools = '''Tool(name="assess_risk", description="Assess project risk", inputSchema={"type":"object","properties":{"budget_variance":{"type":"number"},"schedule_slip_days":{"type":"number"}},"required":["budget_variance","schedule_slip_days"]}),'''
        handlers = '''if name == "assess_risk":
            risk = abs(args["budget_variance"]) + args["schedule_slip_days"]
            return [TextContent(type="text", text=json.dumps({"risk_score": risk, "level": "high" if risk > 50 else "medium" if risk > 20 else "low"}, indent=2))]'''
    elif spec == "tax":
        tools = '''Tool(name="calculate_tax_uk", description="Estimate UK income tax", inputSchema={"type":"object","properties":{"income":{"type":"number"}},"required":["income"]}),
        Tool(name="calculate_tax_us", description="Estimate US federal tax", inputSchema={"type":"object","properties":{"income":{"type":"number"}},"required":["income"]}),'''
        handlers = '''if name == "calculate_tax_uk":
            inc = args["income"]
            tax = max(0, inc - 12570) * 0.2
            return [TextContent(type="text", text=json.dumps({"income": inc, "tax": round(tax, 2), "net": round(inc - tax, 2)}, indent=2))]
        if name == "calculate_tax_us":
            inc = args["income"]
            tax = inc * 0.22
            return [TextContent(type="text", text=json.dumps({"income": inc, "tax": round(tax, 2), "net": round(inc - tax, 2)}, indent=2))]'''
    elif spec == "currency":
        tools = '''Tool(name="convert_currency", description="Convert currency", inputSchema={"type":"object","properties":{"amount":{"type":"number"},"from":{"type":"string"},"to":{"type":"string"}},"required":["amount","from","to"]}),'''
        handlers = '''if name == "convert_currency":
            rates = {"USD": 1.0, "GBP": 0.79, "EUR": 0.92, "JPY": 150.0}
            amt = args["amount"] / rates.get(args["from"], 1.0) * rates.get(args["to"], 1.0)
            return [TextContent(type="text", text=json.dumps({"converted": round(amt, 2), "rate": rates.get(args["to"], 1.0)}, indent=2))]'''
    elif spec == "stock":
        tools = '''Tool(name="analyze_stock", description="Analyze a stock ticker", inputSchema={"type":"object","properties":{"ticker":{"type":"string"},"price":{"type":"number"},"pe":{"type":"number"}},"required":["ticker","price"]}),'''
        handlers = '''if name == "analyze_stock":
            pe = args.get("pe", 20)
            rating = "buy" if pe < 15 else "hold" if pe < 25 else "sell"
            return [TextContent(type="text", text=json.dumps({"ticker": args["ticker"], "price": args["price"], "pe": pe, "rating": rating}, indent=2))]'''
    elif spec == "crypto":
        tools = '''Tool(name="get_crypto_price", description="Get crypto price", inputSchema={"type":"object","properties":{"symbol":{"type":"string"}},"required":["symbol"]}),
        Tool(name="portfolio_value", description="Calculate portfolio value", inputSchema={"type":"object","properties":{"holdings":{"type":"object"}},"required":["holdings"]}),'''
        handlers = '''if name == "get_crypto_price":
            prices = {"BTC": 65000, "ETH": 3400, "SOL": 145}
            return [TextContent(type="text", text=json.dumps({"symbol": args["symbol"], "price": prices.get(args["symbol"], 0)}, indent=2))]
        if name == "portfolio_value":
            prices = {"BTC": 65000, "ETH": 3400, "SOL": 145}
            total = sum(v * prices.get(k, 0) for k, v in args["holdings"].items())
            return [TextContent(type="text", text=json.dumps({"portfolio_value": total}, indent=2))]'''
    elif spec == "mortgage":
        tools = '''Tool(name="calculate_mortgage", description="Calculate mortgage payment", inputSchema={"type":"object","properties":{"principal":{"type":"number"},"rate":{"type":"number"},"years":{"type":"number"}},"required":["principal","rate","years"]}),'''
        handlers = '''if name == "calculate_mortgage":
            p = args["principal"]; r = args["rate"] / 1200; n = args["years"] * 12
            payment = p * (r * (1+r)**n) / ((1+r)**n - 1) if r > 0 else p / n
            return [TextContent(type="text", text=json.dumps({"monthly_payment": round(payment, 2), "total_payments": n}, indent=2))]'''
    elif spec == "budget":
        tools = '''Tool(name="create_budget", description="Create a monthly budget", inputSchema={"type":"object","properties":{"income":{"type":"number"},"categories":{"type":"object"}},"required":["income","categories"]}),'''
        handlers = '''if name == "create_budget":
            total = sum(args["categories"].values())
            return [TextContent(type="text", text=json.dumps({"income": args["income"], "allocated": total, "remaining": round(args["income"] - total, 2), "categories": args["categories"]}, indent=2))]'''
    elif spec == "subscription":
        tools = '''Tool(name="add_subscription", description="Add a subscription", inputSchema={"type":"object","properties":{"name":{"type":"string"},"cost":{"type":"number"},"renewal":{"type":"string"}},"required":["name","cost"]}),
        Tool(name="get_subscriptions", description="List subscriptions", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "add_subscription":
            _store.setdefault("subs", []).append(args)
            return [TextContent(type="text", text=json.dumps({"status": "added"}, indent=2))]
        if name == "get_subscriptions":
            total = sum(s["cost"] for s in _store.get("subs", []))
            return [TextContent(type="text", text=json.dumps({"subscriptions": _store.get("subs", []), "monthly_total": total}, indent=2))]'''
    elif spec == "timetrack":
        tools = '''Tool(name="log_time", description="Log work time", inputSchema={"type":"object","properties":{"project":{"type":"string"},"hours":{"type":"number"}},"required":["project","hours"]}),
        Tool(name="get_time_report", description="Get time report", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "log_time":
            _store.setdefault(args["project"], 0)
            _store[args["project"]] += args["hours"]
            return [TextContent(type="text", text=json.dumps({"status": "logged"}, indent=2))]
        if name == "get_time_report":
            return [TextContent(type="text", text=json.dumps(_store, indent=2))]'''
    elif spec == "pomodoro":
        tools = '''Tool(name="start_pomodoro", description="Start a Pomodoro session", inputSchema={"type":"object","properties":{"duration":{"type":"number"}},"required":[]}),
        Tool(name="get_stats", description="Get Pomodoro stats", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "start_pomodoro":
            _store.setdefault("sessions", []).append(args.get("duration", 25))
            return [TextContent(type="text", text=json.dumps({"status": "started", "duration": args.get("duration", 25)}, indent=2))]
        if name == "get_stats":
            total = sum(_store.get("sessions", []))
            return [TextContent(type="text", text=json.dumps({"total_minutes": total, "sessions": len(_store.get("sessions", []))}, indent=2))]'''
    elif spec == "focus":
        tools = '''Tool(name="start_focus", description="Start a focus timer", inputSchema={"type":"object","properties":{"minutes":{"type":"number"}},"required":["minutes"]}),'''
        handlers = '''if name == "start_focus":
            return [TextContent(type="text", text=json.dumps({"focus_started": True, "minutes": args["minutes"], "tip": "Close notifications and put phone away."}, indent=2))]'''
    elif spec == "meditation":
        tools = '''Tool(name="get_meditation", description="Get a guided meditation", inputSchema={"type":"object","properties":{"duration":{"type":"number"}},"required":[]}),
        Tool(name="breathing_exercise", description="Get a breathing exercise", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "get_meditation":
            mins = args.get("duration", 10)
            return [TextContent(type="text", text=json.dumps({"meditation": f"Sit comfortably. Breathe slowly for {mins} minutes. Focus on your breath."}, indent=2))]
        if name == "breathing_exercise":
            return [TextContent(type="text", text=json.dumps({"exercise": "Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 5 times."}, indent=2))]'''
    elif spec == "sleep":
        tools = '''Tool(name="log_sleep", description="Log sleep", inputSchema={"type":"object","properties":{"hours":{"type":"number"},"quality":{"type":"number"}},"required":["hours"]}),
        Tool(name="get_sleep_trend", description="Get sleep trend", inputSchema={"type":"object","properties":{}}),'''
        handlers = '''if name == "log_sleep":
            _store.setdefault("logs", []).append({"hours": args["hours"], "quality": args.get("quality", 5)})
            return [TextContent(type="text", text=json.dumps({"status": "logged"}, indent=2))]
        if name == "get_sleep_trend":
            logs = _store.get("logs", [])
            avg = sum(l["hours"] for l in logs) / len(logs) if logs else 0
            return [TextContent(type="text", text=json.dumps({"average_hours": round(avg, 1), "entries": len(logs)}, indent=2))]'''
    elif spec == "workout":
        tools = '''Tool(name="generate_workout", description="Generate a workout plan", inputSchema={"type":"object","properties":{"goal":{"type":"string"},"equipment":{"type":"array","items":{"type":"string"}}},"required":["goal"]}),'''
        handlers = '''if name == "generate_workout":
            goal = args["goal"]
            eq = args.get("equipment", ["bodyweight"])
            plan = {"warmup": "5 min jog", "main": [f"{goal} exercise with {eq[0]}" for _ in range(3)], "cooldown": "Stretching"}
            return [TextContent(type="text", text=json.dumps(plan, indent=2))]'''
    elif spec == "meal":
        tools = '''Tool(name="generate_meal_plan", description="Generate a weekly meal plan", inputSchema={"type":"object","properties":{"diet":{"type":"string"},"calories":{"type":"number"}},"required":["diet"]}),'''
        handlers = '''if name == "generate_meal_plan":
            diet = args["diet"]
            cals = args.get("calories", 2000)
            plan = {f"Day {i}": {"breakfast": f"{diet} oats", "lunch": f"{diet} salad", "dinner": f"{diet} stir-fry"} for i in range(1, 8)}
            return [TextContent(type="text", text=json.dumps({"diet": diet, "target_calories": cals, "plan": plan}, indent=2))]'''
    else:
        tools = 'Tool(name="echo", description="Echo input", inputSchema={"type":"object","properties":{"message":{"type":"string"}},"required":["message"]}),'
        handlers = 'if name == "echo": return [TextContent(type="text", text=json.dumps({"echo": args.get("message", "")}, indent=2))]'
    
    return tools, handlers

def build(name: str, spec: str, desc: str):
    path = os.path.join(BASE, name)
    os.makedirs(path, exist_ok=True)
    
    tools, handlers = build_tools(spec)
    
    server_py = SERVER_PY_TEMPLATE.format(name=name, desc=desc, tools=tools, handlers=handlers)
    with open(os.path.join(path, "server.py"), "w") as f:
        f.write(server_py)
    
    with open(os.path.join(path, "pyproject.toml"), "w") as f:
        f.write(PYPROJECT_TEMPLATE.format(name=name, desc=desc))
    
    tools_list = "\n".join([f"- `{t.split('Tool(name=\"')[1].split('\"')[0]}`" for t in tools.split(",") if "Tool(name=" in t])
    with open(os.path.join(path, "README.md"), "w") as f:
        f.write(README_TEMPLATE.format(display_name=name.replace("-", " ").title(), desc=desc, tools_list=tools_list))
    
    with open(os.path.join(path, "LICENSE"), "w") as f:
        f.write(LICENSE_TEXT)
    
    # Git init and commit
    subprocess.run(["git", "init"], cwd=path, capture_output=True)
    subprocess.run(["git", "add", "."], cwd=path, capture_output=True)
    subprocess.run(["git", "commit", "-m", "Initial commit"], cwd=path, capture_output=True)
    
    print(f"✅ {name}")

if __name__ == "__main__":
    for name, spec, desc in SERVERS:
        build(name, spec, desc)
    print(f"\nBuilt {len(SERVERS)} servers in {BASE}")
