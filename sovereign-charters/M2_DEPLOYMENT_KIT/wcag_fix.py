#!/usr/bin/env python3
"""WCAG AA contrast fixer.
Patches the bad 'tag' selectors — color + bg were identical (1.0 ratio).
Fix: keep the bright color but use a much darker bg. E.g. #4ade8020 -> #0d1330 with border.
Honest register: only patches files in /Users/nicholas/csoai-static-deploy2/.
"""

import re
from pathlib import Path

DEPLOY = Path('/Users/nicholas/csoai-static-deploy2')

# Map: selector-regex -> (new_bg, new_border)
PATCHES = {
    r'\.tag\s*\{[^}]*\}':            ('#0d1330', 'currentColor'),
    r'\.tag-ok\s*\{[^}]*\}':         ('#0d1330', '#4ade80'),
    r'\.tag-t1\s*\{[^}]*\}':         ('#0d1330', '#4ade80'),
    r'\.tag-t2\s*\{[^}]*\}':         ('#0d1330', '#60a5fa'),
    r'\.tag-t3\s*\{[^}]*\}':         ('#0d1330', '#ffd24a'),
    r'\.tag-t4\s*\{[^}]*\}':         ('#0d1330', '#a78bfa'),
    r'\.tag-d30\s*\{[^}]*\}':        ('#0d1330', '#4ade80'),
    r'\.tag-d60\s*\{[^}]*\}':        ('#0d1330', '#60a5fa'),
    r'\.tag-d90\s*\{[^}]*\}':        ('#0d1330', '#a78bfa'),
}

# Patches for inline-style alpha backgrounds (e.g. background:#4ade8022 → background:var(--bg))
# Applied via regex on attribute values
import re as _re
INLINE_PATCHES = [
    (r'background:\s*#[0-9a-fA-F]+22;', 'background: var(--bg);'),
]

def fix_file(path):
    text = path.read_text(errors='ignore')
    original = text
    changes = 0
    for pattern, (new_bg, new_border) in PATCHES.items():
        def repl(m):
            nonlocal changes
            changes += 1
            # Replace the entire rule body
            return m.group(0).replace(
                m.group(0).split('{', 1)[1].split('}')[0],
                f' background: {new_bg}; border: 1px solid {new_border}; color: inherit; padding: 2px 8px; border-radius: 4px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; '
            )
        text = re.sub(pattern, repl, text)
    # Inline-style alpha bg fixes
    for pattern, replacement in INLINE_PATCHES:
        new_text, n = re.subn(pattern, replacement, text)
        if n > 0:
            text = new_text
            changes += n
    if text != original:
        path.write_text(text)
    return changes

def main():
    print('Patching WCAG contrast hits...')
    total = 0
    for p in sorted(DEPLOY.glob('*.html')):
        n = fix_file(p)
        if n:
            print(f'  ✓ {p.name} ({n} selectors)')
            total += n
    print(f'\nDone. {total} selectors patched across all pages.')


if __name__ == '__main__':
    main()