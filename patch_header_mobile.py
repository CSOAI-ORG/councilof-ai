import sys

with open("client/src/components/Header.tsx", "r") as f:
    content = f.read()

# Replace mobile root a tags
content = content.replace(
"""                  <a
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                      isActive(item.href) ? 'text-emerald-700 bg-emerald-50' : 'text-foreground/80'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 text-emerald-600" />
                    {item.name}
                  </a>""",
"""                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                      isActive(item.href) ? 'text-emerald-700 bg-emerald-50' : 'text-foreground/80'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 text-emerald-600" />
                    {item.name}
                  </Link>"""
)

content = content.replace(
"""                          <a
                          href={subItem.href}
                          target={subItem.external ? '_blank' : undefined}
                          rel={subItem.external ? 'noreferrer' : undefined}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subItem.name}
                          {subItem.external && <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">JSON</span>}
                        </a>""",
"""                          <Link
                          href={subItem.href}
                          target={subItem.external ? '_blank' : undefined}
                          rel={subItem.external ? 'noreferrer' : undefined}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subItem.name}
                          {subItem.external && <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">JSON</span>}
                        </Link>"""
)

with open("client/src/components/Header.tsx", "w") as f:
    f.write(content)
