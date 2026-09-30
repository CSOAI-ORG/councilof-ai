// node --test integrations/integrations.test.mjs — wrapper checks that need no host product.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), "utf8");
const ATTR = "Evidence by GSPC · Council of AI";

test("every wrapper serves the published bundle byte for byte", () => {
  execFileSync(process.execPath, [resolve(here, "vendor-panel.mjs"), "--check"], { stdio: "pipe" });
});

test("OpenShift: the console extension points at an exposed module that exists", () => {
  const pkg = JSON.parse(read("openshift-console-plugin/package.json"));
  const ext = JSON.parse(read("openshift-console-plugin/console-extensions.json"));
  const route = ext.find((e) => e.type === "console.page/route");
  const mod = route.properties.component.$codeRef;
  assert.ok(pkg.consolePlugin.exposedModules[mod]);
  assert.ok(existsSync(resolve(here, "openshift-console-plugin/src", pkg.consolePlugin.exposedModules[mod] + ".tsx")));
  for (const e of ext.filter((x) => x.type === "console.navigation/href")) assert.match(e.properties.name, /^%plugin__gspc-evidence-plugin~.+%$/);
});

test("OpenShift: the sandbox YAML is namespace-scoped only and carries no namespace field", () => {
  const y = read("openshift-console-plugin/deploy/rendered/panel-sandbox.yaml");
  const kinds = [...y.matchAll(/^kind: (\w+)/gm)].map((m) => m[1]);
  assert.deepEqual(kinds.sort(), ["ConfigMap", "ConfigMap", "Deployment", "Route", "Service"]);
  assert.doesNotMatch(y, /^\s+namespace:/m);
  assert.doesNotMatch(y, /ConsolePlugin|ClusterRole|kind: Namespace/);
  const p = read("openshift-console-plugin/deploy/llama-stack-provider/provider-sandbox.yaml");
  assert.deepEqual([...p.matchAll(/^kind: (\w+)/gm)].map((m) => m[1]), ["ConfigMap", "Deployment", "Service"]);
});

test("OpenShift: the provider YAML is the current render of the package", () => {
  execFileSync("python3", [resolve(here, "openshift-console-plugin/deploy/llama-stack-provider/render.py"), "--check"], { stdio: "pipe" });
});

test("OpenShift: the deploy script never echoes the token and refuses system namespaces", () => {
  const s = read("openshift-console-plugin/deploy/sandbox-deploy.sh");
  assert.doesNotMatch(s, /echo[^\n]*OC_TOKEN|--token=/);
  assert.match(s, /unset OC_TOKEN/);
  assert.match(s, /default\|kube-\*\|openshift\*/);
});

test("Foundry: manifest declares the sockets, the page and connect-src councilof.ai only", () => {
  const m = read("crowdstrike-foundry/manifest.yml");
  for (const s of ["activity.detections.details", "hosts.host.panel", "xdr.cases.panel"]) assert.match(m, new RegExp(`- ${s.replace(/\./g, "\\.")}`));
  const connect = [...m.matchAll(/connect-src:\n\s+- (\S+)/g)].map((x) => x[1]);
  assert.deepEqual(connect, ["https://councilof.ai", "https://councilof.ai"]);
  assert.match(m, /manifest_version: "2023-05-09"/);
});

test("Foundry: the suggested subject is the first https URL in the record, not the console context", async () => {
  const src = read("crowdstrike-foundry/ui/extensions/gspc-evidence/src/app.js");
  const body = src.slice(src.indexOf("export function firstHttpsUrl"), src.indexOf("function show("));
  const firstHttpsUrl = new Function(`${body.replace("export ", "")}; return firstHttpsUrl;`)();
  assert.equal(firstHttpsUrl({ parentUrl: "https://falcon.crowdstrike.com/x", detection: { cmd: "curl https://mcp.acme.example/mcp)." } }), "https://mcp.acme.example/mcp");
  assert.equal(firstHttpsUrl({ theme: "theme-dark", user: { username: "a" } }), null);
});

test("Splunk: conf files parse, dashboard XML names the loader and the panel slot, samples are fixtures", () => {
  execFileSync("python3", ["-c", `
import configparser, xml.etree.ElementTree as ET, sys
base = sys.argv[1]
for f in ["app.conf", "props.conf"]:
    c = configparser.RawConfigParser(strict=True); c.optionxform = str
    c.read_string(open(base + "/default/" + f).read())
c = configparser.RawConfigParser(); c.read(base + "/default/props.conf")
assert set(c.sections()) == {"csoai:evidence:ecs", "csoai:evidence:ocsf"}, c.sections()
d = ET.parse(base + "/default/data/ui/views/gspc_evidence.xml").getroot()
assert d.get("script") == "gspc_panel_loader.js"
assert "gspc-panel-slot" in open(base + "/default/data/ui/views/gspc_evidence.xml").read()
ET.parse(base + "/default/data/ui/nav/default.xml")
`, resolve(here, "splunk-app/gspc_evidence")], { stdio: "pipe" });
  const loader = read("splunk-app/gspc_evidence/appserver/static/gspc_panel_loader.js");
  assert.match(loader, /gspc-evidence-panel/);
  for (const f of readdirSync(resolve(here, "splunk-app/gspc_evidence/samples")))
    for (const line of read(`splunk-app/gspc_evidence/samples/${f}`).split("\n").filter(Boolean)) assert.match(line, /FIXTURE/);
});

test("the bundle every wrapper ships carries the attribution text", () => {
  assert.ok(read("../public/panel/gspc-panel.js").includes(ATTR));
});
