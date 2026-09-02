import sys

with open('src/app/layout.tsx', 'r') as f:
    content = f.read()

font_links = """    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="/csoai-icon.svg" />
      </head>
      <body"""

content = content.replace('    <html lang="en">\n      <body', font_links)

with open('src/app/layout.tsx', 'w') as f:
    f.write(content)
