// Hosted fixture coverage only. This file never imports or runs the H1 module.
// It does not qualify live probes, call budgets, mkdir, stamps, writes or delivery.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SKUS = [
  'commission-card', 'evidence-bundle', 'eu-ai-act-pack', 'swift-bank-pack',
  'xrpl-asset-evidence', 'signed-data-feed', 'provider-diff-feed',
  'receipts-batch', 'art50-marking-evidence',
] as const;
const FIXED_NOW = '2026-10-14T00:00:00Z';
const BASE = 'https://fixture.invalid';
const UNICODE_BODY = '{"fixture":"Café — 東京 🌱","note":"unpaid"}\n';
const ACCEPTS = [{ scheme: 'fixture-only', network: 'fixture-only', payTo: 'fixture-only' }];

type Observation = {
  url: string; status: number | null; bytes: number; sha256: string;
  sample: string; error: string | null;
};
type Case = {
  name: string; status: number | null; body: string;
  expected: 'UNPAID RESPONSE OBSERVED' | 'PAYMENT CHALLENGE OBSERVED' | 'NOT ADVERTISED' | 'UNVERIFIED';
  previewObject?: boolean; parseable: boolean; accepts: number;
  resourceStatus?: number | null;
};
type InputFixture = { id: string; sku: string; body: string; preview: Observation; resource: Observation };
type Shape = { parseable: boolean; accepts: number; version: number | null; has_csoai_preview?: boolean };
type Rendered = {
  id: string; sku: string; markdown: string; shape: Shape;
  preview: Observation & { x402: Shape }; resource: Observation;
};

const challenge = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ x402Version: 1, accepts: ACCEPTS, ...extra });
const CASES: Case[] = [
  { name: 'nonempty-200', status: 200, body: UNICODE_BODY,
    expected: 'UNPAID RESPONSE OBSERVED', parseable: true, accepts: 0 },
  { name: 'empty-200', status: 200, body: '',
    expected: 'UNVERIFIED', parseable: false, accepts: 0 },
  { name: 'challenge-preview', status: 402,
    body: challenge({ csoai: { preview: { observation: 'Café — 東京 🌱', signed: false } } }),
    expected: 'PAYMENT CHALLENGE OBSERVED', parseable: true, accepts: 1, previewObject: true },
  { name: 'challenge-empty-preview', status: 402,
    body: challenge({ csoai: { preview: {} } }),
    expected: 'PAYMENT CHALLENGE OBSERVED', parseable: true, accepts: 1, previewObject: true },
  { name: 'challenge-no-preview', status: 402, body: challenge(),
    expected: 'PAYMENT CHALLENGE OBSERVED', parseable: true, accepts: 1, previewObject: false },
  { name: 'malformed-402', status: 402, body: '{not-json',
    expected: 'NOT ADVERTISED', parseable: false, accepts: 0 },
  { name: 'no-accepts-402', status: 402,
    body: JSON.stringify({ x402Version: 1, csoai: { preview: {} } }),
    expected: 'NOT ADVERTISED', parseable: true, accepts: 0, previewObject: true },
  { name: 'empty-accepts-402', status: 402, body: challenge({ accepts: [] }),
    expected: 'NOT ADVERTISED', parseable: true, accepts: 0, previewObject: false },
  { name: 'wrong-type-accepts-402', status: 402, body: challenge({ accepts: {} }),
    expected: 'NOT ADVERTISED', parseable: true, accepts: 0, previewObject: false },
  { name: 'unavailable', status: null, body: '',
    expected: 'UNVERIFIED', parseable: false, accepts: 0 },
  { name: 'resource-not-402', status: 200, body: UNICODE_BODY, resourceStatus: 503,
    expected: 'UNPAID RESPONSE OBSERVED', parseable: true, accepts: 0 },
  { name: 'claims-unconfirmed', status: 402,
    body: challenge({ csoai: { preview: {
      signed: false, payment_status: 'UNPAID', delivery_status: 'NOT_DELIVERED', buyer_acceptance: 'NOT_RECORDED',
    } } }), expected: 'PAYMENT CHALLENGE OBSERVED', parseable: true, accepts: 1, previewObject: true },
  { name: 'claims-asserted', status: 402,
    body: challenge({ csoai: { preview: {
      signed: true, signature: 'fixture-only', payment_status: 'PAID', delivery_status: 'DELIVERED', buyer_acceptance: 'ACCEPTED',
    } } }), expected: 'PAYMENT CHALLENGE OBSERVED', parseable: true, accepts: 1, previewObject: true },
  { name: "nonobject-null-200", status: 200, body: "null",
    expected: "UNPAID RESPONSE OBSERVED", parseable: false, accepts: 0 },
  { name: "nonobject-null-402", status: 402, body: "null",
    expected: "NOT ADVERTISED", parseable: false, accepts: 0 },
  { name: "nonobject-array-200", status: 200, body: "[]",
    expected: "UNPAID RESPONSE OBSERVED", parseable: false, accepts: 0 },
  { name: "nonobject-array-402", status: 402, body: "[]",
    expected: "NOT ADVERTISED", parseable: false, accepts: 0 },
  { name: "nonobject-string-200", status: 200, body: "\"Café — 東京 🌱\"",
    expected: "UNPAID RESPONSE OBSERVED", parseable: false, accepts: 0 },
  { name: "nonobject-string-402", status: 402, body: "\"Café — 東京 🌱\"",
    expected: "NOT ADVERTISED", parseable: false, accepts: 0 },
  { name: "nonobject-number-200", status: 200, body: "7",
    expected: "UNPAID RESPONSE OBSERVED", parseable: false, accepts: 0 },
  { name: "nonobject-number-402", status: 402, body: "7",
    expected: "NOT ADVERTISED", parseable: false, accepts: 0 },
  { name: "nonobject-boolean-200", status: 200, body: "false",
    expected: "UNPAID RESPONSE OBSERVED", parseable: false, accepts: 0 },
  { name: "nonobject-boolean-402", status: 402, body: "false",
    expected: "NOT ADVERTISED", parseable: false, accepts: 0 },
];

const observation = (url: string, status: number | null, body: string): Observation => ({
  url, status, bytes: Buffer.byteLength(body, 'utf8'),
  sha256: createHash('sha256').update(Buffer.from(body, 'utf8')).digest('hex'),
  sample: body, error: status === null ? 'fixture unavailable' : null,
});

// Parse the complete file as DATA, but compile only these three function bodies.
// In particular, ROOT/OUT, module imports, probe, main and __main__ never execute.
// Only the literal spec table is read from main; its body is never compiled.
const PYTHON_HELPERS = String.raw`
import ast
import json
import sys
from types import SimpleNamespace

payload = json.load(sys.stdin)
tree = ast.parse(payload["source"], filename="generate-h1-product-docs.py")
wanted = ("x402_shape", "verify_paths", "doc")
selected = []
for name in wanted:
    matches = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == name]
    if len(matches) != 1:
        raise AssertionError("expected one helper: " + name)
    fn = matches[0]
    if fn.decorator_list or fn.args.defaults or any(v is not None for v in fn.args.kw_defaults):
        raise AssertionError("helper definition would execute an extra expression")
    for node in ast.walk(fn):
        if isinstance(node, (ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal)):
            raise AssertionError("helper gained an import or global mutation")
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            raise AssertionError("dunder access is outside the fixture contract")
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id not in {"isinstance", "len", "now", "verify_paths"}:
                    raise AssertionError("unadmitted helper call: " + node.func.id)
            elif isinstance(node.func, ast.Attribute):
                is_json_loads = node.func.attr == "loads" and isinstance(node.func.value, ast.Name) and node.func.value.id == "json"
                if node.func.attr not in {"get", "join"} and not is_json_loads:
                    raise AssertionError("unadmitted attribute call: " + node.func.attr)
            else:
                raise AssertionError("indirect calls are outside the fixture contract")
    # Annotations have no bearing on rendering and must not execute on definition.
    fn.returns = None
    for arg in fn.args.posonlyargs + fn.args.args + fn.args.kwonlyargs:
        arg.annotation = None
    if fn.args.vararg:
        fn.args.vararg.annotation = None
    if fn.args.kwarg:
        fn.args.kwarg.annotation = None
    selected.append(fn)

main_nodes = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "main"]
if len(main_nodes) != 1:
    raise AssertionError("expected one main body to inspect as data")
spec_nodes = [n for n in ast.walk(main_nodes[0]) if isinstance(n, ast.Assign)
              and any(isinstance(t, ast.Name) and t.id == "spec" for t in n.targets)]
if len(spec_nodes) != 1:
    raise AssertionError("expected one literal SKU spec")
spec_rows = ast.literal_eval(spec_nodes[0].value)
spec = {row[0]: {"title": row[1], "ledger": row[3]} for row in spec_rows}
if len(spec) != len(spec_rows):
    raise AssertionError("duplicate SKU in the literal spec")

# Defense in depth: the compiled namespace cannot import, read/write files,
# reach a socket, launch a child process or call the omitted producer functions.
def reject_effect(event, args):
    if event == "open" or event.startswith(("socket.", "subprocess.", "os.exec", "os.spawn")) or event in {
        "os.mkdir", "os.remove", "os.rmdir", "os.rename", "os.system", "os.link", "os.symlink"
    }:
        raise AssertionError("fixture attempted an external effect: " + event)
sys.addaudithook(reject_effect)
namespace = {
    "__builtins__": {"Exception": Exception, "isinstance": isinstance, "len": len, "dict": dict, "list": list},
    "json": SimpleNamespace(loads=json.loads),
    "BASE": payload["base"], "now": lambda: payload["now"],
}
module = ast.fix_missing_locations(ast.Module(body=selected, type_ignores=[]))
exec(compile(module, "h1-selected-fixture-helpers", "exec"), namespace)
results = []
for item in payload["fixtures"]:
    shape = namespace["x402_shape"](item["body"].encode("utf-8"))
    block = {"preview": dict(item["preview"], x402=shape), "resource": dict(item["resource"]),
             "ledger": spec.get(item["sku"], {}).get("ledger", "fixture-only ledger")}
    before = json.dumps(block, sort_keys=True, ensure_ascii=False)
    markdown = namespace["doc"](item["sku"], spec.get(item["sku"], {}).get("title", "Unknown fixture"), block)
    if json.dumps(block, sort_keys=True, ensure_ascii=False) != before:
        raise AssertionError("rendering mutated the supplied observations")
    results.append({"id": item["id"], "sku": item["sku"], "markdown": markdown,
                    "shape": shape, "preview": block["preview"], "resource": block["resource"]})
print(json.dumps({"spec_ids": list(spec), "results": results}, ensure_ascii=False))
`;

