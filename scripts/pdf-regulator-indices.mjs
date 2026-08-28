#!/usr/bin/env node
/**
 * NEXT_300 #149 — regenerate public/regulator-indices-one-pager.pdf from the
 * print HTML. Requires a running vite (or pass BASE_URL). Never invents scores.
 *
 *   npm run pdf:regulator-indices
 *   BASE_URL=http://127.0.0.1:43125 npm run pdf:regulator-indices
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public/regulator-indices-one-pager.pdf");
const base = process.env.BASE_URL || "http://127.0.0.1:43125";
const url = `${base.replace(/\/$/, "")}/regulator-indices-one-pager.html`;

mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  if (!res || !res.ok()) {
    throw new Error(`GET ${url} → ${res?.status() ?? "no response"} (start vite first)`);
  }
  await page.pdf({
    path: out,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
  });
  console.log(`wrote ${out}`);
} finally {
  await browser.close();
}
