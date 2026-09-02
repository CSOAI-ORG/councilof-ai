import sys

with open('src/app/components/Navigation.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Measure <ChevronDown className="h-3.5 w-3.5" />\n              </button>',
    '<Link href="/leaderboard" className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Measure\n              </Link>'
)

content = content.replace(
    '<button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Products <ChevronDown className="h-3.5 w-3.5" />\n              </button>',
    '<Link href="/catalogue" className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Products\n              </Link>'
)

content = content.replace(
    '<button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Regulation <ChevronDown className="h-3.5 w-3.5" />\n              </button>',
    '<Link href="/gpai" className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Regulation\n              </Link>'
)

content = content.replace(
    '<button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Evidence <ChevronDown className="h-3.5 w-3.5" />\n              </button>',
    '<Link href="/verify" className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Evidence\n              </Link>'
)

content = content.replace(
    '<button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Company <ChevronDown className="h-3.5 w-3.5" />\n              </button>',
    '<Link href="/methodology" className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">\n                Company\n              </Link>'
)

with open('src/app/components/Navigation.tsx', 'w') as f:
    f.write(content)
