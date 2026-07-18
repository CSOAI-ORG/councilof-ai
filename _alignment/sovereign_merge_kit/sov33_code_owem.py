#!/usr/bin/env python3
"""
sov33_code_owem.py — Specialized code generation OWEM.

Builds on the existing OWEMEngine with code-specific prompts:
  - System prompt tuned for code generation
  - Language detection (Python, JS, Rust, etc.)
  - Care-floor veto on unsafe patterns (eval, exec, os.system)
  - Returns SIGIL-signed code blocks
"""
import sys, os, json, re, hashlib
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

UNSAFE_PATTERNS = [
    r'\beval\s*\(',
    r'\bexec\s*\(',
    r'\bos\.system\s*\(',
    r'\bsubprocess\.call\s*\(',
    r'\bos\.remove\s*\(',
    r'\bos\.unlink\s*\(',
    r'\brm\s+-rf',
    r'\bshutil\.rmtree\s*\(',
]


def detect_language(query: str) -> str:
    """Detect programming language from query."""
    q = query.lower()
    if any(k in q for k in ['python', 'django', 'flask', 'pandas', 'numpy', 'pip']):
        return 'python'
    if any(k in q for k in ['javascript', 'js', 'react', 'node', 'npm', 'vue']):
        return 'javascript'
    if any(k in q for k in ['rust', 'cargo']):
        return 'rust'
    if any(k in q for k in ['go ', 'golang']):
        return 'go'
    if any(k in q for k in ['sql', 'select', 'from ', 'where']):
        return 'sql'
    if any(k in q for k in ['html', 'css', 'webpage', 'website']):
        return 'html'
    return 'unknown'


def extract_code_blocks(text: str) -> list:
    """Extract code blocks from markdown-style response."""
    return re.findall(r'```(\w+)?\n(.*?)```', text, re.DOTALL)


def is_unsafe(code: str) -> list:
    """Check for unsafe patterns. Returns list of violations."""
    violations = []
    for pattern in UNSAFE_PATTERNS:
        if re.search(pattern, code):
            violations.append(pattern)
    return violations


def sov33_code_owem(query: str, engine) -> dict:
    """Generate code using SOV33 with safety checks."""
    language = detect_language(query)

    # Build code-specific system prompt
    system_prompt = f"""You are SOV33-CODE. Generate SAFE, IDIOMATIC {language} code.
- Add comments explaining each section
- Handle errors gracefully
- Never use eval/exec/os.system/unrestricted subprocess
- Prefer stdlib over external dependencies
- Include a quick test or example usage

User request: {query}"""

    try:
        result = engine.ask('general', system_prompt, max_tokens=500)
        text = result.get('text', '')
        sigil = result.get('sigil', '')
    except Exception as e:
        return {'error': str(e), 'language': language}

    blocks = extract_code_blocks(text)
    if blocks:
        code = blocks[0][1]
        block_lang = blocks[0][0] or language
        unsafe = is_unsafe(code)
    else:
        code = text
        block_lang = language
        unsafe = []

    care_floor_passed = len(unsafe) == 0

    return {
        'language': block_lang,
        'code': code[:5000],  # cap
        'unsafe_violations': unsafe,
        'care_floor_passed': care_floor_passed,
        'vetos_applied': unsafe,
        'sigil': sigil,
        'raw_response': text[:2000],
        'ts': datetime.now(timezone.utc).isoformat(),
    }


if __name__ == '__main__':
    # Demo
    print("Code OWEM demo (no engine call, just structure):")
    print(f"  detect_language('write a python function') = {detect_language('write a python function')}")
    print(f"  is_unsafe('eval(input())') = {is_unsafe('eval(input())')}")
    print(f"  is_unsafe('print(1+1)') = {is_unsafe('print(1+1)')}")
