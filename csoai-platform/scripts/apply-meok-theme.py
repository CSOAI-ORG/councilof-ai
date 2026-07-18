#!/usr/bin/env python3
"""
Apply MEOK.AI warm sovereign palette to selected csoai-platform TSX pages.
Maps common Tailwind color classes to theme-compatible equivalents.
"""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "client" / "src"

# File paths relative to client/src
TARGETS = [
    "pages/NewHome-v2.tsx",
    "pages/AgentCouncil.tsx",
    "pages/Dashboard.tsx",
    "pages/Landing.tsx",
    "pages/MarketingHome.tsx",
    "pages/PublicHome.tsx",
    "pages/Signup.tsx",
    "pages/Login.tsx",
    "pages/Protocol0.tsx",
]

# Ordered replacements (longer/more specific first)
REPLACEMENTS = [
    # Gradients
    (r'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900', 'meok-gradient'),
    (r'bg-gradient-to-b from-slate-900 to-slate-800', 'meok-gradient'),
    (r'bg-gradient-to-b from-gray-50 to-white', 'bg-background'),
    (r'bg-gradient-to-r from-emerald-50 to-blue-50', 'bg-muted/40'),
    (r'from-emerald-400 via-green-400 to-teal-400', 'from-[#C8A873] via-[#D98C7E] to-[#7D8C7E]'),

    # Greys
    (r'\btext-gray-900\b', 'text-foreground'),
    (r'\btext-gray-800\b', 'text-foreground'),
    (r'\btext-gray-700\b', 'text-foreground'),
    (r'\btext-gray-600\b', 'text-muted-foreground'),
    (r'\btext-gray-500\b', 'text-muted-foreground'),
    (r'\btext-gray-400\b', 'text-muted-foreground'),
    (r'\btext-gray-300\b', 'text-muted-foreground'),
    (r'\bbg-gray-50\b', 'bg-muted'),
    (r'\bbg-gray-100\b', 'bg-muted'),
    (r'\bbg-gray-200\b', 'bg-muted'),
    (r'\bborder-gray-200\b', 'border-border'),
    (r'\bborder-gray-300\b', 'border-border'),

    # White
    (r'\bbg-white/5\b', 'bg-card/40'),
    (r'\bbg-white/10\b', 'bg-card/60'),
    (r'\bbg-white/20\b', 'bg-card/70'),
    (r'\bbg-white\b', 'bg-card'),
    (r'\bborder-white/10\b', 'border-border'),
    (r'\bborder-white/20\b', 'border-border'),

    # Emerald / green -> primary (sage)
    (r'\bbg-emerald-500/20\b', 'bg-primary/20'),
    (r'\bbg-emerald-500/10\b', 'bg-primary/10'),
    (r'\bbg-emerald-100\b', 'bg-primary/10'),
    (r'\bbg-emerald-50/50\b', 'bg-primary/5'),
    (r'\bbg-emerald-50\b', 'bg-primary/5'),
    (r'\bbg-emerald-600\b', 'bg-primary'),
    (r'\bbg-emerald-700\b', 'bg-primary'),
    (r'\bbg-green-100\b', 'bg-primary/10'),
    (r'\bbg-green-600\b', 'bg-primary'),
    (r'\bborder-emerald-200\b', 'border-primary/20'),
    (r'\bborder-emerald-400/30\b', 'border-primary/30'),
    (r'\bborder-emerald-500/30\b', 'border-primary/30'),
    (r'\btext-emerald-300\b', 'text-primary'),
    (r'\btext-emerald-400\b', 'text-primary'),
    (r'\btext-emerald-500\b', 'text-primary'),
    (r'\btext-emerald-600\b', 'text-primary'),
    (r'\btext-emerald-700\b', 'text-primary'),
    (r'\btext-emerald-800\b', 'text-primary'),
    (r'\btext-green-600\b', 'text-primary'),
    (r'\bshadow-emerald-500/25\b', 'shadow-primary/25'),
    (r'\bshadow-emerald-500/30\b', 'shadow-primary/30'),

    # Amber -> gold
    (r'\bbg-amber-500/20\b', 'bg-[#C8A873]/20'),
    (r'\bbg-amber-100\b', 'bg-[#C8A873]/10'),
    (r'\bborder-amber-400/30\b', 'border-[#C8A873]/30'),
    (r'\bborder-amber-500/30\b', 'border-[#C8A873]/30'),
    (r'\btext-amber-300\b', 'text-[#C8A873]'),
    (r'\btext-amber-400\b', 'text-[#C8A873]'),
    (r'\btext-amber-500\b', 'text-[#C8A873]'),
    (r'\btext-amber-600\b', 'text-[#C8A873]'),

    # Red -> destructive
    (r'\bbg-red-500/20\b', 'bg-destructive/20'),
    (r'\bbg-red-100\b', 'bg-destructive/10'),
    (r'\bbg-red-50/50\b', 'bg-destructive/5'),
    (r'\bbg-red-50\b', 'bg-destructive/5'),
    (r'\bborder-red-200\b', 'border-destructive/20'),
    (r'\bborder-red-500/30\b', 'border-destructive/30'),
    (r'\btext-red-300\b', 'text-destructive'),
    (r'\btext-red-400\b', 'text-destructive'),
    (r'\btext-red-500\b', 'text-destructive'),
    (r'\btext-red-600\b', 'text-destructive'),
    (r'\btext-red-700\b', 'text-destructive'),
    (r'\btext-red-800\b', 'text-destructive'),
    (r'\btext-red-900\b', 'text-destructive'),

    # Blue -> lavender
    (r'\bbg-blue-500/10\b', 'bg-[#9CA6C9]/10'),
    (r'\bbg-blue-50\b', 'bg-[#9CA6C9]/5'),
    (r'\bborder-blue-200\b', 'border-[#9CA6C9]/20'),
    (r'\bborder-blue-400/30\b', 'border-[#9CA6C9]/30'),
    (r'\bborder-blue-500/30\b', 'border-[#9CA6C9]/30'),
    (r'\btext-blue-300\b', 'text-[#9CA6C9]'),
    (r'\btext-blue-400\b', 'text-[#9CA6C9]'),
    (r'\btext-blue-500\b', 'text-[#9CA6C9]'),
    (r'\btext-blue-600\b', 'text-[#9CA6C9]'),

    # Purple -> lavender
    (r'\bbg-purple-500/10\b', 'bg-[#9CA6C9]/10'),
    (r'\bbg-purple-50\b', 'bg-[#9CA6C9]/5'),
    (r'\bborder-purple-200\b', 'border-[#9CA6C9]/20'),
    (r'\bborder-purple-400/30\b', 'border-[#9CA6C9]/30'),
    (r'\bborder-purple-500/30\b', 'border-[#9CA6C9]/30'),
    (r'\btext-purple-300\b', 'text-[#9CA6C9]'),
    (r'\btext-purple-400\b', 'text-[#9CA6C9]'),
    (r'\btext-purple-500\b', 'text-[#9CA6C9]'),
    (r'\btext-purple-600\b', 'text-[#9CA6C9]'),

    # Indigo -> lavender
    (r'\bbg-indigo-50\b', 'bg-[#9CA6C9]/5'),
    (r'\bborder-indigo-200\b', 'border-[#9CA6C9]/20'),
    (r'\btext-indigo-500\b', 'text-[#9CA6C9]'),
    (r'\btext-indigo-600\b', 'text-[#9CA6C9]'),

    # Teal -> primary
    (r'\bbg-teal-50\b', 'bg-primary/5'),
    (r'\bborder-teal-200\b', 'border-primary/20'),
    (r'\btext-teal-500\b', 'text-primary'),
    (r'\btext-teal-600\b', 'text-primary'),

    # Pink -> coral
    (r'\bbg-pink-50\b', 'bg-[#D98C7E]/5'),
    (r'\bborder-pink-200\b', 'border-[#D98C7E]/20'),
    (r'\btext-pink-500\b', 'text-[#D98C7E]'),
    (r'\btext-pink-600\b', 'text-[#D98C7E]'),
]


def process_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    original = text
    for pattern, repl in REPLACEMENTS:
        text = re.sub(pattern, repl, text)
    if text != original:
        path.write_text(text, encoding="utf-8")
        print(f"Updated {path.relative_to(ROOT)}")
    else:
        print(f"No changes {path.relative_to(ROOT)}")


def main() -> int:
    for rel in TARGETS:
        path = SRC / rel
        if not path.exists():
            print(f"Skip {rel}: not found")
            continue
        process_file(path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
