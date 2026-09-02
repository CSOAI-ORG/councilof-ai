import sys

with open('src/app/components/Navigation.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<Link href="/os" className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Council OS <ChevronDown className="h-3.5 w-3.5" />\n              </Link>',
    '<Link href="/os" className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Council OS\n              </Link>'
)

with open('src/app/components/Navigation.tsx', 'w') as f:
    f.write(content)