const PYTHON_PROBES = String.raw`
# Execute only the actual source probe/x402 functions against controlled urllib
# objects. The H1 module, top-level mkdir and main are never compiled or imported.
import ast
import hashlib
import io
import json
import sys
import socket
import urllib.error
import urllib.request
from types import SimpleNamespace

payload = json.load(sys.stdin)
tree = ast.parse(payload["source"], filename="generate-h1-product-docs.py")
selected = []
for name in ("x402_shape", "probe"):
    matches = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == name]
    if len(matches) != 1:
        raise AssertionError("expected one source function: " + name)
    fn = matches[0]
    if fn.decorator_list or any(value is not None for value in fn.args.kw_defaults):
        raise AssertionError("source function gained an executable definition")
    if name == "probe":
        if len(fn.args.defaults) != 1 or not isinstance(fn.args.defaults[0], ast.Constant) or type(fn.args.defaults[0].value) is not int or fn.args.defaults[0].value != 20:
            raise AssertionError("probe timeout default changed")
    elif fn.args.defaults:
        raise AssertionError("shape helper gained a default expression")
    allowed_names = {"isinstance", "len", "str", "x402_shape"}
    allowed_attributes = {"loads", "get", "Request", "urlopen", "read", "sha256", "hexdigest", "decode"}
    for node in ast.walk(fn):
        if isinstance(node, (ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal)):
            raise AssertionError("source function gained import/global effects")
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            raise AssertionError("dunder access is outside this fixture")
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id not in allowed_names:
                    raise AssertionError("unadmitted source call: " + node.func.id)
            elif isinstance(node.func, ast.Attribute):
                if node.func.attr not in allowed_attributes:
                    raise AssertionError("unadmitted source method: " + node.func.attr)
            else:
                raise AssertionError("indirect source call is outside this fixture")
    fn.returns = None
    for arg in fn.args.posonlyargs + fn.args.args + fn.args.kwonlyargs:
        arg.annotation = None
    if fn.args.vararg:
        fn.args.vararg.annotation = None
    if fn.args.kwarg:
        fn.args.kwarg.annotation = None
    selected.append(fn)

# Load the fixture's standard-library objects before denying external effects.
real_request = urllib.request.Request
real_http_error = urllib.error.HTTPError
real_url_error = urllib.error.URLError
def reject_effect(event, args):
    if event == "open" or event.startswith(("socket.", "subprocess.", "os.exec", "os.spawn")) or event in {
        "os.mkdir", "os.remove", "os.rmdir", "os.rename", "os.system", "os.link", "os.symlink"
    }:
        raise AssertionError("transport fixture attempted external effect: " + event)
sys.addaudithook(reject_effect)

results = []
for item in payload["cases"]:
    raw = bytes.fromhex(item["body_hex"])
    reads, calls = [], []

    class ControlledBody(io.BytesIO):
        def read(self, *args):
            chunk = super().read(*args)
            reads.append(chunk)
            return chunk

    class ControlledResponse:
        def __init__(self):
            self.status = item["status"]
            self.body = ControlledBody(raw)
        def __enter__(self):
            return self
        def __exit__(self, *args):
            self.body.close()
        def read(self):
            return self.body.read()

    def controlled_urlopen(request, timeout):
        if request.full_url != item["url"] or not request.full_url.startswith("https://fixture.invalid/"):
            raise AssertionError("unexpected fixture URL")
        if request.get_method() != "GET" or request.data is not None:
            raise AssertionError("fixture must remain an unpaid GET")
        calls.append({
            "url": request.full_url, "method": request.get_method(),
            "headers": {key.lower(): value for key, value in request.header_items()},
            "timeout": timeout, "has_request_body": request.data is not None,
        })
        if item["kind"] == "normal":
            return ControlledResponse()
        if item["kind"] == "http_error":
            raise real_http_error(item["url"], item["status"], "fixture HTTP response", {}, ControlledBody(raw))
        if item["kind"] == "transport_error":
            raise real_url_error(item["reason"])
        raise AssertionError("unknown transport fixture kind")

    namespace = {
        "__builtins__": {"Exception": Exception, "isinstance": isinstance, "len": len,
                         "dict": dict, "list": list, "str": str},
        "json": SimpleNamespace(loads=json.loads),
        "hashlib": SimpleNamespace(sha256=hashlib.sha256),
        "urllib": SimpleNamespace(
            request=SimpleNamespace(Request=real_request, urlopen=controlled_urlopen),
            error=SimpleNamespace(HTTPError=real_http_error),
        ),
    }
    module = ast.fix_missing_locations(ast.Module(body=selected, type_ignores=[]))
    exec(compile(module, "h1-source-controlled-urllib-probe", "exec"), namespace)
    value = namespace["probe"](item["url"], item["timeout"]) if item["timeout"] is not None else namespace["probe"](item["url"])
    results.append({
        "id": item["id"], "observation": value, "calls": calls,
        "read_calls": len(reads), "read_hex": b"".join(reads).hex(),
    })

# Audit-hook errors are caught by the real probe's generic exception branch.
# A separate negative control makes that swallowed error path observable.
denied = []
for name, attempt in (
    ("file", lambda: io.open("/fixture-must-never-exist", "rb")),
    ("socket", lambda: socket.socket()),
):
    try:
        attempt()
    except AssertionError:
        denied.append(name)
    else:
        raise AssertionError("external-effect negative control failed: " + name)
print(json.dumps({"results": results, "denied_effect_controls": denied}, ensure_ascii=False))
`;

function section(markdown: string, heading: string, next?: string): string {
  const start = markdown.indexOf(heading + '\n');
  if (start < 0) throw new Error('missing section: ' + heading);
  const bodyStart = start + heading.length + 1;
  const end = next ? markdown.indexOf(next + '\n', bodyStart) : markdown.length;
  if (end < 0) throw new Error('missing next section: ' + next);
  return markdown.slice(bodyStart, end).trim();
}
function verdict(markdown: string): string {
  const value = section(markdown, '## Unpaid preview or challenge observation', '## Buyer and paid output scope')
    .split('\n').find(line => line.startsWith('**'));
  if (!value) throw new Error('missing observation classification');
  return value;
}
const scope = (markdown: string) => section(markdown, '## Buyer and paid output scope', '## Verify path');

