#!/usr/bin/env python3
"""Patch VM SOV3 Hermes (hermes_ask + hermes_research) to use local Ollama instead
of the dead OpenAI key. Backs up + syntax-checks before writing. Run ON the VM:
    scp ~/clawd/patch_hermes_local.py meok-backend:/tmp/
    ssh meok-backend 'python3 /tmp/patch_hermes_local.py && sudo systemctl restart sov3'
Rollback: the .bak-hermes-local-* file it prints.
"""
import re, time, shutil, py_compile, sys

F = "/data/sov3/sovereign-mcp-server.py"
src = open(F).read()
bak = F + ".bak-hermes-local-" + time.strftime("%Y%m%d-%H%M%S")
shutil.copy(F, bak)


def block(timeout, var, content):
    return (
        '                payload = {\n'
        '                    "model": os.environ.get("HERMES_MODEL", "qwen2.5:3b"),\n'
        '                    "stream": False,\n'
        '                    "messages": [{"role": "user", "content": %s}]\n'
        '                }\n'
        '                # Cloud-free: VM-local Ollama (OpenAI key dead 2026-06-16).\n'
        '                resp = requests.post(\n'
        '                    os.environ.get("OLLAMA_HOST", "http://localhost:11434") + "/api/chat",\n'
        '                    json=payload,\n'
        '                    timeout=%d\n'
        '                )\n'
        '                resp.raise_for_status()\n'
        '                data = resp.json()\n'
        '                %s = data.get("message", {}).get("content", "")\n' % (content, timeout, var)
    )


ask = re.search(r'                payload = \{\n                    "model": "gpt-4o-mini",\n                    "max_tokens": 1024,\n.*?response_text = data\["choices"\]\[0\]\["message"\]\["content"\]\n', src, re.S)
res = re.search(r'                payload = \{\n                    "model": "gpt-4o-mini",\n                    "max_tokens": 2048,\n.*?research_text = data\["choices"\]\[0\]\["message"\]\["content"\]\n', src, re.S)

n = 0
if ask:
    src = src.replace(ask.group(0), block(120, "response_text", "prompt")); n += 1
if res:
    src = src.replace(res.group(0), block(180, "research_text", 'f"Research this and give a concise answer: {query}"')); n += 1

open(F, "w").write(src)
print(f"patched {n}/2 hermes handlers · backup={bak}")
try:
    py_compile.compile(F, doraise=True)
    print("SYNTAX OK — now: sudo systemctl restart sov3")
except Exception as e:
    shutil.copy(bak, F)
    print("SYNTAX FAIL — restored from backup:", e); sys.exit(1)
