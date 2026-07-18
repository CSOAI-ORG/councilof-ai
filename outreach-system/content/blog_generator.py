"""Blog post generator for templeman-opticians.com SEO"""
import json, os
from datetime import datetime

BLOG_DIR = "/Users/nicholas/clawd/outreach-system/content/blogs"
os.makedirs(BLOG_DIR, exist_ok=True)

POSTS = [
    {
        "title": "5 Ways Better Eyesight Prevents Falls in Care Homes",
        "keyword": "eye test dementia patients falls prevention",
        "meta": "Discover how regular eye tests reduce fall risk in care home residents by up to 40%. Templeman Opticians explains the vision-falls connection.",
        "sections": ["The vision-falls connection", "5 ways eye tests prevent falls", "CQC compliance and eye care", "How Templeman helps"]
    },
    {
        "title": "NHS Home Eye Test Eligibility 2026 — Complete Guide for Essex Residents",
        "keyword": "nhs home eye test eligibility essex 2026",
        "meta": "Complete guide to NHS-funded home eye tests. Check if you or your loved one qualifies. Updated for 2026 NHS criteria.",
        "sections": ["Who qualifies for a free NHS eye test", "Mobile sight tests explained", "How to claim NHS vouchers", "Essex-specific services"]
    },
    {
        "title": "Why National Providers Stopped Care Home Group Testing — And What It Means",
        "keyword": "care home eye tests stopped group clinics",
        "meta": "OutsideClinic and Specsavers have stopped group eye testing in care homes. Learn what this means for your residents and how Templeman fills the gap.",
        "sections": ["What changed", "Impact on care homes", "Templeman's block contract solution", "How to switch providers"]
    },
    {
        "title": "What Is Domiciliary Eye Care? Complete Guide to Home Eye Tests",
        "keyword": "what is domiciliary eye care home test",
        "meta": "Learn what domiciliary optometry is, who qualifies, what happens during a home eye test, and how to book one in Essex.",
        "sections": ["What is domiciliary optometry", "Who needs it", "What happens during a test", "Costs and NHS funding", "How to book in Essex"]
    },
    {
        "title": "How Often Do Care Home Residents Need Eye Tests?",
        "keyword": "how often eye test care home residents",
        "meta": "NHS recommends annual eye tests for care home residents. Learn why, what's checked, and how Templeman makes it simple.",
        "sections": ["NHS recommendations", "Why annual tests matter", "Common age-related conditions", "Templeman's annual schedule"]
    }
]

for i, post in enumerate(POSTS, 1):
    fname = f"{i:02d}-{post['title'].lower().replace(' ','-').replace('?','')[:60]}.html"
    html = f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{post['title']} — Templeman Opticians Essex</title>
<meta name="description" content="{post['meta']}">
<meta name="keywords" content="{post['keyword']}, templeman opticians, essex domiciliary optician, home eye test">
<link rel="canonical" href="https://templeman-opticians.com/blog/{fname.replace('.html','')}">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{{--ink:#0f0f1a;--gold:#c4a23a;--bg:#faf8f3;--muted:#5c5c6e}}
body{{font-family:Inter,-apple-system,sans-serif;color:var(--ink);background:var(--bg);line-height:1.8;padding:2rem 1rem;max-width:720px;margin:0 auto}}
h1{{font-family:'Cormorant Garamond',serif;font-size:2rem;margin-bottom:.5rem}}
h2{{font-family:'Cormorant Garamond',serif;font-size:1.5rem;margin:2rem 0 1rem;color:var(--gold)}}
.btn{{display:inline-block;background:var(--gold);color:var(--ink);padding:.7rem 1.5rem;border-radius:10px;text-decoration:none;font-weight:700}}
</style>
</head>
<body>
<h1>{post['title']}</h1>
<p style="color:var(--muted)">{datetime.now().strftime('%B %d, %Y')} · Templeman Opticians Essex</p>
{"".join(f'<h2>{s}</h2><p>This is where the detailed content goes for section "{s}". Research-backed content about domiciliary eye care in Essex, written for care home managers and patients\' families.</p>' for s in post['sections'])}
<div style="margin-top:3rem;padding:1.5rem;background:var(--ink);color:#fff;border-radius:14px;text-align:center">
<h3 style="font-family:'Cormorant Garamond',serif">Need a Home Eye Test?</h3>
<a href="tel:+441268777729" class="btn">📞 01268 777729</a>
<p style="margin-top:1rem;font-size:.9rem"><a href="/book-home-test" style="color:var(--gold)">Book Online</a> · <a href="/" style="color:var(--gold)">Home</a></p>
</div>
</body></html>"""
    with open(f"{BLOG_DIR}/{fname}", "w") as f:
        f.write(html)

print(f"✅ Generated {len(POSTS)} blog post templates")
for i, post in enumerate(POSTS, 1):
    print(f"  {i}. {post['title']} [{post['keyword']}]")
