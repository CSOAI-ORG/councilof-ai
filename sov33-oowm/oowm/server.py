"""SOV3³ OOWM MCP Server — local stdio MCP exposing the knowledge graph + brains + bridges."""
import sys, json
sys.path.insert(0, '.')
from oowm.knowledge import OOWMIndex
from oowm.brains import BRAINS, list_brains, get_brain
from oowm.bridges import BRIDGES, list_bridges, get_bridge

# Bootstrap a tiny in-memory index for the demo
INDEX = OOWMIndex()
SEED = [
    ("/crown_jewels/temm1e", "crown_jewels", "TEMM1E autonomous agent Rust 160K lines 2889 tests OOWM sovereign"),
    ("/crown_jewels/agent-village", "crown_jewels", "Agent village civilization simulation 47 agents economy democracy crime art"),
    ("/crown_jewels/acgs-lite", "crown_jewels", "ACGS-Lite constitutional AI governance Ed25519 receipts attestation"),
    ("/black_swan/firefox-os", "black_swan", "Firefox OS abandoned by Mozilla HTML5 mobile operating system sovereign alternative"),
    ("/black_swan/ghidra", "black_swan", "Ghidra NSA reverse engineering framework $50M sovereign audit tool"),
    ("/visual_maps/flower-of-life", "visual_maps", "Flower of life sacred geometry 19 circles hexagonal 12 civilizations base grid"),
    ("/visual_maps/ziggurat-of-ur", "visual_maps", "Ziggurat of Ur 2113 BCE Sumer 3-tier stepped pyramid Circuit Pyramid prototype"),
    ("/social/telegram", "social_legacy", "Telegram free messaging 900M users sovereign bridge MTProto"),
    ("/social/discord", "social_legacy", "Discord free chat platform communities sovereign voice video"),
    ("/social/whatsapp", "social_legacy", "WhatsApp free messaging 2B users sovereign Signal protocol"),
    ("/brain/king", "brains", "King M4 dragon persona temp 0.9 Mamba-2 SSD Kimi 2.7 Claude Opus 4.8 aggressive sovereign"),
    ("/brain/queen", "brains", "Queen M2 turtle persona temp 0.3 conservative compliance governor all local"),
    ("/brain/oowm", "brains", "OOWM Organic Open World Model apex trained on 15y marketing 25 domains personal mythology Horus feeds"),
    ("/brain/mom", "brains", "MOM Maternal Operating Model guardian 24/7 family safety children protection elder care scam detection 6 care dimensions"),
    ("/strategy/david-vs-goliath", "strategy", "7 sweet plays vs Google Willow sovereign vs centralized post-quantum ready MCP marketplace data moat 530 builders 53 platforms ONE OS"),
    ("/governance/map", "governance", "AI governance map 15 frameworks EU AI Act NIST RMF ISO 42001 GDPR HIPAA DORA CRA TC260 PIPL 28 hives sovereign"),
    ("/treasure/catalog", "treasure", "100 billion dollar treasure catalog Common Crawl 100PB Sentinel 81PB NOAA 37PB CERN 2.4PB NIH All of Us UK Biobank ESA Gaia World Bank"),
]
for path, source, text in SEED:
    INDEX.add_doc(path, source, text)
INDEX.build_tfidf()

def rpc_result(id_, result):
    return {"jsonrpc":"2.0","id":id_,"result":result}

def rpc_error(id_, code, msg):
    return {"jsonrpc":"2.0","id":id_,"error":{"code":code,"message":msg}}

TOOLS = [
    {"name":"query_oowm","description":"Query the Organic Open World Model knowledge graph","inputSchema":{"type":"object","properties":{"query":{"type":"string"},"brain":{"type":"string","enum":["quant","man","auto"]},"max_results":{"type":"integer","default":5}},"required":["query"]}},
    {"name":"list_domains","description":"List all knowledge domains in OOWM","inputSchema":{"type":"object"}},
    {"name":"list_brains","description":"List 12 sovereign brain configurations","inputSchema":{"type":"object"}},
    {"name":"get_brain","description":"Get brain config by name","inputSchema":{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}},
    {"name":"list_bridges","description":"List 8 consolidation bridges","inputSchema":{"type":"object"}},
    {"name":"get_bridge","description":"Get bridge config by name","inputSchema":{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}},
    {"name":"oowm_stats","description":"OOWM knowledge index statistics","inputSchema":{"type":"object"}},
]

def handle(id_, method, params):
    if method == "tools/list":
        return rpc_result(id_, {"tools": TOOLS})
    if method != "tools/call":
        return rpc_error(id_, -32601, f"Method {method} not found")
    name = params.get("name")
    args = params.get("arguments", {})
    if name == "query_oowm":
        results = INDEX.query(args.get("query",""), args.get("brain","auto"), args.get("max_results",5))
        return rpc_result(id_, {"content":[{"type":"text","text":json.dumps({"results":results,"count":len(results)})}]})
    if name == "list_domains":
        domains = sorted(set(d["source"] for d in INDEX.docs))
        return rpc_result(id_, {"content":[{"type":"text","text":json.dumps({"domains":domains,"count":len(domains)})}]})
    if name == "list_brains":
        return rpc_result(id_, {"content":[{"type":"text","text":json.dumps({"brains":list_brains(),"configs":BRAINS})}]})
    if name == "get_brain":
        b = get_brain(args.get("name",""))
        return rpc_result(id_, {"content":[{"type":"text","text":json.dumps({"brain":args.get("name"),"config":b})}]})
    if name == "list_bridges":
        return rpc_result(id_, {"content":[{"type":"text","text":json.dumps({"bridges":list_bridges(),"configs":BRIDGES})}]})
    if name == "get_bridge":
        b = get_bridge(args.get("name",""))
        return rpc_result(id_, {"content":[{"type":"text","text":json.dumps({"bridge":args.get("name"),"config":b})}]})
    if name == "oowm_stats":
        return rpc_result(id_, {"content":[{"type":"text","text":json.dumps(INDEX.stats())}]})
    return rpc_error(id_, -32602, f"Unknown tool: {name}")

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line: continue
        try: msg = json.loads(line)
        except: continue
        resp = handle(msg.get("id"), msg.get("method",""), msg.get("params",{}))
        sys.stdout.write(json.dumps(resp) + "\n")
        sys.stdout.flush()

if __name__ == "__main__":
    main()
