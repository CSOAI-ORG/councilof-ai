#!/usr/bin/env python3
"""Discovery grid for two declared subject axes (lab-practice, regulator-transparency).

Read-only public GETs. Records what is *present* on a public page: status, sha256 of
the bytes actually received, size, title, and which of five link classes appear.
It assigns no score, no rank and no grade. Output is a discovery grid for the owner
to freeze into a bank -- it is not an admission and does not make an axis MEASURED.
"""
import concurrent.futures as cf, hashlib, json, re, sys, time, urllib.request, urllib.error

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")
TERMS = {
    "safety": r"safety|safeguard|risk",
    "evaluations": r"eval|benchmark|red.?team|testing",
    "incidents": r"incident|transparency report|trust report|bug bounty|vulnerab",
    "model_cards": r"model card|system card|technical report|model document",
    "contact": r"contact|report a concern|whistleblow|complaint",
}
LABS = [
    ("OpenAI", "https://openai.com/safety/"), ("Anthropic", "https://www.anthropic.com/safety"),
    ("Google DeepMind", "https://deepmind.google/about/responsibility-safety/"),
    ("Meta AI", "https://ai.meta.com/"), ("Microsoft AI", "https://www.microsoft.com/en-us/ai/responsible-ai"),
    ("xAI", "https://x.ai/safety"), ("Mistral AI", "https://mistral.ai/technology/"),
    ("Cohere", "https://cohere.com/trust"), ("AI21 Labs", "https://www.ai21.com/"),
    ("Stability AI", "https://stability.ai/safety"), ("Hugging Face", "https://huggingface.co/blog/ethics-soc-7"),
    ("EleutherAI", "https://www.eleuther.ai/"), ("Allen Institute for AI", "https://allenai.org/"),
    ("NVIDIA", "https://www.nvidia.com/en-us/ai/"), ("Amazon AI", "https://aws.amazon.com/machine-learning/responsible-ai/"),
    ("Apple", "https://www.apple.com/privacy/"), ("IBM", "https://www.ibm.com/trust/responsible-ai"),
    ("BAAI", "https://www.baai.ac.cn/"), ("Alibaba Qwen", "https://qwenlm.github.io/"),
    ("DeepSeek", "https://www.deepseek.com/"), ("Moonshot AI", "https://www.moonshot.cn/"),
    ("Z.ai", "https://z.ai/"), ("MiniMax", "https://www.minimaxi.com/"),
    ("01.AI", "https://www.01.ai/"), ("Reka AI", "https://www.reka.ai/"),
    ("Together AI", "https://www.together.ai/"), ("Groq", "https://groq.com/"),
    ("Sakana AI", "https://sakana.ai/"), ("Cerebras", "https://www.cerebras.ai/"),
    ("Inflection AI", "https://inflection.ai/"),
    ("Mosaic / Databricks", "https://www.databricks.com/"), ("Scale AI", "https://scale.com/"),
    ("SambaNova", "https://sambanova.ai/"), ("Poolside", "https://poolside.ai/"),
    ("Thinking Machines", "https://thinkingmachines.ai/"), ("Fireworks AI", "https://fireworks.ai/"),
    ("AI21", "https://www.ai21.com/blog"), ("Hugging Face Trust", "https://huggingface.co/trust"),
    ("AWS Responsible AI", "https://aws.amazon.com/ai/responsible-ai/"),
    ("Google AI Principles", "https://ai.google/responsibility/principles/"),
]
REGS = [
    ("UK ICO", "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/"),
    ("UK FCA", "https://www.fca.org.uk/firms/artificial-intelligence"),
    ("UK CMA", "https://www.gov.uk/government/organisations/competition-and-markets-authority"),
    ("Ofcom", "https://www.ofcom.org.uk/"), ("MHRA", "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency"),
    ("DSIT", "https://www.gov.uk/government/organisations/department-for-science-innovation-and-technology"),
    ("Bank of England", "https://www.bankofengland.co.uk/"), ("PRA", "https://www.bankofengland.co.uk/prudential-regulation"),
    ("FRC", "https://www.frc.org.uk/"), ("US SEC", "https://www.sec.gov/"),
    ("Ofgem", "https://www.ofgem.gov.uk/"), ("US FDA", "https://www.fda.gov/"),
    ("CQC", "https://www.cqc.org.uk/"), ("HSE", "https://www.hse.gov.uk/"),
    ("IPO", "https://www.gov.uk/government/organisations/intellectual-property-office"),
    ("NCSC", "https://www.ncsc.gov.uk/"), ("UK AI Security Institute", "https://www.aisi.gov.uk/"),
    ("EU AI Office", "https://digital-strategy.ec.europa.eu/en/policies/ai-office"),
    ("EDPS", "https://www.edps.europa.eu/"), ("EDPB", "https://www.edpb.europa.eu/"),
    ("ENISA", "https://www.enisa.europa.eu/"), ("ECB", "https://www.ecb.europa.eu/"),
    ("ESMA", "https://www.esma.europa.eu/"), ("EBA", "https://www.eba.europa.eu/"),
    ("EIOPA", "https://www.eiopa.europa.eu/"), ("DG CNECT", "https://digital-strategy.ec.europa.eu/en"),
    ("OECD AI", "https://oecd.ai/"), ("NIST", "https://www.nist.gov/artificial-intelligence"),
    ("US NTIA", "https://www.ntia.gov/"), ("US CISA", "https://www.cisa.gov/ai"),
    ("US FTC", "https://www.ftc.gov/"), ("UK Ofwat", "https://www.ofwat.gov.uk/"),
    ("EHRC", "https://www.equalityhumanrights.com/"), ("Council of Europe AI", "https://www.coe.int/en/web/artificial-intelligence"),
    ("UNESCO AI", "https://www.unesco.org/en/artificial-intelligence"), ("ISO AI", "https://www.iso.org/artificial-intelligence"),

]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read(3_000_000)
            return r.status, r.geturl(), body, ""
    except urllib.error.HTTPError as e:
        return e.code, url, e.read(200_000), "http_error"
    except Exception as e:
        return 0, url, b"", type(e).__name__