// Hosted-only by construction: the existing pr-gates unit command discovers it.
// A local collection skips it rather than launching Python on the Mac.
describe.skipIf(process.env.GITHUB_ACTIONS !== 'true')('H1 source-bound document fixtures', () => {

  it('runs actual source probe against controlled urllib normal, HTTPError402 and transport branches without sockets or payment', () => {
    const source = readFileSync(new URL('./badger/generate-h1-product-docs.py', import.meta.url), 'utf8');
    const boundaryBody = Buffer.from('x'.repeat(599) + 'é 東京 🌱 tail', 'utf8');
    const challengeBody = Buffer.from(JSON.stringify({
      padding: 'x'.repeat(650), x402Version: 1, accepts: ACCEPTS,
      csoai: { preview: { signed: false, fixture: 'unpaid' } },
    }), 'utf8');
    const reason = 'fixture transport unavailable Café — ' + 'x'.repeat(240);
    const cases = [
      { id: 'normal-200-byte-boundary', kind: 'normal', status: 200, raw: boundaryBody, timeout: null, reason: '' },
      { id: 'normal-empty-200', kind: 'normal', status: 200, raw: Buffer.alloc(0), timeout: 7, reason: '' },
      { id: 'actual-HTTPError402-full-challenge', kind: 'http_error', status: 402, raw: challengeBody, timeout: null, reason: '' },
      { id: 'actual-HTTPError402-nonobject', kind: 'http_error', status: 402, raw: Buffer.from('null'), timeout: 9, reason: '' },
      { id: 'actual-transport-URLError', kind: 'transport_error', status: null, raw: Buffer.alloc(0), timeout: null, reason },
    ];
    const output = execFileSync('python3', ['-I', '-B', '-X', 'utf8', '-c', PYTHON_PROBES], {
      input: JSON.stringify({
        source, cases: cases.map(({ raw, ...item }) => ({
          ...item, url: BASE + '/controlled-probe/' + item.id, body_hex: raw.toString('hex'),
        })),
      }),
      encoding: 'utf8', timeout: 10_000, maxBuffer: 4 * 1024 * 1024,
      env: { PATH: process.env.PATH ?? '' },
    });
    type ProbeRow = {
      id: string; observation: Observation & { x402?: Shape };
      calls: { url: string; method: string; headers: Record<string, string>; timeout: number; has_request_body: boolean }[];
      read_calls: number; read_hex: string;
    };
    const received = JSON.parse(output) as { results: ProbeRow[]; denied_effect_controls: string[] };
    expect(received.denied_effect_controls).toEqual(['file', 'socket']);
    expect(received.results.map(row => row.id)).toEqual(cases.map(item => item.id));
    for (const item of cases) {
      const row = received.results.find(value => value.id === item.id)!;
      const url = BASE + '/controlled-probe/' + item.id;
      expect(row.calls, item.id).toEqual([{
        url, method: 'GET', headers: { 'user-agent': 'curl/8' },
        timeout: item.timeout ?? 20, has_request_body: false,
      }]);
      if (item.kind === 'transport_error') {
        expect(row.observation, item.id).toEqual({
          url, status: null, bytes: 0, sha256: '', sample: '',
          error: ('<urlopen error ' + reason + '>').slice(0, 200),
        });
        expect(row.read_calls, item.id).toBe(0);
        expect(row.read_hex, item.id).toBe('');
        continue;
      }
      const shape = item.id === 'actual-HTTPError402-full-challenge'
        ? { parseable: true, accepts: 1, version: 1, has_csoai_preview: true }
        : { parseable: false, accepts: 0, version: null };
      expect(row.observation, item.id).toEqual({
        url, status: item.status, bytes: item.raw.length,
        sha256: createHash('sha256').update(item.raw).digest('hex'),
        sample: item.raw.subarray(0, 600).toString('utf8'), x402: shape, error: null,
      });
      expect(row.read_calls, item.id).toBe(1);
      expect(row.read_hex, item.id).toBe(item.raw.toString('hex'));
    }
    // Hash the full raw body, decode only its 600-byte sample, and parse the
    // full 402 challenge even when payment options appear after that sample.
    expect(boundaryBody.subarray(0, 600).toString('utf8')).toBe('x'.repeat(599) + '\uFFFD');
    expect(challengeBody.subarray(0, 600).includes(Buffer.from('"accepts"'))).toBe(false);
    expect(received.results.find(row => row.id === 'actual-HTTPError402-full-challenge')!.observation.x402?.accepts).toBe(1);
  }, 15_000);

  it('keeps nine scopes and byte observations distinct from challenge, signature, payment and acceptance claims', () => {
    const source = readFileSync(new URL('./badger/generate-h1-product-docs.py', import.meta.url), 'utf8');
    const fixtures: InputFixture[] = SKUS.flatMap(sku => CASES.map(testCase => ({
      id: `${sku}/${testCase.name}`, sku, body: testCase.body,
      preview: observation(`${BASE}/preview/${sku}`, testCase.status, testCase.body),
      resource: observation(`${BASE}/resource/${sku}`, testCase.resourceStatus ?? 402, '{"fixture":"resource observation"}'),
    })));
    fixtures.push({
      id: 'unknown/challenge', sku: 'unknown-source-scope', body: challenge(),
      preview: observation(`${BASE}/preview/unknown`, 402, challenge()),
      resource: observation(`${BASE}/resource/unknown`, 402, '{"fixture":"resource observation"}'),
    });
    const output = execFileSync('python3', ['-I', '-B', '-X', 'utf8', '-c', PYTHON_HELPERS], {
      input: JSON.stringify({ source, fixtures, base: BASE, now: FIXED_NOW }),
      encoding: 'utf8', timeout: 10_000, maxBuffer: 4 * 1024 * 1024,
      env: { PATH: process.env.PATH ?? '' },
    });
    const rendered = JSON.parse(output) as { spec_ids: string[]; results: Rendered[] };
    expect(rendered.spec_ids).toEqual([...SKUS]);
    expect(rendered.results).toHaveLength(fixtures.length);
    const rows = new Map(rendered.results.map(row => [row.id, row]));
    expect(rows.size).toBe(fixtures.length);
    const admittedScopes = new Set<string>();

    for (const sku of SKUS) {
      const baseline = rows.get(`${sku}/nonempty-200`)!;
      const baselineScope = scope(baseline.markdown);
      admittedScopes.add(baselineScope);
      expect(baselineScope).toMatch(/Source scope: \[/);
      expect(baselineScope).toMatch(/https:\/\/github\.com\/CSOAI-ORG\/councilof-ai\/blob\/[0-9a-f]{40}\/functions\//);
      expect(baselineScope).not.toMatch(/No source-qualified description/);

      for (const testCase of CASES) {
        const row = rows.get(`${sku}/${testCase.name}`)!;
        const input = fixtures.find(item => item.id === row.id)!;
        expect(verdict(row.markdown).startsWith(`**${testCase.expected}`), row.id).toBe(true);
        expect(row.shape.parseable, row.id).toBe(testCase.parseable);
        expect(row.shape.accepts, row.id).toBe(testCase.accepts);
        // Valid non-object JSON is an observed body, never a payment challenge.
        // These supplied 200/402 statuses do not execute probe or HTTPError transport.
        if (testCase.name.startsWith("nonobject-")) {
          expect(row.shape, row.id).toEqual({ parseable: false, accepts: 0, version: null });
          expect(row.preview.status, row.id).toBe(testCase.status);
          expect(row.preview.bytes, row.id).toBe(Buffer.byteLength(testCase.body, "utf8"));
          expect(row.preview.sha256, row.id).toBe(createHash("sha256").update(Buffer.from(testCase.body, "utf8")).digest("hex"));
          expect(verdict(row.markdown), row.id).not.toMatch(/DELIVERABLE|PAYMENT CHALLENGE OBSERVED/);
        }
        if (testCase.previewObject !== undefined) {
          expect(row.shape.has_csoai_preview, row.id).toBe(testCase.previewObject);
        }
        // Changing an observation cannot silently select another paid-output scope.
        expect(scope(row.markdown), row.id).toBe(baselineScope);
        expect(row.preview, row.id).toEqual({ ...input.preview, x402: row.shape });
        expect(row.resource, row.id).toEqual(input.resource);
        expect(row.markdown, row.id).toContain(FIXED_NOW);
        expect(row.markdown, row.id).toContain(`${BASE}/gspc-verify`);

        const resource = section(row.markdown, '## 402 door', '## Unpaid preview or challenge observation');
        if (row.resource.status === 402) {
          expect(resource, row.id).toMatch(/HTTP 402.*recorded/);
          expect(resource, row.id).not.toMatch(/NOTE:/);
          expect(resource, row.id).not.toMatch(/(?:artifact|artefact).*(?:available|delivered)|(?:available|delivered).*(?:artifact|artefact)/i);
        } else {
          expect(resource, row.id).toContain(`status ${row.resource.status}`);
          expect(resource, row.id).toMatch(/NOTE:/);
          expect(resource, row.id).not.toMatch(/HTTP 402.*recorded/);
        }
        if (testCase.expected === 'PAYMENT CHALLENGE OBSERVED') {
          const classification = verdict(row.markdown);
          expect(classification, row.id).toMatch(/payment options only/);
          expect(classification, row.id).toMatch(/Neither.*establishes.*paid artifact.*buyer acceptance/);
          expect(classification, row.id).toMatch(testCase.previewObject
            ? /object is present.*may be empty or uncheckable/
            : /No csoai\.preview object/);
        }
      }

      // Bogus success fields inside an unpaid preview must not upgrade any claims.
      const unconfirmed = rows.get(`${sku}/claims-unconfirmed`)!;
      const asserted = rows.get(`${sku}/claims-asserted`)!;
      // Byte counts legitimately differ; classification does not use those claims.
      const withoutCount = (value: string) => verdict(value).replace(/\(\d+ bytes\)/, '(fixture bytes)');
      expect(withoutCount(asserted.markdown), sku).toBe(withoutCount(unconfirmed.markdown));
      expect(scope(asserted.markdown), sku).toBe(scope(unconfirmed.markdown));
      expect(section(asserted.markdown, '## Verify path', '## Ledger it feeds'), sku)
        .toBe(section(unconfirmed.markdown, '## Verify path', '## Ledger it feeds'));

      // Render the supplied UTF-8 byte/digest observations without normalization.
      expect(Buffer.byteLength(UNICODE_BODY, 'utf8')).toBeGreaterThan(UNICODE_BODY.length);
      const previewSection = section(baseline.markdown, '## Unpaid preview or challenge observation', '## Buyer and paid output scope');
      expect(previewSection.match(/```json\n([\s\S]*?)\n```/)?.[1], sku).toBe(UNICODE_BODY);
      expect(previewSection, sku).toContain(`**${Buffer.byteLength(UNICODE_BODY, 'utf8')} bytes**`);
      expect(previewSection, sku).toContain(`sha256 ${createHash('sha256').update(Buffer.from(UNICODE_BODY, 'utf8')).digest('hex').slice(0, 16)}…`);
    }
    expect(admittedScopes.size).toBe(SKUS.length);
    const unknown = rows.get('unknown/challenge')!;
    expect(verdict(unknown.markdown)).toMatch(/^\*\*PAYMENT CHALLENGE OBSERVED/);
    const unknownScope = scope(unknown.markdown);
    expect(unknownScope).toMatch(/No source-qualified description/);
    expect(unknownScope).toMatch(/Confirm.*before payment/);
    expect(unknownScope).not.toMatch(/Source scope: \[/);
  }, 15_000);
});


// Cross-producer contract coverage, still in the existing hosted fixture route.
// It reuses the isolated H1 helper harness and selects only the partner's two
// pure helpers. Neither producer's module body, get(), main() or __main__ runs.
const PARTNER_FINAL_PRINT = 'print(json.dumps({"spec_ids": list(spec), "results": results}, ensure_ascii=False))';
const PYTHON_PARTNER_HELPERS = PYTHON_HELPERS
  .replace('import ast\n', 'import ast\nimport re\n')
  .replace(PARTNER_FINAL_PRINT, String.raw`
partner_tree = ast.parse(payload["partner_source"], filename="generate-partner-offer-docs.py")
partner_selected = []
for name in ("product_facts", "offer_doc"):
    matches = [n for n in partner_tree.body if isinstance(n, ast.FunctionDef) and n.name == name]
    if len(matches) != 1:
        raise AssertionError("expected one partner helper: " + name)
    fn = matches[0]
    for node in ast.walk(fn):
        if isinstance(node, ast.FunctionDef):
            if node.decorator_list or node.args.defaults or any(v is not None for v in node.args.kw_defaults):
                raise AssertionError("partner helper gained an executing definition expression")
            node.returns = None
            for arg in node.args.posonlyargs + node.args.args + node.args.kwonlyargs:
                arg.annotation = None
            if node.args.vararg:
                node.args.vararg.annotation = None
            if node.args.kwarg:
                node.args.kwarg.annotation = None
        if isinstance(node, (ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal)):
            raise AssertionError("partner helper gained an import or global mutation")
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            raise AssertionError("partner dunder access is outside the fixture contract")
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id not in {"section", "product_facts", "len", "list", "any", "int", "str", "isinstance"}:
                    raise AssertionError("unadmitted partner helper call: " + node.func.id)
            elif isinstance(node.func, ast.Attribute):
                regex_call = isinstance(node.func.value, ast.Name) and node.func.value.id == "re"
                if regex_call:
                    if node.func.attr not in {"escape", "findall", "finditer", "search", "fullmatch"}:
                        raise AssertionError("unadmitted partner regex call: " + node.func.attr)
                elif node.func.attr not in {"group", "start", "end", "lstrip", "strip", "splitlines", "startswith", "endswith", "join", "get"}:
                    raise AssertionError("unadmitted partner attribute call: " + node.func.attr)
            else:
                raise AssertionError("indirect partner calls are outside the fixture contract")
    partner_selected.append(fn)
partner_namespace = {
    "__builtins__": {"Exception": Exception, "isinstance": isinstance, "len": len,
                     "dict": dict, "list": list, "int": int, "str": str, "any": any},
    "re": SimpleNamespace(escape=re.escape, findall=re.findall, finditer=re.finditer,
                          search=re.search, fullmatch=re.fullmatch,
                          MULTILINE=re.MULTILINE, DOTALL=re.DOTALL),
    "BASE": payload["base"],
}
partner_module = ast.fix_missing_locations(ast.Module(body=partner_selected, type_ignores=[]))
exec(compile(partner_module, "partner-selected-fixture-helpers", "exec"), partner_namespace)

partner_results = []
for row in results:
    facts = partner_namespace["product_facts"](row["sku"], row["markdown"])
    offer = partner_namespace["offer_doc"](row["sku"], row["markdown"])
    partner_results.append(dict(row, facts=facts, offer=offer))

# Mutate generated documents as input DATA to the parser. These checks cannot
# establish authenticity of a local document; they enforce its supported shape.
negative_results = []
for sku in payload["known_skus"]:
    baseline = next(row for row in results if row["id"] == sku + "/nonempty-200")
    challenge_row = next(row for row in results if row["id"] == sku + "/challenge-preview")
    unavailable = next(row for row in results if row["id"] == sku + "/unavailable")
    text = baseline["markdown"]
    identity = next(line for line in text.splitlines() if line.startswith(chr(96) + sku + chr(96) + " — endpoint observations recorded on "))
    classification = next(line for line in text.splitlines() if line.startswith("**UNPAID RESPONSE OBSERVED."))
    challenge_classification = next(line for line in challenge_row["markdown"].splitlines() if line.startswith("**PAYMENT CHALLENGE OBSERVED."))
    unavailable_classification = next(line for line in unavailable["markdown"].splitlines() if line.startswith("**UNVERIFIED."))
    boundary = "Payment, returned artifact bytes, verification, receipt by the buyer and acceptance remain separate."
    mutations = [
        ("mismatched-identity", text.replace(identity, identity.replace(chr(96) + sku + chr(96), chr(96) + "different-sku" + chr(96), 1), 1)),
        ("duplicate-identity", text.replace(identity, identity + "\n" + identity, 1)),
        ("conflicting-identity", text.replace(identity, identity + "\n" + identity.replace(chr(96) + sku + chr(96), chr(96) + "different-sku" + chr(96), 1), 1)),
        ("duplicate-observation-heading", text.replace("## Unpaid preview or challenge observation", "## Unpaid preview or challenge observation\n## Unpaid preview or challenge observation", 1)),
        ("duplicate-resource-heading", text.replace("## 402 door", "## 402 door\n## 402 door", 1)),
        ("duplicate-scope-heading", text.replace("## Buyer and paid output scope", "## Buyer and paid output scope\n## Buyer and paid output scope", 1)),
        ("unfenced-sample", text.replace(chr(96) * 3 + "json\n", chr(96) * 3 + "text\n", 1)),
        ("injected-sample-fence", text.replace(chr(96) * 3 + "json\n", chr(96) * 3 + "json\n" + chr(96) * 3 + "\n", 1)),
        ("injected-sample-heading", text.replace(chr(96) * 3 + "json\n", chr(96) * 3 + "json\n## 402 door\n", 1)),
        ("unsupported-legacy-verdict", text.replace(classification, "**DELIVERABLE — free preview answers with real bytes.** Advertised.", 1)),
        ("appended-verdict-success-claim", text.replace(classification, classification + " DELIVERABLE: every paid artifact is signed and included in the public root.", 1)),
        ("positive-status-contradiction", text.replace(" — status **200**", " — status **503**", 1)),
        ("zero-byte-unpaid-positive", text.replace("**" + str(baseline["preview"]["bytes"]) + " bytes**", "**0 bytes**", 1)),
        ("missing-scope-citation-marker", text.replace("Source scope: [", "Unqualified scope: [", 1)),
        ("missing-scope-boundary", text.replace(boundary, "", 1)),
        ("zero-byte-payment-positive", challenge_row["markdown"].replace("**" + str(challenge_row["preview"]["bytes"]) + " bytes**", "**0 bytes**", 1)),
        ("challenge-status-contradiction", challenge_row["markdown"].replace(" — status **402**", " — status **200**", 1)),
        ("appended-challenge-success-claim", challenge_row["markdown"].replace(challenge_classification, challenge_classification + " Payment and buyer acceptance are complete.", 1)),
        ("unsupported-unverified-tail", unavailable["markdown"].replace(unavailable_classification, "**UNVERIFIED.** PAID and DELIVERED with a valid signature and root inclusion.", 1)),
        ("challenge-byte-count-contradiction", challenge_row["markdown"].replace("(" + str(challenge_row["preview"]["bytes"]) + " bytes)", "(" + str(challenge_row["preview"]["bytes"] + 1) + " bytes)", 1)),
        ("challenge-zero-accepts", challenge_row["markdown"].replace("carrying 1 accepts[] entry", "carrying 0 accepts[] entries", 1)),
        ("challenge-wrong-plural", challenge_row["markdown"].replace("carrying 1 accepts[] entry", "carrying 1 accepts[] entries", 1)),
        ("challenge-unsupported-version", challenge_row["markdown"].replace("as x402 v1 carrying", "as x402 vunsupported carrying", 1)),
    ]
    for name, mutated in mutations:
        if mutated in {text, challenge_row["markdown"], unavailable["markdown"]}:
            raise AssertionError("mutation did not change its source input: " + sku + "/" + name)
        negative_results.append({
            "id": sku + "/" + name,
            "facts": partner_namespace["product_facts"](sku, mutated),
            "offer": partner_namespace["offer_doc"](sku, mutated),
        })
print(json.dumps({"spec_ids": list(spec), "results": partner_results,
                  "negative_results": negative_results}, ensure_ascii=False))
`);

type PartnerFacts = {
  preview_status: string; preview_bytes: string;
  resource_status: string; resource_bytes: string;
  observation: string; scope: string;
};
type PartnerRendered = Rendered & { facts: PartnerFacts | null; offer: string };
const PARTNER_CASE_NAMES = [
  'nonempty-200', 'empty-200', 'challenge-preview', 'challenge-no-preview', 'malformed-402', 'unavailable',
  'claims-unconfirmed', 'claims-asserted',
] as const;
const PARTNER_NEGATIVE_NAMES = [
  'mismatched-identity', 'duplicate-identity', 'conflicting-identity',
  'duplicate-observation-heading', 'duplicate-resource-heading', 'duplicate-scope-heading',
  'unfenced-sample', 'injected-sample-fence', 'injected-sample-heading',
  'unsupported-legacy-verdict', 'appended-verdict-success-claim',
  'positive-status-contradiction', 'zero-byte-unpaid-positive',
  'missing-scope-citation-marker', 'missing-scope-boundary',
  'zero-byte-payment-positive', 'challenge-status-contradiction',
  'appended-challenge-success-claim', 'unsupported-unverified-tail',
  'challenge-byte-count-contradiction', 'challenge-zero-accepts',
  'challenge-wrong-plural', 'challenge-unsupported-version',
] as const;
const OBSERVATION_BOUNDARY = 'Payment, returned artifact bytes, verification, receipt by the buyer and acceptance remain separate.';
const offerScope = (markdown: string) => section(markdown, '## Buyer and paid output scope', '## Verify and request');

function expectUnqualifiedOffer(offer: string, id: string): void {
  expect(offer, id).toContain('| preview status | UNVERIFIED |');
  expect(offer, id).toContain('| preview bytes | UNVERIFIED |');
  expect(offer, id).toContain('| resource status | UNVERIFIED |');
  expect(offer, id).toContain('| resource bytes | UNVERIFIED |');
  expect(offer, id).toContain('**UNVERIFIED.** The source document does not match the supported recorded-observation contract.');
  expect(offerScope(offer), id).toContain('No source-qualified output scope was carried into this offer.');
  expect(offerScope(offer), id).not.toContain('Source scope: [');
}

describe.skipIf(process.env.GITHUB_ACTIONS !== 'true')('H1 to partner offer source-bound fixtures', () => {
  it('carries nine exact scopes and recorded observations, and fails closed on unsupported document facts', () => {
    expect(PYTHON_PARTNER_HELPERS).not.toBe(PYTHON_HELPERS);
    expect(PYTHON_PARTNER_HELPERS).not.toContain(PARTNER_FINAL_PRINT);
    const source = readFileSync(new URL('./badger/generate-h1-product-docs.py', import.meta.url), 'utf8');
    const partnerSource = readFileSync(new URL('./badger/generate-partner-offer-docs.py', import.meta.url), 'utf8');
    const cases: Case[] = [
      ...PARTNER_CASE_NAMES.map(name => {
        const value = CASES.find(testCase => testCase.name === name);
        if (!value) throw new Error('missing partner observation fixture: ' + name);
        return value;
      }),
      { name: 'challenge-version-none', status: 402, body: JSON.stringify({ accepts: ACCEPTS }),
        expected: 'PAYMENT CHALLENGE OBSERVED', parseable: true, accepts: 1, previewObject: false },
      { name: 'challenge-two-accepts', status: 402,
        body: challenge({ accepts: [ACCEPTS[0], ACCEPTS[0]], csoai: { preview: {} } }),
        expected: 'PAYMENT CHALLENGE OBSERVED', parseable: true, accepts: 2, previewObject: true },
    ];
    const fixtures: InputFixture[] = SKUS.flatMap(sku => [
      ...cases.map(testCase => ({
        id: `${sku}/${testCase.name}`, sku, body: testCase.body,
        preview: observation(`${BASE}/preview/${sku}`, testCase.status, testCase.body),
        resource: observation(`${BASE}/resource/${sku}`, 402, '{"fixture":"resource observation"}'),
      })),
      {
        id: `${sku}/resource-none`, sku, body: UNICODE_BODY,
        preview: observation(`${BASE}/preview/${sku}`, 200, UNICODE_BODY),
        resource: observation(`${BASE}/resource/${sku}`, null, ''),
      },
    ]);
    fixtures.push({
      id: 'unknown/challenge', sku: 'unknown-source-scope', body: challenge(),
      preview: observation(`${BASE}/preview/unknown`, 402, challenge()),
      resource: observation(`${BASE}/resource/unknown`, 402, '{"fixture":"resource observation"}'),
    });
    const output = execFileSync('python3', ['-I', '-B', '-X', 'utf8', '-c', PYTHON_PARTNER_HELPERS], {
      input: JSON.stringify({ source, partner_source: partnerSource, fixtures, known_skus: [...SKUS], base: BASE, now: FIXED_NOW }),
      encoding: 'utf8', timeout: 10_000, maxBuffer: 8 * 1024 * 1024,
      env: { PATH: process.env.PATH ?? '' },
    });
    const rendered = JSON.parse(output) as {
      spec_ids: string[]; results: PartnerRendered[];
      negative_results: { id: string; facts: PartnerFacts | null; offer: string }[];
    };
    expect(rendered.spec_ids).toEqual([...SKUS]);
    expect(rendered.results).toHaveLength(100);
    const rows = new Map(rendered.results.map(row => [row.id, row]));
    expect(rows.size).toBe(fixtures.length);
    const scopes = new Set<string>();
    for (const sku of SKUS) {
      const baseline = rows.get(`${sku}/nonempty-200`)!;
      const qualifiedScope = scope(baseline.markdown);
      scopes.add(qualifiedScope);
      expect(qualifiedScope, sku).toContain('Source scope: [');
      expect(qualifiedScope.endsWith(OBSERVATION_BOUNDARY), sku).toBe(true);
      for (const name of [...PARTNER_CASE_NAMES, 'challenge-version-none', 'challenge-two-accepts', 'resource-none']) {
        const row = rows.get(`${sku}/${name}`)!;
        expect(row.facts, row.id).not.toBeNull();
        const facts = row.facts!;
        expect(facts.preview_status, row.id).toBe(row.preview.status === null ? 'None' : String(row.preview.status));
        expect(facts.preview_bytes, row.id).toBe(String(row.preview.bytes));
        expect(facts.resource_status, row.id).toBe(row.resource.status === null ? 'None' : String(row.resource.status));
        expect(facts.resource_bytes, row.id).toBe(String(row.resource.bytes));
        expect(facts.observation, row.id).toBe(verdict(row.markdown));
        expect(facts.scope, row.id).toBe(qualifiedScope);
        expect(offerScope(row.offer), row.id).toBe(qualifiedScope);
        expect(row.offer, row.id).toContain(facts.observation);
        expect(row.offer, row.id).toContain('Verification is free at ' + BASE + '/gspc-verify');
        expect(row.offer, row.id).toContain('signature validity and root inclusion are separate.');
        expect(row.offer, row.id).toContain('Payment options do not establish availability, paid delivery, a new measurement or buyer acceptance.');
        expect(row.offer, row.id).not.toContain('(settle unlocks)');
        expect(row.offer, row.id).not.toContain('every leaf checks against the public root');
        expect(row.offer, row.id).not.toContain('The artefact described in docs/product/');
        expect(row.offer, row.id).not.toContain('the paid artefact follows at the 402');
        // The raw HTTP sample stays in the H1 observation document; it cannot
        // add offer claims merely by containing asserted success fields.
        expect(row.offer, row.id).not.toContain('"payment_status"');
        expect(row.offer, row.id).not.toContain('"delivery_status"');
        expect(row.offer, row.id).not.toContain('"buyer_acceptance"');
      }
      const unconfirmed = rows.get(`${sku}/claims-unconfirmed`)!;
      const asserted = rows.get(`${sku}/claims-asserted`)!;
      const withoutCount = (value: string) => value.replace(/\(\d+ bytes\)/, '(fixture bytes)');
      expect(withoutCount(asserted.facts!.observation), sku).toBe(withoutCount(unconfirmed.facts!.observation));
      expect(offerScope(asserted.offer), sku).toBe(offerScope(unconfirmed.offer));
      const noPreview = rows.get(`${sku}/challenge-no-preview`)!;
      expect(noPreview.facts!.observation, sku).toContain('No csoai.preview object was identified by this parser.');
      const versionNone = rows.get(`${sku}/challenge-version-none`)!;
      expect(versionNone.facts!.observation, sku).toContain('as x402 vNone carrying 1 accepts[] entry');
      const twoAccepts = rows.get(`${sku}/challenge-two-accepts`)!;
      expect(twoAccepts.facts!.observation, sku).toContain('carrying 2 accepts[] entries');
      expect(twoAccepts.facts!.observation, sku).toContain('An unpaid csoai.preview object is present; its contents may be empty or uncheckable.');
      const none = rows.get(`${sku}/resource-none`)!;
      expect(none.offer, sku).toContain('| resource status | None |');
      expect(none.offer, sku).toContain('| resource bytes | 0 |');
    }
    expect(scopes.size).toBe(9);
    const unknown = rows.get('unknown/challenge')!;
    expect(unknown.facts).toBeNull();
    expectUnqualifiedOffer(unknown.offer, unknown.id);
    expect(rendered.negative_results).toHaveLength(SKUS.length * PARTNER_NEGATIVE_NAMES.length);
    expect(new Set(rendered.negative_results.map(row => row.id))).toEqual(new Set(
      SKUS.flatMap(sku => PARTNER_NEGATIVE_NAMES.map(name => `${sku}/${name}`)),
    ));
    for (const row of rendered.negative_results) {
      expect(row.facts, row.id).toBeNull();
      expectUnqualifiedOffer(row.offer, row.id);
      expect(row.offer, row.id).not.toContain('DELIVERABLE: every paid artifact is signed');
      expect(row.offer, row.id).not.toContain('Payment and buyer acceptance are complete.');
    }
  }, 15_000);
});


// Scope: the introductory no-module/no-budget comments apply to the original
// helper fixture section. This fourth test executes admitted initialization and
// actual main in a controlled hosted sandbox. Existing46436 bytes remain intact;
// there is no live H1/provider/payment run. All observations are unpaid fixtures.
const PYTHON_MAIN_CONTROLS = String.raw`
import ast
import builtins
import fcntl
import hashlib
import io
import json
import os
import socket
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

payload = json.load(sys.stdin)
source = payload["source"]
CASE_SPECS = json.loads('[{"id":"cli-dry-no-effects","argv":["--dry"],"baseline":"missing","exit":0,"calls":0,"no_writes":true,"no_reads":true},{"id":"cli-force-dry-no-effects","argv":["--force","--dry"],"baseline":"missing","exit":0,"calls":0,"no_writes":true,"no_reads":true},{"id":"cli-unknown-no-effects","argv":["--not-admitted"],"baseline":"missing","exit":2,"calls":0,"no_writes":true,"no_reads":true},{"id":"cli-unknown-force-no-effects","argv":["--force","--not-admitted"],"baseline":"missing","exit":2,"calls":0,"no_writes":true,"no_reads":true},{"id":"cli-unknown-dry-no-effects","argv":["--dry","--not-admitted"],"baseline":"missing","exit":2,"calls":0,"no_writes":true,"no_reads":true},{"id":"baseline-missing-refused","baseline":"missing","exit":2,"calls":0,"no_writes":true},{"id":"baseline-legacy-refused","baseline":"legacy","exit":2,"calls":0,"no_writes":true},{"id":"baseline-corrupt-refused","baseline":"corrupt","exit":2,"calls":0,"no_writes":true},{"id":"baseline-future-refused","baseline":"future","exit":2,"calls":0,"no_writes":true},{"id":"baseline-nonfinite-refused","baseline":"nonfinite","exit":2,"calls":0,"no_writes":true},{"id":"baseline-inflight-refused","baseline":"inflight","argv":["--force"],"exit":2,"calls":0,"no_writes":true},{"id":"pending-marker-refused","pending":true,"argv":["--force"],"exit":2,"calls":0,"no_writes":true},{"id":"cooldown-refuses-before-lock-write","baseline":"recent","usage":1,"exit":2,"calls":0,"no_writes":true},{"id":"force-bypasses-cooldown-only","baseline":"recent","usage":1,"argv":["--force"],"exit":0,"calls":18,"success":true,"charge":18},{"id":"force-cannot-exceed-hour-budget","baseline":"recent","usage":3,"argv":["--force"],"exit":2,"calls":0,"no_writes":true},{"id":"exact20-budget-admitted","baseline":"recent","usage":2,"argv":["--force"],"exit":0,"calls":18,"success":true,"charge":18},{"id":"exact60-minute-window-expires","baseline":"expired","exit":0,"calls":18,"success":true,"charge":18},{"id":"stamp-read-error-refused","fault":"stamp-read","exit":2,"calls":0,"no_writes":true},{"id":"actual-flock-busy-refused","hold_lock":true,"exit":2,"calls":0},{"id":"budget-rechecked-after-flock","fault":"recheck-budget","argv":["--force"],"exit":2,"calls":0},{"id":"pending-fsync-failure-refused","fault":"pending-fsync","exit":2,"calls":0,"pending_after":true},{"id":"reservation-write-failure-refused","fault":"stamp-stage-1","exit":2,"calls":0,"pending_after":true},{"id":"refresh-write-failure-refused","fault":"stamp-stage-2","exit":2,"calls":0,"pending_after":true,"charge":18},{"id":"fresh-owner-baseline-18-to10","exit":0,"calls":18,"success":true,"charge":18},{"id":"long-run-charged-through-completion","step":300,"exit":0,"calls":18,"success":true,"charge":18,"retry_refused":true},{"id":"unavailable-aborts-before-products","unavailable_at":1,"old_products":true,"exit":2,"calls":1,"unchanged_products":true,"charge":18,"outcome":"aborted_before_product_writes","pending_after":false,"retry_refused":true},{"id":"malformed-aborts-before-products","malformed_at":5,"old_products":true,"exit":2,"calls":5,"unchanged_products":true,"charge":18,"outcome":"aborted_before_product_writes","pending_after":false,"retry_refused":true},{"id":"unexpected-probe-error-keeps-reservation","raise_at":5,"old_products":true,"exit":2,"calls":5,"unchanged_products":true,"charge":18,"pending_after":true,"retry_refused":true},{"id":"staging-error-preserves-old-products","fault":"output-stage-3","old_products":true,"exit":2,"calls":18,"unchanged_products":true,"charge":18,"pending_after":true},{"id":"partial-replace-keeps-old-index-and-pending","fault":"product-replace-2","old_products":true,"exit":2,"calls":18,"partial_products":true,"charge":18,"pending_after":true},{"id":"completion-stamp-failure-keeps-pending","fault":"completion-stamp","old_products":true,"exit":2,"calls":18,"products_new":true,"charge":18,"pending_after":true},{"id":"pending-unlink-failure-blocks-retry","fault":"pending-unlink","old_products":true,"exit":2,"calls":18,"products_new":true,"charge":18,"outcome":"completed","pending_after":true,"retry_refused":true},{"id":"second-main-cannot-pass-active-reservation","nested_main":true,"exit":0,"calls":18,"success":true,"charge":18},{"id":"wall-forward-does-not-expire-budget","baseline":"recent","usage":3,"argv":["--force"],"wall_offset":7200,"exit":2,"calls":0,"no_writes":true},{"id":"wall-backward-does-not-expire-budget","baseline":"recent","usage":3,"argv":["--force"],"wall_offset":-7200,"exit":2,"calls":0,"no_writes":true},{"id":"wall-forward-does-not-bypass-cooldown","baseline":"recent","usage":1,"wall_offset":7200,"exit":2,"calls":0,"no_writes":true},{"id":"wall-backward-during-run-is-metadata","wall_jump":-7200,"exit":0,"calls":18,"success":true,"charge":18},{"id":"boot-mismatch-refused","baseline":"boot-mismatch","exit":2,"calls":0,"no_writes":true},{"id":"boot-unknown-refused","baseline":"boot-unknown","exit":2,"calls":0,"no_writes":true},{"id":"invalid-boot-sample-refused","sample_boot":"not-a-boot-uuid","exit":2,"calls":0,"no_writes":true},{"id":"unavailable-boot-sample-refused","fault":"boot-unavailable","exit":2,"calls":0,"no_writes":true},{"id":"nonfinite-monotonic-sample-refused","nan_ticks":true,"exit":2,"calls":0,"no_writes":true},{"id":"monotonic-rollback-keeps-pending","rollback_ticks":true,"exit":2,"calls":1,"charge":18,"pending_after":true,"retry_refused":true},{"id":"boot-change-during-run-keeps-pending","change_boot":true,"exit":2,"calls":1,"charge":18,"pending_after":true,"retry_refused":true},{"id":"cleanup-fsync-after-unlink-no-marker-claim","fault":"cleanup-fsync","old_products":true,"exit":2,"calls":18,"products_new":true,"charge":18,"outcome":"completed","pending_after":false,"retry_refused":true},{"id":"all-dash-boot-identity-refused","sample_boot":"------------------------------------","exit":2,"calls":0,"no_writes":true},{"id":"extra-dash-boot-identity-refused","sample_boot":"-1111111-2222-3333-4444-555555555555","exit":2,"calls":0,"no_writes":true}]')
FUNCTIONS = {
    "now", "x402_shape", "probe", "verify_paths", "doc", "control_paths",
    "clock_sample", "read_budget", "check_admission", "fsync_directory", "stage_text",
    "atomic_budget_write", "require_no_pending", "claim_pending",
    "refresh_reservation", "finish_reservation", "valid_observation",
    "publish_outputs", "request_plan", "main",
}
GLOBALS = {"ROOT", "OUT", "BASE", "CALLER_LIMIT", "CALLER_WINDOW_SECONDS", "BUDGET_SCHEMA"}
IMPORTS = {
    ("import", "hashlib"), ("import", "fcntl"), ("import", "os"),
    ("import", "tempfile"), ("import", "json"), ("import", "sys"),
    ("import", "time"), ("import", "urllib.error"), ("import", "urllib.request"),
    ("from", "__future__", "annotations"),
    ("from", "datetime", "datetime", "timezone"), ("from", "pathlib", "Path"),
}
DIRECT = FUNCTIONS | {
    "Path", "RunControlError", "isinstance", "len", "str", "dict", "list",
    "set", "type", "int", "float", "all", "any", "sum", "print", "SystemExit",
}
METHODS = {
    "resolve", "is_absolute", "strip", "count", "monotonic", "now", "strftime", "loads", "dumps", "get", "add", "read_text",
    "open", "fsync", "close", "NamedTemporaryFile", "write", "flush", "fileno",
    "unlink", "replace", "stat", "fdopen", "time", "time_ns", "mkdir", "append",
    "flock", "getpid", "items", "Request", "urlopen", "read", "sha256", "hexdigest", "decode", "join",
}

def check(value, detail):
    if not value:
        raise AssertionError(detail)

def admitted_module(text):
    # Parse source only in this future hosted child. Imports are validated and
    # omitted; the product module is never imported with real ambient globals.
    tree = ast.parse(text, filename="h1-controlled-main-source")
    admitted, found_functions, found_globals, found_imports = [], set(), set(), set()
    for index, node in enumerate(tree.body):
        if isinstance(node, ast.Expr) and index == 0 and isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
            admitted.append(node)
        elif isinstance(node, ast.Import):
            check(all(alias.asname is None for alias in node.names), "unadmitted import alias")
            for alias in node.names:
                found_imports.add(("import", alias.name))
        elif isinstance(node, ast.ImportFrom):
            check(node.level == 0 and all(alias.asname is None for alias in node.names), "unadmitted from import")
            found_imports.add(tuple(["from", node.module] + [alias.name for alias in node.names]))
        elif isinstance(node, ast.Assign):
            check(len(node.targets) == 1 and isinstance(node.targets[0], ast.Name), "unadmitted top-level assignment")
            name = node.targets[0].id
            check(name in GLOBALS and name not in found_globals, "unadmitted global: " + name)
            found_globals.add(name)
            for child in ast.walk(node.value):
                if isinstance(child, ast.Call):
                    ok = name == "ROOT" and ((isinstance(child.func, ast.Name) and child.func.id == "Path") or (isinstance(child.func, ast.Attribute) and child.func.attr == "resolve"))
                    check(ok, "top-level call outside admitted path resolution")
                if isinstance(child, ast.Attribute):
                    check(not child.attr.startswith("__"), "top-level dunder access")
            admitted.append(node)
        elif isinstance(node, ast.ClassDef):
            check(node.name == "RunControlError" and len(node.bases) == 1 and isinstance(node.bases[0], ast.Name) and node.bases[0].id == "Exception", "unadmitted class")
            check(not node.keywords and not node.decorator_list and len(node.body) == 1 and isinstance(node.body[0], ast.Pass), "executable class body")
            admitted.append(node)
        elif isinstance(node, ast.FunctionDef):
            check(node.name in FUNCTIONS and node.name not in found_functions, "unadmitted function: " + node.name)
            found_functions.add(node.name)
            check(not node.decorator_list and all(value is None for value in node.args.kw_defaults), "executable function definition")
            if node.name == "probe":
                check(len(node.args.defaults) == 1 and isinstance(node.args.defaults[0], ast.Constant) and type(node.args.defaults[0].value) is int and node.args.defaults[0].value == 20, "probe default changed")
            else:
                check(not node.args.defaults, "new default expression")
            node.returns = None
            for arg in node.args.posonlyargs + node.args.args + node.args.kwonlyargs:
                arg.annotation = None
            if node.args.vararg:
                node.args.vararg.annotation = None
            if node.args.kwarg:
                node.args.kwarg.annotation = None
            for child in ast.walk(node):
                check(not isinstance(child, (ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal, ast.Lambda, ast.ClassDef)), "unadmitted function capability")
                check(not isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)) or child is node, "nested function")
                if isinstance(child, ast.Attribute):
                    check(not child.attr.startswith("__"), "dunder capability")
                if isinstance(child, ast.Call):
                    if isinstance(child.func, ast.Name):
                        check(child.func.id in DIRECT, "unadmitted call: " + child.func.id)
                    elif isinstance(child.func, ast.Attribute):
                        check(child.func.attr in METHODS, "unadmitted method: " + child.func.attr)
                    else:
                        raise AssertionError("indirect source call")
            admitted.append(node)
        elif isinstance(node, ast.If):
            test = node.test
            check(isinstance(test, ast.Compare) and isinstance(test.left, ast.Name) and test.left.id == "__name__" and len(test.ops) == 1 and isinstance(test.ops[0], ast.Eq) and len(test.comparators) == 1 and isinstance(test.comparators[0], ast.Constant) and test.comparators[0].value == "__main__", "unadmitted top-level branch")
            check(not node.orelse and len(node.body) == 1 and isinstance(node.body[0], ast.Expr), "unadmitted main guard")
            call = node.body[0].value
            check(isinstance(call, ast.Call) and isinstance(call.func, ast.Name) and call.func.id == "main" and not call.args and not call.keywords, "unadmitted main guard call")
        else:
            raise AssertionError("unadmitted top-level statement; module writes must never be skipped")
    check(found_imports == IMPORTS and found_functions == FUNCTIONS and found_globals == GLOBALS, "source control surface changed")
    return ast.fix_missing_locations(ast.Module(body=admitted, type_ignores=[]))

module = admitted_module(source)
# A negative source mutation demonstrates that the prior module-level mkdir
# cannot be silently removed by selecting only functions.
legacy = source.replace('OUT = ROOT.parents[2] / "docs" / "product"', 'OUT = ROOT.parents[2] / "docs" / "product"\nOUT.mkdir(parents=True, exist_ok=True)', 1)
check(legacy != source, "missing module output declaration")
try:
    admitted_module(legacy)
except AssertionError:
    module_guard = True
else:
    raise AssertionError("legacy module mkdir passed source admission")

T0 = 1792108800.0
TICKS0 = 7200.0
BOOT = "11111111-2222-3333-4444-555555555555"
sandbox = tempfile.TemporaryDirectory(prefix="h1-main-controls-")
root = Path(sandbox.name).resolve()
current = None
trusted_io = 0
owned_fds = {}

def inside(value):
    path = os.path.abspath(os.fspath(value))
    check(os.path.commonpath((str(root), path)) == str(root), "path outside controlled sandbox")
    return path

def audit(event, args):
    if event.startswith(("socket.", "subprocess.", "os.exec", "os.spawn")) or event in {"os.system", "os.posix_spawn", "os.fork", "os.link", "os.symlink", "os.chdir"}:
        raise AssertionError("denied external capability: " + event)
    if trusted_io:
        return  # Only trusted fixture setup/readback/cleanup, never source code.
    if event == "open":
        target = args[0]
        if isinstance(target, int):
            check(target in owned_fds, "unowned file descriptor")
        else:
            inside(target)
    elif event in {"os.mkdir", "os.remove", "os.rmdir", "os.listdir", "os.scandir", "os.chmod", "os.truncate"}:
        inside(args[0])
    elif event == "os.rename":
        inside(args[0]); inside(args[1])

sys.addaudithook(audit)

def fixture_call(fn, *args, **kwargs):
    global trusted_io
    trusted_io += 1
    try:
        return fn(*args, **kwargs)
    finally:
        trusted_io -= 1

def fixture_json(path):
    return json.loads(fixture_call(path.read_text, encoding="utf-8"))

def event(kind, path=None):
    current["events"].append({"kind": kind, "path": None if path is None else str(path)})

def checked(value):
    return Path(inside(value))

class SandboxPath:
    def __init__(self, value):
        self.path = value.path if isinstance(value, SandboxPath) else Path(value)
    def __str__(self):
        return str(self.path)
    def __fspath__(self):
        return str(self.path)
    def __truediv__(self, value):
        return SandboxPath(self.path / os.fspath(value))
    @property
    def parent(self):
        return SandboxPath(self.path.parent)
    @property
    def parents(self):
        return tuple(SandboxPath(value) for value in self.path.parents)
    @property
    def name(self):
        return self.path.name
    def resolve(self):
        path = checked(self.path)
        event("path-resolution", path)
        return SandboxPath(path.resolve())
    def is_absolute(self):
        return self.path.is_absolute()
    def read_text(self, **kwargs):
        if str(self.path) == "/proc/sys/kernel/random/boot_id":
            event("boot-identity-read")
            if current["cfg"].get("fault") == "boot-unavailable":
                raise OSError("controlled unavailable boot identity")
            return current["boot"] + "\n"
        path = checked(self.path); event("read", path)
        if path == current["stamp"] and current["cfg"].get("fault") == "stamp-read":
            raise PermissionError("controlled existing state read failure")
        return path.read_text(**kwargs)
    def stat(self):
        path = checked(self.path); event("stat", path)
        return path.stat()
    def open(self, mode):
        path = checked(self.path)
        event("write-attempt" if any(c in mode for c in "wax+") else "read", path)
        stream = path.open(mode)
        owned_fds[stream.fileno()] = path
        return stream
    def mkdir(self, **kwargs):
        path = checked(self.path); event("write-attempt", path)
        check(len(current["calls"]) == 18, "product directory before complete HTTP observations")
        return path.mkdir(**kwargs)
    def unlink(self):
        path = checked(self.path); event("write-attempt", path)
        if path == current["pending"]:
            state = fixture_json(current["stamp"])
            marker = fixture_json(path)
            check(state["inflight"] is None and state["outcome"] in {"completed", "aborted_before_product_writes"}, "pending cleared before completion stamp")
            check(any(row["id"] == marker["id"] and row["cost"] == 18 for row in state["charges"]), "pending cleared without full charge")
            if current["cfg"].get("fault") == "pending-unlink":
                raise OSError("controlled pending unlink failure")
        result = path.unlink()
        if path == current["pending"]:
            current["pending_cleared"] = True
        return result

def source_open(path, flags, mode=0o777):
    path = checked(path); event("write-attempt" if flags & (os.O_WRONLY | os.O_RDWR | os.O_CREAT) else "read", path)
    fd = os.open(path, flags, mode); owned_fds[fd] = path
    return fd

def source_fdopen(fd, *args, **kwargs):
    check(fd in owned_fds, "fdopen outside sandbox")
    return os.fdopen(fd, *args, **kwargs)

def source_fsync(fd):
    check(fd in owned_fds, "fsync outside sandbox")
    path = owned_fds[fd]
    if path == current["control"]:
        if current["cfg"].get("fault") == "cleanup-fsync" and current.get("pending_cleared"):
            raise OSError("controlled directory fsync failure after pending unlink")
        current["control_fsyncs"] += 1
        if current["cfg"].get("fault") == "pending-fsync" and current["control_fsyncs"] == 1:
            raise OSError("controlled pending-directory fsync failure")
    os.fsync(fd); event("fsync-confirmed", path)

def source_close(fd):
    check(fd in owned_fds, "close outside sandbox")
    return os.close(fd)

def source_unlink(path):
    path = checked(path); event("write-attempt", path)
    return os.unlink(path)

def source_replace(before, after):
    before, after = checked(before), checked(after)
    event("write-attempt", after)
    if after == current["stamp"] and current["cfg"].get("fault") == "completion-stamp":
        candidate = fixture_json(before)
        if candidate["inflight"] is None and candidate["outcome"] == "completed":
            raise OSError("controlled final stamp replacement failure")
    if after.parent == current["out"]:
        current["product_replaces"] += 1
        if current["cfg"].get("fault") == "product-replace-2" and current["product_replaces"] == 2:
            raise OSError("controlled partial output replacement failure")
    os.replace(before, after); event("replace-confirmed", after)

def source_temporary(**kwargs):
    directory = checked(kwargs["dir"])
    if directory == current["control"]:
        current["stamp_stages"] += 1
        if current["cfg"].get("fault") == "stamp-stage-" + str(current["stamp_stages"]):
            raise OSError("controlled atomic budget staging failure")
    if directory == current["out"]:
        current["output_stages"] += 1
        if current["cfg"].get("fault") == "output-stage-3" and current["output_stages"] == 3:
            raise OSError("controlled output staging failure")
    event("write-attempt", directory)
    stream = fixture_call(tempfile.NamedTemporaryFile, **kwargs)
    owned_fds[stream.fileno()] = Path(stream.name)
    return stream

def source_flock(fd, operation):
    check(fd in owned_fds and owned_fds[fd] == current["lock"], "flock outside stable sandbox lock")
    fcntl.flock(fd, operation); event("flock-acquired", current["lock"])
    if current["cfg"].get("fault") == "recheck-budget":
        updated = baseline("recent", 3)
        updated["last_run_ticks"] = None
        fixture_call(current["stamp"].write_text, json.dumps(updated), encoding="utf-8")
        current["recheck_injected"] = True

def baseline(kind="valid", usage=0):
    state = {"schema": "csoai.h1-caller-budget/2", "boot_id": BOOT,
             "last_run_ticks": None, "last_accounted_ticks": TICKS0,
             "charges": [], "inflight": None, "outcome": "owner_baseline"}
    if kind == "recent":
        state.update(last_run_ticks=TICKS0-10, last_accounted_ticks=TICKS0-10)
        state["charges"] = [{"id": "prior", "ticks": TICKS0-10, "wall_at": T0-10, "cost": usage}]
    elif kind == "expired":
        state.update(last_run_ticks=TICKS0-3600, last_accounted_ticks=TICKS0-3600)
        state["charges"] = [{"id": "prior", "ticks": TICKS0-3600, "wall_at": T0-3600, "cost": 20}]
    elif kind == "future":
        state["last_accounted_ticks"] = TICKS0 + 1
    elif kind == "nonfinite":
        state["last_accounted_ticks"] = float("nan")
    elif kind == "boot-mismatch":
        state["boot_id"] = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    elif kind == "boot-unknown":
        state["boot_id"] = None
    elif kind == "inflight":
        state["inflight"] = {"id": "interrupted", "cost": 18, "phase": "probing"}
    return state

def no_network(*args, **kwargs):
    raise AssertionError("real urllib/probe capability denied")

def source_print(*args, **kwargs):
    sink = kwargs.pop("file", current["stdout"])
    check(sink is current["stdout"] or sink is current["stderr"], "print outside controlled streams")
    return builtins.print(*args, file=sink, **kwargs)

def execute_main(namespace, argv):
    saved = namespace["sys"].argv
    namespace["sys"].argv = ["generate-h1-product-docs.py"] + list(argv)
    try:
        namespace["main"]()
        return 0
    except SystemExit as error:
        return error.code if type(error.code) is int else (0 if error.code is None else 1)
    finally:
        namespace["sys"].argv = saved

def controlled_probe(url):
    number = len(current["calls"]) + 1
    check(number <= 18 and url == current["expected_urls"][number-1], "unexpected or redundant caller probe")
    state, marker = fixture_json(current["stamp"]), fixture_json(current["pending"])
    check(state["inflight"]["id"] == marker["id"] and state["inflight"]["cost"] == 18, "probe before full reservation")
    charge = [item for item in state["charges"] if item["id"] == marker["id"]]
    check(len(charge) == 1 and charge[0]["cost"] == 18 and charge[0]["ticks"] == current["clock"], "probe before latest durable batch refresh")
    check(any(row["kind"] == "fsync-confirmed" and row["path"] == str(current["control"]) for row in current["events"]), "probe before durable control commit")
    current["calls"].append(url)
    if current["cfg"].get("nested_main") and number == 1:
        before = len(current["calls"])
        current["nested_exit"] = execute_main(current["namespace"], ["--force"])
        check(current["nested_exit"] == 2 and len(current["calls"]) == before, "second main spent through active reservation")
    step = current["cfg"].get("step", 1)
    current["clock"] += step
    current["wall"] += step
    if number == 1:
        current["wall"] += current["cfg"].get("wall_jump", 0)
        if current["cfg"].get("rollback_ticks"):
            current["clock"] -= 20
        if current["cfg"].get("change_boot"):
            current["boot"] = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    if current["cfg"].get("raise_at") == number:
        raise RuntimeError("controlled unexpected probe error")
    if current["cfg"].get("unavailable_at") == number:
        return {"url": url, "status": None, "bytes": 0, "sha256": "", "sample": "", "error": "controlled unavailable"}
    status = (200, 402, 503)[(number-1) % 3]
    raw = b"" if number == 1 else json.dumps({"fixture": url, "x402Version": 1, "accepts": [{"scheme": "unpaid-fixture"}]}).encode("utf-8")
    value = {"url": url, "status": status, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest(),
             "sample": raw[:600].decode(errors="replace"), "x402": current["namespace"]["x402_shape"](raw), "error": None}
    if current["cfg"].get("malformed_at") == number:
        value["sha256"] = "not-a-digest"
    current["values"][url] = value
    return value

safe_builtins = {name: getattr(builtins, name) for name in (
    "Exception", "OSError", "ValueError", "FileNotFoundError", "SystemExit",
    "isinstance", "len", "str", "dict", "list", "set", "tuple", "type", "int", "float", "bool", "all", "any", "sum", "__build_class__",
)}
safe_builtins["print"] = source_print

def source_utc_strftime(wall, pattern):
    # Keep product __import__ unavailable. Perform the one admitted UTC format
    # in fixture-owned code rather than invoking a datetime C method from the
    # product's restricted builtins frame. The audit hook still applies.
    check(pattern == "%Y-%m-%dT%H:%M:%SZ", "unadmitted datetime format")
    return datetime.fromtimestamp(wall, timezone.utc).strftime(pattern)


def source_datetime_now(zone):
    check(zone is timezone.utc, "unadmitted datetime timezone")
    wall = current["wall"]
    return SimpleNamespace(strftime=lambda pattern: source_utc_strftime(wall, pattern))


def new_namespace(case_root):
    clock = SimpleNamespace(time=lambda: current["wall"], monotonic=lambda: current["clock"])
    safe_os = SimpleNamespace(
        environ={"CSOAI_H1_CONTROL_DIR": str(current["control"])}, getpid=os.getpid,
        O_RDONLY=os.O_RDONLY, O_DIRECTORY=os.O_DIRECTORY, O_WRONLY=os.O_WRONLY, O_CREAT=os.O_CREAT, O_EXCL=os.O_EXCL,
        open=source_open, fdopen=source_fdopen, fsync=source_fsync, close=source_close, unlink=source_unlink, replace=source_replace,
    )
    namespace = {
        "__builtins__": safe_builtins, "__name__": "h1_controlled_fixture",
        "__file__": str(case_root / "repo" / "scripts" / "badger" / "generate-h1-product-docs.py"),
        "Path": SandboxPath, "os": safe_os, "tempfile": SimpleNamespace(NamedTemporaryFile=source_temporary),
        "fcntl": SimpleNamespace(flock=source_flock, LOCK_EX=fcntl.LOCK_EX, LOCK_NB=fcntl.LOCK_NB),
        "json": SimpleNamespace(loads=json.loads, dumps=json.dumps), "hashlib": SimpleNamespace(sha256=hashlib.sha256),
        "sys": SimpleNamespace(argv=[], stderr=current["stderr"]), "time": clock,
        "datetime": SimpleNamespace(now=source_datetime_now), "timezone": timezone,
        "urllib": SimpleNamespace(request=SimpleNamespace(Request=no_network, urlopen=no_network), error=SimpleNamespace(HTTPError=RuntimeError)),
    }
    exec(compile(module, "h1-controlled-main-source", "exec"), namespace)
    check(not any(row["kind"] == "write-attempt" for row in current["events"]), "module initialization wrote files")
    namespace["BASE"] = "https://fixture.invalid"
    namespace["probe"] = controlled_probe
    current["namespace"] = namespace
    return namespace

results = []
try:
    for cfg in CASE_SPECS:
        case_root = root / cfg["id"]
        control, out = case_root / "control", case_root / "repo" / "docs" / "product"
        fixture_call(control.mkdir, parents=True)
        fixture_call((case_root / "repo" / "scripts" / "badger").mkdir, parents=True)
        current = {"cfg": cfg, "control": control, "out": out, "stamp": control / "h1-product-docs.last",
                   "lock": control / "h1-product-docs.lock", "pending": control / "h1-product-docs.pending",
                   "clock": float("nan") if cfg.get("nan_ticks") else TICKS0, "wall": T0 + cfg.get("wall_offset", 0),
                   "boot": cfg.get("sample_boot", BOOT), "events": [], "calls": [], "values": {}, "stdout": io.StringIO(), "stderr": io.StringIO(),
                   "control_fsyncs": 0, "stamp_stages": 0, "output_stages": 0, "product_replaces": 0,
                   "expected_urls": ["https://fixture.invalid" + value for value in payload["url_suffixes"]]}
        kind = cfg.get("baseline", "valid")
        if kind != "missing":
            state_text = str(T0-7200) if kind == "legacy" else ("{" if kind == "corrupt" else json.dumps(baseline(kind, cfg.get("usage", 0))))
            fixture_call(current["stamp"].write_text, state_text, encoding="utf-8")
        if cfg.get("pending"):
            fixture_call(current["pending"].write_text, "interrupted-owner-marker", encoding="utf-8")
        old_products = {}
        if cfg.get("old_products"):
            fixture_call(out.mkdir, parents=True)
            for name in payload["output_names"]:
                old_products[name] = "OLD-SANDBOX-COPY:" + name
                fixture_call((out/name).write_text, old_products[name], encoding="utf-8")
        holder = None
        if cfg.get("hold_lock"):
            holder = fixture_call(current["lock"].open, "a+b")
            fcntl.flock(holder.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        namespace = new_namespace(case_root)
        try:
            code = execute_main(namespace, cfg.get("argv", []))
        finally:
            if holder is not None:
                holder.close()
        check(code == cfg["exit"], cfg["id"] + ": unexpected exit " + str(code)
              + "; captured_stderr=" + current["stderr"].getvalue()[-2000:]
              + "; caller_attempts=" + str(len(current["calls"]))
              + "; recent_effects=" + json.dumps(current["events"][-8:]))
        check(len(current["calls"]) == cfg["calls"], cfg["id"] + ": caller count")
        writes = [row for row in current["events"] if row["kind"] == "write-attempt"]
        if cfg.get("no_writes"):
            check(not writes, cfg["id"] + ": premature filesystem writes")
        if cfg.get("no_reads"):
            check(not any(row["kind"] in {"read", "stat", "boot-identity-read"} for row in current["events"]), cfg["id"] + ": CLI read control state")
        if cfg["calls"] == 0:
            check(not any(row["kind"] == "write-attempt" and row["path"] == str(out) for row in current["events"]), "outdir before probes")
        pending_exists = fixture_call(current["pending"].exists)
        if "pending_after" in cfg:
            check(pending_exists == cfg["pending_after"], cfg["id"] + ": pending marker")
        state = None
        if cfg.get("charge") or cfg.get("success") or cfg.get("outcome"):
            state = fixture_json(current["stamp"])
        if cfg.get("charge"):
            check(state["charges"][-1]["cost"] == cfg["charge"], "full plan charge lost")
        if cfg.get("outcome"):
            check(state["outcome"] == cfg["outcome"], "incorrect durable outcome")
        if cfg.get("success") or cfg.get("products_new"):
            actual_names = sorted(fixture_call(lambda: [value.name for value in out.iterdir()]))
            check(actual_names == sorted(payload["output_names"]), "unexpected output set or leftover staging file")
            index = fixture_json(out / "_INDEX.json")
            check(index["sku_count"] == 9 and index["skus"] == [{"id": sku, "file": "docs/product/"+sku+".md"} for sku in payload["skus"]], "index consumer identities")
            for offset, sku in enumerate(payload["skus"]):
                text = fixture_call((out/(sku+".md")).read_text, encoding="utf-8")
                preview, resource = current["expected_urls"][offset], current["expected_urls"][offset+9]
                check(preview in text and resource in text and current["values"][preview]["sha256"][:16] in text, "consumer observation pairing lost")
                check("Payment, returned artifact bytes, verification, receipt by the buyer and acceptance remain separate." in text, "observation files confused with paid outcomes")
            commits = [Path(row["path"]).name for row in current["events"] if row["kind"] == "replace-confirmed" and Path(row["path"]).parent == out]
            check(commits == payload["output_names"], "index not committed last")
        if cfg.get("success"):
            check(not pending_exists and state["inflight"] is None and state["outcome"] == "completed", "completion did not close state")
            check(state["last_run_ticks"] == current["clock"] and state["charges"][-1]["ticks"] == current["clock"], "completion does not retain latest full charge")
            check("DONE" in current["stdout"].getvalue(), "missing truthful completion")
        elif code != 0:
            check("DONE" not in current["stdout"].getvalue(), "false completion after refusal")
        if cfg.get("unchanged_products"):
            check(all(fixture_call((out/name).read_text, encoding="utf-8") == text for name,text in old_products.items()), "failed run overwrote old product bytes")
        if cfg.get("partial_products"):
            check(fixture_call((out/payload["output_names"][0]).read_text, encoding="utf-8") != old_products[payload["output_names"][0]], "expected first atomic replacement")
            check(all(fixture_call((out/name).read_text, encoding="utf-8") == old_products[name] for name in payload["output_names"][1:]), "partial run replaced later output or index")
        if cfg.get("retry_refused"):
            spent = len(current["calls"])
            retry = execute_main(namespace, ["--force"])
            check(retry == 2 and len(current["calls"]) == spent, "automatic retry bypassed accounting/pending")
        if cfg.get("nested_main"):
            check(current.get("nested_exit") == 2, "missing second-main refusal")
        if cfg.get("fault") == "recheck-budget":
            check(current.get("recheck_injected") and any(row["kind"] == "flock-acquired" for row in current["events"]), "under-lock recheck not exercised")
        results.append({"id": cfg["id"], "exit": code, "caller_attempts": len(current["calls"]), "pending": pending_exists, "passed": True})
    # Exercise the actual admission helper independently at the20/21 boundary.
    check(namespace["check_admission"](baseline(), {"boot_id": BOOT, "ticks": TICKS0, "wall": T0}, 20, True) == [], "20-call limit refused")
    try:
        namespace["check_admission"](baseline(), {"boot_id": BOOT, "ticks": TICKS0, "wall": T0}, 21, True)
    except namespace["RunControlError"]:
        limit_guard = True
    else:
        raise AssertionError("force admitted21 callers")
    denied = []
    for name, attempt in (("file", lambda: io.open("/fixture-must-never-exist", "rb")), ("socket", lambda: socket.socket())):
        try:
            attempt()
        except AssertionError:
            denied.append(name)
        else:
            raise AssertionError("outside capability control failed: " + name)
    check(denied == ["file", "socket"], "missing denial controls")
finally:
    fixture_call(sandbox.cleanup)
print(json.dumps({"source_sha256": hashlib.sha256(source.encode("utf-8")).hexdigest(), "results": results,
                  "module_top_level_guard": module_guard, "actual_admission_limit_guard": limit_guard,
                  "denied_effect_controls": denied}, ensure_ascii=False))
`;

describe.skipIf(process.env.GITHUB_ACTIONS !== 'true')('H1 controlled CLI, budget and publication admission', () => {
  it('exercises actual main with real sandboxed files and flock, controlled unpaid probes and fail-closed state', () => {
    const source = readFileSync(new URL('./badger/generate-h1-product-docs.py', import.meta.url), 'utf8');
    const outputNames = [...SKUS.map(sku => sku + '.md'), '_INDEX.json'];
    const urlSuffixes = ["/api/request-attestation", "/api/evidence-bundle?obligation=article-50", "/api/evidence-bundle?obligation=article-53", "/api/evidence-bundle?obligation=dora", "/api/rwa/evidence?asset=RLUSD&preview=1", "/api/eunomia-data", "/api/feeds/provider-diff", "/api/receipts/batch?from=2026-09-01&to=2026-09-05&preview=1", "/api/art50/marking-evidence?url=https://councilof.ai/&preview=1", "/api/request-attestation?subject=csoai&axis=honesty", "/api/evidence-bundle?obligation=article-50&subject=csoai&bundle=1", "/api/evidence-bundle?obligation=article-53&subject=csoai&bundle=1", "/api/evidence-bundle?obligation=dora&subject=csoai&bundle=1", "/api/rwa/evidence?asset=RLUSD", "/api/eunomia-data?feed=1", "/api/feeds/provider-diff?history=1", "/api/receipts/batch?from=2026-09-01&to=2026-09-05", "/api/art50/marking-evidence?url=https://councilof.ai/"];
    const output = execFileSync('python3', ['-I', '-B', '-X', 'utf8', '-c', PYTHON_MAIN_CONTROLS], {
      input: JSON.stringify({ source, skus: SKUS, output_names: outputNames, url_suffixes: urlSuffixes }),
      encoding: 'utf8', timeout: 45_000, maxBuffer: 4 * 1024 * 1024,
      env: { PATH: process.env.PATH ?? '' },
    });
    const actual = JSON.parse(output) as {
      source_sha256: string;
      results: { id: string; exit: number; caller_attempts: number; pending: boolean; passed: boolean }[];
      module_top_level_guard: boolean; actual_admission_limit_guard: boolean; denied_effect_controls: string[];
    };
    expect(actual.source_sha256).toBe(createHash('sha256').update(source, 'utf8').digest('hex'));
    expect(actual.results.map(row => row.id)).toEqual(["cli-dry-no-effects", "cli-force-dry-no-effects", "cli-unknown-no-effects", "cli-unknown-force-no-effects", "cli-unknown-dry-no-effects", "baseline-missing-refused", "baseline-legacy-refused", "baseline-corrupt-refused", "baseline-future-refused", "baseline-nonfinite-refused", "baseline-inflight-refused", "pending-marker-refused", "cooldown-refuses-before-lock-write", "force-bypasses-cooldown-only", "force-cannot-exceed-hour-budget", "exact20-budget-admitted", "exact60-minute-window-expires", "stamp-read-error-refused", "actual-flock-busy-refused", "budget-rechecked-after-flock", "pending-fsync-failure-refused", "reservation-write-failure-refused", "refresh-write-failure-refused", "fresh-owner-baseline-18-to10", "long-run-charged-through-completion", "unavailable-aborts-before-products", "malformed-aborts-before-products", "unexpected-probe-error-keeps-reservation", "staging-error-preserves-old-products", "partial-replace-keeps-old-index-and-pending", "completion-stamp-failure-keeps-pending", "pending-unlink-failure-blocks-retry", "second-main-cannot-pass-active-reservation", "wall-forward-does-not-expire-budget", "wall-backward-does-not-expire-budget", "wall-forward-does-not-bypass-cooldown", "wall-backward-during-run-is-metadata", "boot-mismatch-refused", "boot-unknown-refused", "invalid-boot-sample-refused", "unavailable-boot-sample-refused", "nonfinite-monotonic-sample-refused", "monotonic-rollback-keeps-pending", "boot-change-during-run-keeps-pending", "cleanup-fsync-after-unlink-no-marker-claim", "all-dash-boot-identity-refused", "extra-dash-boot-identity-refused"]);
    expect(actual.results.every(row => row.passed)).toBe(true);
    expect(actual.module_top_level_guard).toBe(true);
    expect(actual.actual_admission_limit_guard).toBe(true);
    expect(actual.denied_effect_controls).toEqual(['file', 'socket']);
  }, 60_000);
});
