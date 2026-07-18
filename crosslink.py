#!/usr/bin/env python3
"""
Cross-link every deployed static site to the MEOK hive + industries + blog.
For each site, inject a "meok.ai" link into the footer if not present.
"""
import os
import re

SITES = [
    "/Users/nicholas/clawd/wowmcp-deploy/index.html",
    "/Users/nicholas/clawd/wowmcp-deploy/llms.txt",
    "/Users/nicholas/clawd/compliance-meok-ai/index.html",
    "/Users/nicholas/clawd/compliance-meok-ai/llms.txt",
    "/Users/nicholas/clawd/case-studies-deploy/fintech.html",
    "/Users/nicholas/clawd/case-studies-deploy/care.html",
    "/Users/nicholas/clawd/case-studies-deploy/hrtech.html",
    "/Users/nicholas/clawd/hive-deploy/index.html",
    "/Users/nicholas/clawd/hive-deploy/llms.txt",
    "/Users/nicholas/clawd/industries-deploy/index.html",
    "/Users/nicholas/clawd/industries-deploy/llms.txt",
    "/Users/nicholas/clawd/portfolio-deploy/index.html",
    "/Users/nicholas/clawd/portfolio-deploy/llms.txt",
    "/Users/nicholas/clawd/blog-deploy/index.html",
    "/Users/nicholas/clawd/blog-deploy/llms.txt",
]

# For each site, ensure the footer/nav mentions meok.ai/hive, meok.ai/industries, meok.ai/blog
MEOLINK_BLOCK = """ | <a href="https://hive-deploy.vercel.app" target="_blank" rel="noopener noreferrer">hive</a> | <a href="https://industries-deploy.vercel.app" target="_blank" rel="noopener noreferrer">industries</a> | <a href="https://blog-deploy-azure.vercel.app" target="_blank" rel="noopener noreferrer">blog</a> | <a href="https://portfolio-deploy-orcin-three.vercel.app" target="_blank" rel="noopener noreferrer">portfolio</a> | <a href="https://meok.ai" target="_blank" rel="noopener noreferrer">meok.ai</a>"""

def add_links(path):
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        content = f.read()
    original = content
    is_html = path.endswith(".html") or path.endswith(".htm")
    is_txt = path.endswith(".txt")

    if is_html:
        # Replace the footer if exists, else append before </body>
        if "<footer" in content:
            # If footer exists, ensure hive+industries+blog are linked
            if "hive-deploy.vercel.app" not in content:
                # Add a "MEOK portfolio" link to the footer
                content = re.sub(
                    r"(<footer[^>]*>)",
                    r"\1\n<nav style='text-align:center; padding: 0.5rem; background: rgba(201,168,76,0.05); border-top: 1px solid #e5e7eb;'><strong>MEOK portfolio:</strong>" + MEOLINK_BLOCK + "</nav>",
                    content,
                    count=1
                )
        elif "</body>" in content:
            content = content.replace(
                "</body>",
                f"\n<nav style='text-align:center; padding: 0.5rem; background: rgba(201,168,76,0.05); border-top: 1px solid #e5e7eb;'><strong>MEOK portfolio:</strong>{MEOLINK_BLOCK}</nav>\n</body>"
            )
    elif is_txt:
        # For llms.txt, append a "See also" section
        if "hive-deploy.vercel.app" not in content:
            content = content.rstrip() + "\n\n## See also\n\n- meok.ai/hive: https://hive-deploy.vercel.app (SOV3 agent universe)\n- meok.ai/industries: https://industries-deploy.vercel.app (8 verticals)\n- meok.ai/blog: https://blog-deploy-azure.vercel.app (6 articles)\n- meok.ai portfolio: https://portfolio-deploy-orcin-three.vercel.app\n"

    if content != original:
        with open(path, "w") as f:
            f.write(content)
        return "patched"
    return "no_change"


def main():
    print("=== SPRINT 1: cross-link every site to meok.ai/hive + industries + blog ===\n")
    for path in SITES:
        result = add_links(path)
        if result:
            print(f"  {result:12s}  {path}")
    print("\n=== Done ===")


if __name__ == "__main__":
    main()
