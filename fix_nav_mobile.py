import sys

with open('src/app/components/Navigation.tsx', 'r') as f:
    content = f.read()

# Add a state for mobile menu
content = content.replace(
    'import { Shield, Cpu, ExternalLink, LayoutDashboard } from \'lucide-react\';',
    'import { Shield, Cpu, ExternalLink, LayoutDashboard, Menu, X } from \'lucide-react\';\nimport { useState } from \'react\';'
)

content = content.replace(
    'export function Navigation() {\n  const { user } = useAuth();',
    'export function Navigation() {\n  const { user } = useAuth();\n  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);'
)

# Replace the closing div of the header with the mobile menu container
closing_tags = """        </div>
      </div>
    </header>"""

mobile_menu = """        
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-foreground p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <a href="/leaderboard" className="block px-3 py-3 rounded-md text-base font-bold text-red-500 hover:bg-muted">Live Leaderboards</a>
            <a href="/os" className="block px-3 py-3 rounded-md text-base font-semibold text-brand-500 hover:bg-muted">Council OS</a>
            <a href="/simulator" className="block px-3 py-3 rounded-md text-base font-semibold text-brand-500 hover:bg-muted">Simulator</a>
            <a href="/catalogue" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Agent Catalogue</a>
            <a href="/verify" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Verify</a>
            <a href="/assess" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Assessment</a>
            <a href="/developers" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Developers</a>
            <a href="/pricing" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Pricing</a>
          </div>
        </div>
      )}
    </header>"""

content = content.replace(closing_tags, mobile_menu)

with open('src/app/components/Navigation.tsx', 'w') as f:
    f.write(content)
