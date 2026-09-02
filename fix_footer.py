import sys
import re
from bs4 import BeautifulSoup

# Load live footer html
with open('footer.html', 'r') as f:
    footer_html = f.read()

# Load our layout.tsx
with open('src/app/layout.tsx', 'r') as f:
    layout_content = f.read()

# I will write a simple function to replace the footer component in layout.tsx.
# The footer component in layout.tsx starts with `function Footer() {` and ends at the end of the file.

footer_react = f"""function Footer() {{
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-bold text-emerald-900 mb-4">Measurement</h3>
            <ul className="space-y-3">
              <li><a href="/os" className="text-muted-foreground hover:text-emerald-700 text-sm">Council OS Workspace</a></li>
              <li><a href="/?lobby=board" className="text-muted-foreground hover:text-emerald-700 text-sm">Live Board (GET /api/gspc)</a></li>
              <li><a href="/?lobby=verify" className="text-muted-foreground hover:text-emerald-700 text-sm">Verify a 3KB Card</a></li>
              <li><a href="/?lobby=measured" className="text-muted-foreground hover:text-emerald-700 text-sm">Request Measurement</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 mb-4">Regulation (EU)</h3>
            <ul className="space-y-3">
              <li><a href="/?lobby=evidence" className="text-muted-foreground hover:text-emerald-700 text-sm">GPAI Evidence Pack</a></li>
              <li><a href="/?task=art5-rail" className="text-muted-foreground hover:text-emerald-700 text-sm">Article 5 Rail</a></li>
              <li><a href="/?task=insurer-rail" className="text-muted-foreground hover:text-emerald-700 text-sm">Underwriting Evidence</a></li>
              <li><a href="/?task=vendor-dsh" className="text-muted-foreground hover:text-emerald-700 text-sm">Vendor Procurement</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 mb-4">Integrations</h3>
            <ul className="space-y-3">
              <li><a href="/?lobby=embed" className="text-muted-foreground hover:text-emerald-700 text-sm">Embed / White-label</a></li>
              <li><a href="/github-action" className="text-muted-foreground hover:text-emerald-700 text-sm">GitHub Action</a></li>
              <li><a href="https://pypi.org/project/csoai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-700 text-sm">PyPI (csoai)</a></li>
              <li><a href="https://pypi.org/project/proofof-ai-mcp/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-700 text-sm">MCP (Model Context Protocol)</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="/methodology" className="text-muted-foreground hover:text-emerald-700 text-sm">Methodology</a></li>
              <li><a href="/legal" className="text-muted-foreground hover:text-emerald-700 text-sm">Terms of Service</a></li>
              <li><a href="/privacy" className="text-muted-foreground hover:text-emerald-700 text-sm">Privacy Policy</a></li>
              <li><a href="/ai-transparency" className="text-muted-foreground hover:text-emerald-700 text-sm">AI Transparency (Art. 50)</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <p className="text-muted-foreground text-xs text-center max-w-4xl mx-auto mb-2">
            This site uses AI systems, including the Council assistant. Every AI surface is disclosed at first interaction under EU AI Act Article 50 and classified publicly on <a href="/ai-transparency" className="text-emerald-700 underline">/ai-transparency</a>.
          </p>
          <p className="text-muted-foreground text-xs text-center max-w-4xl mx-auto mb-2">
            Human oversight applies to every governed action on this platform (Article 14): measurements are machine-run, judgements are human-owned. Our public artefacts carry signed provenance.
          </p>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <p className="text-muted-foreground text-xs text-center max-w-4xl mx-auto mb-2">
            CSOAI is an independent organization with no financial ties to OpenAI, Anthropic, Google, Microsoft, Meta, or any AI vendor. Our only incentive is public safety and workforce development.
          </p>
          <p className="text-muted-foreground text-xs text-center">
            Council of AI — CSOAI Ltd, UK Companies House 16939677, London. Professional Indemnity Insurance up to £5,000,000. Contact: press@councilof.ai.
          </p>
        </div>
      </div>
    </footer>
  );
}}
"""

new_layout = re.sub(r'function Footer\(\) \{.*', footer_react, layout_content, flags=re.DOTALL)

with open('src/app/layout.tsx', 'w') as f:
    f.write(new_layout)
