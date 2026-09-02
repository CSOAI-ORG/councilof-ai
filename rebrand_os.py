import sys

with open('src/app/os/page.tsx', 'r') as f:
    content = f.read()

# Base background and text
content = content.replace('bg-slate-950', 'bg-[#04120c]')
content = content.replace('bg-slate-900', 'bg-emerald-950/20')
content = content.replace('text-slate-100', 'text-white')
content = content.replace('text-slate-200', 'text-emerald-50')
content = content.replace('text-slate-300', 'text-emerald-100/80')
content = content.replace('text-slate-400', 'text-emerald-200/60')

# Borders
content = content.replace('border-slate-800', 'border-emerald-500/20')
content = content.replace('border-slate-700', 'border-emerald-500/30')

# Buttons and accents (Indigo -> Emerald)
content = content.replace('bg-indigo-600/30', 'bg-emerald-600/30')
content = content.replace('border-indigo-500/40', 'border-emerald-500/40')
content = content.replace('text-indigo-400', 'text-emerald-400')
content = content.replace('bg-indigo-500/20', 'bg-emerald-500/20')
content = content.replace('text-indigo-300', 'text-emerald-300')
content = content.replace('bg-indigo-600', 'bg-emerald-600')
content = content.replace('hover:bg-indigo-500', 'hover:bg-emerald-500')
content = content.replace('shadow-indigo-600/20', 'shadow-emerald-600/20')
content = content.replace('focus:border-indigo-500', 'focus:border-emerald-500')

# Other elements
content = content.replace('bg-slate-800', 'bg-emerald-900/30')
content = content.replace('hover:bg-slate-700', 'hover:bg-emerald-900/50')

with open('src/app/os/page.tsx', 'w') as f:
    f.write(content)
