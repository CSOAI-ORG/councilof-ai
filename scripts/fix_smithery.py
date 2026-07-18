import os, sys, yaml

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")

import json
with open(MANIFEST_PATH, "r") as f:
    manifest = json.load(f)

servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]

updated = 0
for server in servers:
    name = server["name"]
    smithery_path = os.path.join(BASE_DIR, "mcp-marketplace", name, "smithery.yaml")
    if os.path.exists(smithery_path):
        with open(smithery_path, "r") as f:
            data = yaml.safe_load(f)
        
        if "startCommand" not in data:
            # Depending on how it's executed. Wait, care-membrane-mcp entry point is "care_membrane_mcp = server:main"
            # So the command is the module name derived from the package name.
            package_name = name.replace("-mcp", "").replace("-", "_") + "_mcp"
            # Actually, most of them just use the package name directly if installed.
            # But the user's pyproject.toml defines project.scripts
            # Let's read pyproject.toml
            pyproject_path = os.path.join(BASE_DIR, "mcp-marketplace", name, "pyproject.toml")
            cmd_name = package_name
            if os.path.exists(pyproject_path):
                import configparser
                # Python 3.11+ has tomllib, 3.9 might not.
                with open(pyproject_path, "r") as pf:
                    content = pf.read()
                    import re
                    match = re.search(r'\[project\.scripts\]\n(.*?) =', content)
                    if match:
                        cmd_name = match.group(1).strip()
            
            data["startCommand"] = {
                "type": "stdio",
                "configSchema": {
                    "type": "object",
                    "required": ["apiKey"],
                    "properties": {
                        "apiKey": {
                            "type": "string",
                            "description": "Your MEOK API Key"
                        }
                    }
                },
                "commandFunction": f"(config) => ({{\n  command: 'uvx',\n  args: ['{name}', '--api-key', config.apiKey],\n  env: {{\n    MEOK_API_KEY: config.apiKey\n  }}\n}})"
            }
            with open(smithery_path, "w") as f:
                yaml.dump(data, f, sort_keys=False)
            updated += 1

print(f"Updated {updated} smithery.yaml files.")
