#!/usr/bin/env node
// Run from a Council repository containing the HITL UI and backend fixes:
// node scripts/hitl/ui-acceptance.mjs --output /absolute/path/acceptance.json --chromium /absolute/path/chrome
// Requires existing repository dependencies and an installed Chromium. Installs nothing.
// Uses only synthetic cases, an in-memory store and an ephemeral signer. No provider,
// account, production API or real human decision is used. This is functional acceptance;
// keyboard-only, authenticated identity and production acceptance are separate gates.
import path from "node:path";
import os from "node:os";
import { parseArgs } from "node:util";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { webcrypto, createHash } from "node:crypto";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { chromium } from "playwright";
const { values: options } = parseArgs({
  options: { output: { type: "string" }, chromium: { type: "string" } },
});
if (!options.output || !path.isAbsolute(options.output))
  throw Error("--output must be an absolute report path");
const repo = process.cwd(),
  output = options.output;
const base = await fs.mkdtemp(
  path.join(os.tmpdir(), "council-hitl-acceptance-"),
);
const digest = (s) => createHash("sha256").update(s).digest("hex");
const sourceFiles = [
  "client/src/components/HitlConsole.tsx",
  "client/src/components/HitlDecisionHistory.tsx",
  "client/src/lib/hitlRecord.ts",
  "client/src/lib/hitlRequest.ts",
  "client/src/styles/index.css",
  "functions/api/hitl.ts",
  "functions/api/_hitl.ts",
  "functions/api/_head.ts",
  "functions/_lib/cardSign.ts",
];
const result = {
  keyboard_only_acceptance:
    "NOT_TESTED: functional selection uses Playwright selectOption",
  scope:
    "isolated real UI and handler composition; synthetic board, memory store and ephemeral fixture signer; zero production requests",
  source_scope:
    "current repository file bytes; no claim about a deployed version",
  checks: [],
  errors: [],
  requests: [],
};
const values = new Map(),
  responses = [];
