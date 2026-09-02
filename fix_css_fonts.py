import sys

with open('src/app/globals.css', 'r') as f:
    content = f.read()

content = content.replace(
    '--font-sans: var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif);',
    '--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;\n  --font-heading: "Archivo", var(--font-sans);\n  --font-serif: "Source Serif 4", ui-serif, Georgia, serif;'
)

with open('src/app/globals.css', 'w') as f:
    f.write(content)
