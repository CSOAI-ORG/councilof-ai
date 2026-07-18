#!/usr/bin/env python3
"""WCAG AA contrast audit on all deployed HTML pages.
Reads every .html in /Users/nicholas/csoai-static-deploy2/, parses inline style + CSS,
flags any color combination that fails AA (4.5:1 for normal text, 3:1 for large).
Outputs: wcag_audit_2026-07-13.json
"""

import json
import re
from pathlib import Path

DEPLOY = Path('/Users/nicholas/csoai-static-deploy2')

def hex_to_rgb(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c*2 for c in h)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def luminance(rgb):
    def chan(c):
        c /= 255
        return c/12.92 if c <= 0.03928 else ((c + 0.055)/1.055) ** 2.4
    r, g, b = (chan(c) for c in rgb)
    return 0.2126*r + 0.7152*g + 0.0722*b

def contrast(fg, bg):
    l1, l2 = luminance(hex_to_rgb(fg)), luminance(hex_to_rgb(bg))
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

# Common color pairs in the CSOAI style blocks
PAIRS = [
    # (fg, bg, label)
    ('#e8eefc', '#050816', 'fg on bg'),
    ('#8a93b8', '#050816', 'mut on bg'),
    ('#8a93b8', '#0d1330', 'mut on panel'),
    ('#e8eefc', '#0d1330', 'fg on panel'),
    ('#6dd5ff', '#050816', 'sovereign on bg'),
    ('#6dd5ff', '#0d1330', 'sovereign on panel'),
    ('#d4af37', '#050816', 'gold on bg'),
    ('#d4af37', '#0d1330', 'gold on panel'),
    ('#4ade80', '#050816', 'care on bg'),
    ('#fbbf24', '#050816', 'warn on bg'),
    ('#f87171', '#050816', 'bad on bg'),
    ('#0b1020', '#d4af37', 'ink on gold'),
    ('#0b1020', '#4ade80', 'ink on care'),
]

def audit_page(path):
    text = path.read_text(errors='ignore')
    hits = []
    # Inline style attribute
    for m in re.finditer(r'style\s*=\s*"([^"]+)"', text):
        s = m.group(1)
        fg_match = re.search(r'color\s*:\s*(#[0-9a-fA-F]+)', s)
        bg_match = re.search(r'background(?:-color)?\s*:\s*(#[0-9a-fA-F]+)', s)
        if fg_match and bg_match:
            try:
                ratio = contrast(fg_match.group(1), bg_match.group(1))
                if ratio < 4.5:
                    hits.append({'fg': fg_match.group(1), 'bg': bg_match.group(1), 'ratio': round(ratio, 2), 'inline': s[:80]})
            except Exception:
                pass
    # CSS block (basic)
    css_blocks = re.findall(r'<style[^>]*>(.*?)</style>', text, re.DOTALL)
    for css in css_blocks:
        # find color + background pairs within selectors
        for sel_match in re.finditer(r'([^{}]+)\{([^{}]+)\}', css):
            sel = sel_match.group(1).strip()
            body = sel_match.group(2)
            fg = re.search(r'(?<![a-z\-])color\s*:\s*(#[0-9a-fA-F]+)', body)
            bg = re.search(r'background(?:-color)?\s*:\s*(#[0-9a-fA-F]+)', body)
            if fg and bg:
                try:
                    ratio = contrast(fg.group(1), bg.group(1))
                    if ratio < 4.5:
                        hits.append({'fg': fg.group(1), 'bg': bg.group(1), 'ratio': round(ratio, 2), 'selector': sel[:60]})
                except Exception:
                    pass
    return hits

def main():
    report = {'pairs': [], 'pages': {}}
    for fg, bg, label in PAIRS:
        try:
            r = round(contrast(fg, bg), 2)
            report['pairs'].append({'fg': fg, 'bg': bg, 'label': label, 'ratio': r, 'aa_pass': r >= 4.5})
        except Exception:
            pass

    pages = sorted(DEPLOY.glob('*.html'))
    print(f'Auditing {len(pages)} HTML pages...')
    total_hits = 0
    worst = []
    for p in pages:
        hits = audit_page(p)
        if hits:
            report['pages'][p.name] = {'hits': hits[:10], 'count': len(hits)}
            total_hits += len(hits)
            worst.append((p.name, len(hits)))

    report['summary'] = {
        'pages_audited': len(pages),
        'total_hits': total_hits,
        'pages_with_hits': len(report['pages']),
        'worst_pages': sorted(worst, key=lambda x: -x[1])[:10]
    }
    out = DEPLOY / 'wcag_audit_2026-07-13.json'
    out.write_text(json.dumps(report, indent=2))
    print(f'  Pages: {len(pages)}')
    print(f'  Total contrast hits: {total_hits}')
    print(f'  Pages with hits: {len(report["pages"])}')
    print(f'  Worst pages: {report["summary"]["worst_pages"][:5]}')
    print(f'  Saved: {out}')


if __name__ == '__main__':
    main()