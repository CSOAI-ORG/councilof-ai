import sys

with open('src/app/catalogue/page.tsx', 'r') as f:
    content = f.read()

# Replace slate background colors with semantic variables
content = content.replace('bg-slate-950', 'bg-accent/30')
content = content.replace('border-slate-900', 'border-border')
content = content.replace('text-white', 'text-foreground')
content = content.replace('text-slate-400', 'text-muted-foreground')
content = content.replace('text-slate-500', 'text-muted-foreground/70')
content = content.replace('text-slate-200', 'text-foreground')
content = content.replace('text-slate-300', 'text-foreground/80')

content = content.replace('bg-slate-900/50', 'bg-card')
content = content.replace('border-slate-800', 'border-border')
content = content.replace('border-slate-700', 'border-border/60')
content = content.replace('bg-slate-800', 'bg-muted')
content = content.replace('hover:bg-slate-700', 'hover:bg-muted/80')

with open('src/app/catalogue/page.tsx', 'w') as f:
    f.write(content)
