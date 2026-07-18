#!/usr/bin/env python3
"""
Build the topology dashboard by injecting live graph data into the HTML template.

Optionally pulls live data from SOV3 to enrich the graph.

Usage:
    python3 build.py              # Build with static graph data
    python3 build.py --live       # Pull live stats from SOV3
    python3 build.py --serve      # Build and serve locally on :8888
"""
import json
import os
import sys
import http.server
import socketserver

GRAPH_PATH = os.path.join(os.path.dirname(__file__), "..", "_TOPOLOGY", "live_graph.json")
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "index.html")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "dist", "index.html")
SOV3_URL = os.environ.get("SOV3_URL", "http://localhost:3101")


def load_graph():
    """Load the topology graph data."""
    with open(GRAPH_PATH) as f:
        return json.load(f)


def enrich_with_sov3(graph_data):
    """Pull live stats from SOV3 to update node data."""
    import requests
    try:
        r = requests.get(f"{SOV3_URL}/health", timeout=5)
        health = r.json()

        # Update SOV3 node
        for node in graph_data["nodes"]:
            if node["name"] == "SOV3":
                cons = health.get("components", {}).get("consciousness", {})
                node["consciousness_level"] = cons.get("consciousness_level", 0)
                node["emotional_state"] = cons.get("emotional_summary", {}).get("trend", "unknown")
                node["reflections"] = cons.get("reflections", 0)
                node["dreams"] = cons.get("dreams", 0)
                break

        # Get memory count
        r2 = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0",
            "method": "tools/call",
            "id": "build-stats",
            "params": {
                "name": "get_memory_stats",
                "arguments": {}
            }
        }, timeout=10)
        stats = r2.json()
        result = stats.get("result", {})
        if isinstance(result, dict):
            content = result.get("content", [{}])
            if isinstance(content, list) and content:
                text = content[0].get("text", "{}")
                mem_stats = json.loads(text)
                for node in graph_data["nodes"]:
                    if node["name"] == "SOV3":
                        node["memories"] = mem_stats.get("total_episodes", 5427)
                        break

        print(f"  SOV3 enrichment: OK")
    except Exception as e:
        print(f"  SOV3 enrichment skipped: {e}")

    return graph_data


def build():
    """Build the dashboard HTML with injected data."""
    graph_data = load_graph()

    if "--live" in sys.argv:
        graph_data = enrich_with_sov3(graph_data)

    # Read template
    with open(TEMPLATE_PATH) as f:
        html = f.read()

    # Inject graph data
    graph_json = json.dumps(graph_data, indent=2)
    html = html.replace("TOPOLOGY_DATA_PLACEHOLDER", graph_json)

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        f.write(html)

    print(f"  Built: {OUTPUT_PATH}")
    print(f"  Nodes: {len(graph_data['nodes'])}")
    print(f"  Edges: {len(graph_data['edges'])}")
    return OUTPUT_PATH


if __name__ == "__main__":
    output = build()

    if "--serve" in sys.argv:
        port = 8888
        dist_dir = os.path.dirname(output)
        os.chdir(dist_dir)
        handler = http.server.SimpleHTTPRequestHandler
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"\n  Serving at http://localhost:{port}")
            print(f"  Ctrl+C to stop")
            httpd.serve_forever()