def probe(item):
    name, url = item
    status, final, body, err = fetch(url)
    text = body.decode("utf-8", "ignore")
    title = ""
    m = re.search(r"<title[^>]*>(.*?)</title>", text, re.S | re.I)
    if m:
        title = re.sub(r"\s+", " ", m.group(1)).strip()[:160]
    anchors = re.findall(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', text, re.S | re.I)
    flat = " ".join(h + " " + re.sub(r"<[^>]+>", " ", t) for h, t in anchors).lower()
    checks = {k: bool(re.search(p, flat)) for k, p in TERMS.items()}
    return {
        "subject": name, "url": url, "final_url": final, "status": status, "error": err,
        "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest() if body else "",
        "title": title, "checks": checks, "checks_present": sum(checks.values()),
    }


def run(axis, items, out):
    t0 = time.time()
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        rows = list(ex.map(probe, items))
    doc = {
        "axis": axis, "kind": "discovery-grid", "method": "link-presence v0 (not an admission)",
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "n_subjects": len(rows), "n_reachable": sum(1 for r in rows if r["status"] == 200),
        "n_http_error": sum(1 for r in rows if r["error"] == "http_error"),
        "terms": list(TERMS), "rows": rows,
        "note": "Presence of a link class is not a finding about quality, truth or compliance. "
                "No score, rank or grade is computed. Naming for publication is held for the owner.",
    }
    with open(out, "w") as f:
        json.dump(doc, f, indent=1)
    print(f"{axis}: n={doc['n_subjects']} reachable={doc['n_reachable']} http_error={doc['n_http_error']} "
          f"elapsed={time.time()-t0:.1f}s -> {out}")
    for term in doc["terms"]:
        print(f"  {term:14s} present in {sum(1 for r in rows if r['checks'][term])}/{len(rows)}")


if __name__ == "__main__":
    import os
    d = os.path.expanduser("~/_alignment/axis-runs-20261024")
    os.makedirs(d, exist_ok=True)
    run("lab-practice", LABS, d + "/lab-practice.discovery.json")
    run("regulator-transparency", REGS, d + "/regulator-transparency.discovery.json")
