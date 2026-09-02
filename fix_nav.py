import sys

with open('src/app/components/Navigation.tsx', 'r') as f:
    content = f.read()

# Replace evaluate link with catalogue
content = content.replace(
    '<a href="/evaluate" className="text-muted-foreground hover:text-foreground transition-colors">Evaluate</a>',
    '<a href="/catalogue" className="text-muted-foreground hover:text-foreground transition-colors">Agent Catalogue</a>'
)

with open('src/app/components/Navigation.tsx', 'w') as f:
    f.write(content)
