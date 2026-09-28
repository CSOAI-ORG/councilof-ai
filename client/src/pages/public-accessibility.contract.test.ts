import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(__dirname, "Quickstart.tsx"), "utf8");
const syntax = ts.createSourceFile("Quickstart.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const codeNode = syntax.statements.find(statement => ts.isVariableStatement(statement)
  && statement.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === "Code"));
if (!codeNode) throw new Error("Quickstart Code component not found");
const js = ts.transpileModule(`${codeNode.getText(syntax)}\nreturn Code;`, {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const Code = new Function("React", js)(React);
const rendered = renderToStaticMarkup(createElement(Code, null, "curl --help"));
const pre = rendered.match(/^<pre\b[^>]*>/)?.[0] ?? "";

describe("public evidence pages: accessibility and recovery contracts", () => {
  it("puts the scrollable code example in the keyboard sequence", () => expect(pre).toContain('tabindex="0"'));
  it("names the code region for assistive technology", () => {
    expect(pre).toContain('role="region"');
    expect(pre).toContain('aria-label="Scrollable code example"');
  });
  it("retains scrolling and visible keyboard focus", () => {
    expect(pre).toContain("overflow-x-auto");
    expect(pre).toContain("focus-visible:outline-2");
    expect(pre).toContain("focus-visible:outline-emerald-400");
  });
  it("escapes code text instead of rendering controls", () => {
    const html = renderToStaticMarkup(createElement(Code, null, '<button>example</button>'));
    expect(html).toContain("&lt;button&gt;example&lt;/button&gt;");
    expect(html).not.toContain("<button>");
  });
  it("keeps the readable service-card fallback", () => {
    const page = readFileSync(resolve(__dirname, "Services.tsx"), "utf8");
    expect(page).toContain('text-[12px] text-slate-400');
    expect(page).not.toContain('text-[12px] text-slate-500');
  });
  it("gives an unread catalogue an explicit retry without inventing doors", () => {
    const page = readFileSync(resolve(__dirname, "Services.tsx"), "utf8");
    expect(page).toContain("Retry manifest read");
    expect(page).toContain("setRetryToken((value) => value + 1)");
    expect(page).toContain("setLoad({ state: \"loading\" })");
    expect(page).toContain("[retryToken]");
    expect(page).toContain('data-testid="services-unread"');
  });
});
