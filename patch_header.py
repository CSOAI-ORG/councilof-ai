import sys

with open("client/src/components/Header.tsx", "r") as f:
    content = f.read()

# Replace mobile a tags
content = content.replace(
"""                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {subItem.description}
                                </div>
                              </a>""", 
"""                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {subItem.description}
                                </div>
                              </Link>"""
)

content = content.replace(
"""                              <a
                                href={subItem.href}
                                target={subItem.external ? '_blank' : undefined}
                                rel={subItem.external ? 'noreferrer' : undefined}""",
"""                              <Link
                                href={subItem.href}
                                target={subItem.external ? '_blank' : undefined}
                                rel={subItem.external ? 'noreferrer' : undefined}"""
)

# Replace view all a tags
content = content.replace(
"""                          <a
                            href={item.href}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            onClick={() => setActiveDropdown(null)}
                          >
                            View all {item.name.toLowerCase()} &rarr;
                          </a>""",
"""                          <Link
                            href={item.href}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            onClick={() => setActiveDropdown(null)}
                          >
                            View all {item.name.toLowerCase()} &rarr;
                          </Link>"""
)

with open("client/src/components/Header.tsx", "w") as f:
    f.write(content)
