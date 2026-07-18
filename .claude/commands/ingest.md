---
name: ingest
description: Ingest a file or directory into SOV3 + Hindsight for knowledge extraction
---

Ingest the specified file(s) into both SOV3 and Hindsight:

1. Read the file content
2. Extract key facts (domains, prices, dates, URLs, entities)
3. Record to SOV3 via POST localhost:3101/mcp with record_memory tool
4. Record to Hindsight via POST localhost:8765/v1/default/banks/meok-empire/memories with items format
5. Report what was extracted and stored

If a directory is given, process all .md/.py/.json/.tsx files in it.

Usage: /ingest path/to/file.md
