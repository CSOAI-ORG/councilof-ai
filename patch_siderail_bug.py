import sys
import re

with open("client/src/components/lobby/LobbySideRail.tsx", "r") as f:
    content = f.read()

# Add useEffect import if not present
if "useEffect" not in content:
    content = content.replace("import { useRef, useState } from \"react\";", "import { useRef, useState, useEffect } from \"react\";")

# Add the effect
effect_code = """
  // Auto-switch to the Agent Console (Ask) when a chat starts or becomes busy
  useEffect(() => {
    if (chat.busy || chat.turnCount > 0) {
      setSection("ask");
    }
  }, [chat.busy, chat.turnCount]);
"""
content = content.replace("const listRef = useRef<HTMLDivElement>(null);", "const listRef = useRef<HTMLDivElement>(null);\n" + effect_code)

with open("client/src/components/lobby/LobbySideRail.tsx", "w") as f:
    f.write(content)
