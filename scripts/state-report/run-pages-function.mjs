// Invoke one Cloudflare Pages Function file in node (static-build emulation for a local link check).
import { build } from "esbuild";
const [file, url] = process.argv.slice(2);
const out = "/tmp/sr-fn-" + process.pid + ".mjs";
await build({ entryPoints: [file], bundle: true, format: "esm", platform: "neutral", outfile: out, logLevel: "error",
  loader: { ".json": "json" }, mainFields: ["module", "main"] });
const m = await import(out);
const fn = m.onRequestGet || m.onRequest;
const request = new Request(url);
const res = await fn({ request, env: {}, params: {}, next: async () => new Response("", { status: 404 }), waitUntil() {}, data: {} });
const body = await res.text();
process.stdout.write(JSON.stringify({ status: res.status, ct: res.headers.get("content-type"), body }));