let api, env, server, browser;
const kv = {
  get: async (k) => values.get(k) ?? null,
  put: async (k, v) => values.set(k, v),
  list: async ({ prefix }) => ({
    keys: [...values.keys()]
      .filter((k) => k.startsWith(prefix))
      .map((name) => ({ name })),
    list_complete: true,
  }),
};
const apiPlugin = {
  name: "isolated-hitl-handlers",
  configureServer(s) {
    s.middlewares.use(async (req, res, next) => {
      const u = new URL(req.url, "http://127.0.0.1");
      if (!u.pathname.startsWith("/api/hitl")) return next();
      try {
        const chunks = [];
        for await (const c of req) {
          chunks.push(c);
          if (Buffer.concat(chunks).length > 65536)
            throw Error("oversize fixture");
        }
        const body = Buffer.concat(chunks).toString();
        const request = new Request(u, {
          method: req.method,
          headers: req.headers,
          ...(req.method === "POST" ? { body } : {}),
        });
        const reply = await (
          req.method === "POST" ? api.onRequestPost : api.onRequestGet
        )({ request, env });
        const text = await reply.text();
        responses.push({ path: u.pathname, status: reply.status, text });
        result.requests.push({
          method: req.method,
          path: u.pathname,
          status: reply.status,
          body_sha256: body ? digest(body) : null,
          token_in_body: body.includes("fixture-only-operator"),
        });
        res.writeHead(reply.status, Object.fromEntries(reply.headers));
        res.end(text);
      } catch (e) {
        result.errors.push(String(e));
        res.writeHead(500);
        res.end("fixture error");
      }
    });
  },
};
try {
  for (const file of sourceFiles) {
    await fs.mkdir(path.dirname(path.join(base, file)), { recursive: true });
    await fs.copyFile(path.join(repo, file), path.join(base, file));
  }
  await fs.mkdir(path.join(base, "evidence"));
  await fs.symlink(
    path.join(repo, "node_modules"),
    path.join(base, "node_modules"),
    "dir",
  );
  await fs.writeFile(
    path.join(base, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  await fs.writeFile(
    path.join(base, "functions/api/_chatCanon.ts"),
    'export const loadBoard=async()=>({axes:[{axis:"governance",status:"MEASURED",separation:"TIE",n:10},{axis:"quality",status:"MEASURED",separation:"TIE",n:10}]});',
  );
  await fs.writeFile(
    path.join(base, "client/acceptance.html"),
    '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated human-review acceptance</title></head><body style="margin:0;background:white"><div id="root"></div><script type="module" src="/client/acceptance.tsx"></script></body></html>',
  );
  await fs.writeFile(
    path.join(base, "client/acceptance.tsx"),
    'import React from "react";import{createRoot}from"react-dom/client";import"./src/styles/index.css";import HitlConsole from"./src/components/HitlConsole";createRoot(document.getElementById("root")!).render(<HitlConsole/>);',
  );
  server = await createServer({
    configFile: false,
    root: base,
    plugins: [apiPlugin, react(), tailwind()],
    server: { host: "127.0.0.1", port: 0, watch: null },
    logLevel: "error",
  });
  api = await server.ssrLoadModule("/functions/api/hitl.ts");
  const h = await server.ssrLoadModule("/functions/api/_hitl.ts");
  const keys = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  const pkcs8 = Buffer.from(
    await webcrypto.subtle.exportKey("pkcs8", keys.privateKey),
  ).toString("base64");
  const publicHex = Buffer.from(
    await webcrypto.subtle.exportKey("raw", keys.publicKey),
  ).toString("hex");
  env = {
    HITL_KV: kv,
    HITL_DECIDE_TOKEN: "fixture-only-operator",
    BOARD_SIGN_KEY_PKCS8_B64: pkcs8,
  };
  const originals = [];
  for (const [axis, title] of [
    ["governance", "First fixture"],
    ["quality", "Second fixture"],
  ]) {
    const c = await h.buildChallenge({
      axis,
      subject: title,
      proposed_action: "Review " + title + " only",
      raised_by: "isolated fixture",
      at: "2026-10-30T00:00:00Z",
      source: "private-source-sentinel",
      facts: "private-facts-sentinel",
      required_module: null,
    });
    await h.putChallenge(kv, c);
    originals.push(c);
  }
  const originalBytes = values.get("hitl:challenge:" + originals[1].id);
  await server.listen();
  const origin = "http://127.0.0.1:" + server.httpServer.address().port;
  browser = await chromium.launch({
    ...(options.chromium ? { executablePath: options.chromium } : {}),
    headless: true,
  });
  const page = await browser.newPage({ acceptDownloads: true });
  page.on("pageerror", (e) => result.errors.push(e.message));
  await page.route("**/*", async (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  );
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + "/client/acceptance.html");
    await page.getByTestId("hitl-select-challenge").waitFor();
    assert.equal(
      await page.getByTestId("hitl-select-challenge").locator("option").count(),
      2,
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false);
    result.checks.push({ name: "two-case layout", width, pass: true });
  }
  await page.getByTestId("hitl-select-challenge").selectOption(originals[1].id);
  await page
    .getByTestId("hitl-challenge")
    .filter({ hasText: "Review Second fixture only" })
    .waitFor();
  result.checks.push({
    name: "native selector chooses exact second case",
    pass: true,
  });
  const module = h.deriveModule(
    {
      axes: [{ axis: "quality", status: "MEASURED", separation: "TIE", n: 10 }],
    },
    "quality",
  );
  await page
    .getByTestId("hitl-option-" + module.correct_option)
    .locator("input")
    .check();
  await page.getByTestId("hitl-submit-module").click();
  await page
    .getByTestId("hitl-module-result")
    .filter({ hasText: "Correct." })
    .waitFor();
  await page.getByTestId("hitl-operator").fill("Isolated fixture reviewer");
  await page.getByTestId("hitl-token").fill("fixture-only-operator");
  await page
    .getByTestId("hitl-note")
    .fill("Fixture only; no action will execute.");
  await page.getByTestId("hitl-decide-HOLD").click();
  await page
    .getByTestId("hitl-receipt")
    .filter({ hasText: originals[1].id })
    .waitFor();
  await page
    .getByRole("status")
    .filter({ hasText: "Current public record loaded" })
    .waitFor();
  const decision = responses.find((r) => r.path === "/api/hitl/decision");
  assert.equal(decision.status, 200);
  const receipt = JSON.parse(decision.text).receipt;
  assert.equal(receipt.challenge.id, originals[1].id);
  assert.equal(
    result.requests.filter(
      (r) => r.method === "POST" && r.path.endsWith("decision"),
    ).length,
    1,
  );
  assert.equal(
    result.requests.some((r) => r.token_in_body),
    false,
  );
  result.checks.push({
    name: "queue to competency to exact held decision",
    pass: true,
  });
  const verified = await h.verifyHitlReceipt(receipt, publicHex);
  assert.equal(verified.sig_ok, true);
  assert.equal(verified.sha_ok, true);
  const altered = await h.verifyHitlReceipt(
    { ...receipt, note: "altered" },
    publicHex,
  );
  assert.equal(altered.sha_ok, false);
  assert.equal(altered.sig_ok, false);
  result.checks.push({
    name: "fixture signature verified and altered receipt rejected independently",
    pass: true,
  });
  assert.equal(values.get("hitl:challenge:" + originals[1].id), originalBytes);
  assert.equal(
    responses.some(
      (r) =>
        r.text.includes("private-source-sentinel") ||
        r.text.includes("private-facts-sentinel"),
    ),
    false,
  );
  result.checks.push({
    name: "original preserved and private fields absent from responses",
    pass: true,
  });
  const history = responses
    .filter((r) => r.path === "/api/hitl/record")
    .at(-1).text;
  const waiter = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save decision record", exact: true })
    .click();
  const downloaded = await waiter;
  const file = base + "/evidence/fixture-history.json";
  await downloaded.saveAs(file);
  const saved = await fs.readFile(file, "utf8");
  assert.equal(saved, history);
  result.checks.push({
    name: "download equals exact handler history response",
    pass: true,
    sha256: digest(saved),
  });
  await page.reload();
  await page
    .getByRole("status")
    .filter({ hasText: "Current public record loaded" })
    .waitFor();
  assert.equal(await page.getByTestId("hitl-token").inputValue(), "");
  const before = result.requests.length;
  await page.getByLabel("Reopen saved decision record").setInputFiles(file);
  await page
    .getByRole("status")
    .filter({ hasText: "Saved snapshot reopened locally" })
    .waitFor();
  assert.equal(result.requests.length, before);
  assert.equal(
    await page.locator("summary").filter({ hasText: "HOLD" }).count(),
    1,
  );
  result.checks.push({
    name: "new-page local reopen without another request or retained token",
    pass: true,
  });
} catch (e) {
  result.errors.push(String(e));
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  result.source_sha256 = {};
  for (const file of sourceFiles) {
    try {
      result.source_sha256[file] = digest(await fs.readFile(base + "/" + file));
    } catch {
      result.source_sha256[file] = null;
    }
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(result, null, 2), { flag: "wx" });
  // Only remove the unique temporary directory created by this invocation.
  await fs.rm(base, { recursive: true, force: true });
  console.log(
    JSON.stringify({
      report: output,
      checks: result.checks.length,
      errors: result.errors,
    }),
  );
}
if (result.errors.length || result.checks.length !== 8) process.exitCode = 1;