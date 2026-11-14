/**
 * The three Python clients that sign through POST /api/board-sign by GitHub OIDC print the
 * signer's unsigned `caller` echo to stderr, so each signing run logs how a stricter signer
 * would treat it (signing move, step 2 of 9, 13 Oct 2026).
 *
 * What this pins:
 *   - the helper is the same text in all three files (three copies, so one test must hold them
 *     together; a shared module would be a new import on the hourly root's path);
 *   - each client calls it once, on the parsed reply, before it reads the signature;
 *   - it prints once per run and once per different strict verdict, says "would-refuse" with
 *     the reason, and never raises on a reply of any shape;
 *   - it prints to stderr only. stdout carries the clients' SIGNED lines and is not touched.
 *
 * The behaviour is run in a real python3 child process against the two clients that import
 * with the standard library alone. The publisher's copy is held to them by the text check;
 * that it still imports is checked by the existing pytest step (test_public_root.py).
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const CLIENTS = ["sign_financial_runs.py", "sign_fin_coverage.py", "publish_public_root.py"];
const read = (name) => readFileSync(join(SCRIPTS, name), "utf8");

/** The helper block: from its module-level set to the end of its function body. */
function helperBlock(text) {
  const start = text.indexOf("_CALLER_VERDICTS_PRINTED = set()");
  expect(start).toBeGreaterThan(0);
  const rest = text.slice(start);
  const end = rest.search(/\n\n\ndef (?!_log_board_sign_caller)/);
  expect(end).toBeGreaterThan(0);
  return rest.slice(0, end);
}

describe("board-sign caller log in the Python signing clients", () => {
  it("is the same helper text in all three clients", () => {
    const [a, b, c] = CLIENTS.map((f) => helperBlock(read(f)));
    expect(a).toContain("def _log_board_sign_caller(reply) -> None:");
    expect(a).toContain("file=sys.stderr");
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it("is called once per client, on the parsed reply, before the signature is read", () => {
    for (const f of CLIENTS) {
      const text = read(f);
      const calls = [...text.matchAll(/^\s+_log_board_sign_caller\(out\)$/gm)];
      expect(calls.length, f).toBe(1);
      const at = calls[0].index;
      const parsed = text.lastIndexOf("out = json.loads(resp.read().decode(\"utf-8\"))", at);
      expect(parsed, f).toBeGreaterThan(0);
      const sigRead = text.indexOf("out.get(\"sig_ed25519\")", at);
      expect(sigRead, f).toBeGreaterThan(at);
      // nothing but error handling sits between the parse and the log line
      expect(text.slice(parsed, at), f).not.toMatch(/\bdef \w+\(/);
    }
  });

  it("never prints the bearer: the helper reads only the reply's caller object", () => {
    const body = helperBlock(read(CLIENTS[0]));
    expect(body).not.toMatch(/oidc|req_tok|Authorization|Bearer|environ/);
  });

  for (const mod of ["sign_financial_runs", "sign_fin_coverage"]) {
    it(`${mod}: once per run, once per different verdict, stderr only, never raises`, () => {
      const program = `
import json, sys
sys.path.insert(0, sys.argv[1])
import ${mod} as m
log = m._log_board_sign_caller
def caller(ok, reason, run="1"):
    return {"sig_ed25519": "00" * 64, "caller": {"route": "github-oidc", "ref": "refs/heads/master", "run_id": run, "strict": {"pass": ok, "reason": reason}}}
log(caller(True, None))
log(caller(True, None, run="2"))            # same verdict: not printed again
log(caller(False, "ref is not refs/heads/master"))
log(caller(False, "ref is not refs/heads/master", run="3"))   # same reason: not printed again
log(caller(False, "exp is missing or not a number"))
log({"sig_ed25519": "00" * 64, "caller": {"route": "pod-token", "strict": None}})
for junk in (None, "text", 7, [], {}, {"caller": 5}, {"caller": []}, {"caller": {"strict": []}}, {"caller": {"strict": {"pass": []}}}):
    log(junk)
print("STDOUT-UNTOUCHED")
`;
      const r = spawnSync("python3", ["-c", program, SCRIPTS], { encoding: "utf8" });
      expect(r.status, r.stderr).toBe(0);
      expect(r.stdout).toBe("STDOUT-UNTOUCHED\n");
      const lines = r.stderr.split("\n").filter(Boolean);
      // Four lines: pass, two different would-refuse reasons, and one reply with no verdict (the
      // pod-token echo). The repeats and every junk reply add nothing.
      expect(lines.length, r.stderr).toBe(4);
      expect(lines.every((l) => l.startsWith("board-sign caller strict="))).toBe(true);
      expect(lines[0]).toMatch(/^board-sign caller strict=pass \{.*"run_id": "1".*\}$/);
      expect(lines[1]).toMatch(/^board-sign caller strict=would-refuse \{.*"reason": "ref is not refs\/heads\/master".*\}$/);
      expect(lines[2]).toMatch(/^board-sign caller strict=would-refuse \{.*"reason": "exp is missing or not a number".*\}$/);
      expect(lines[3]).toMatch(/^board-sign caller strict=none \{.*"route": "pod-token".*\}$/);
      // each printed line is the reply's caller object as JSON
      expect(JSON.parse(lines[0].replace("board-sign caller strict=pass ", "")).ref).toBe("refs/heads/master");
    });
  }
});
