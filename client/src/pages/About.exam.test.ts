/**
 * /about/ answered "How long does the attestation exam take?" with 50 questions, 90 minutes and a 70% pass
 * mark (read live 18 Nov 2026). The exam is retracted: its route answers 308 to /honesty/, so the FAQ
 * may describe no exam length, question count or pass mark. The route is imported, not restated, so if
 * an exam is ever served again this test fails and the FAQ is rewritten from what is served.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { onRequest as examRoute } from "../../../functions/certification/exam";
import { onRequest as examRouteSlash } from "../../../functions/certification/exam/index";

const about = readFileSync(resolve(__dirname, "About.tsx"), "utf8");

describe("/about/ describes the exam the site serves", () => {
  it("the exam route is retracted, with and without the slash", () => {
    for (const route of [examRoute, examRouteSlash]) {
      const r = route();
      expect(r.status).toBe(308);
      expect(r.headers.get("location")).toBe("/honesty/");
    }
  });

  it("so the FAQ quotes no exam length, question count or pass mark", () => {
    expect(about).not.toMatch(/\d+\s+questions/i);
    expect(about).not.toMatch(/\d+\s+minutes/i);
    expect(about).not.toMatch(/passing threshold|pass mark of/i);
    expect(about).toMatch(/attestation exam has been retracted/);
  });
});
