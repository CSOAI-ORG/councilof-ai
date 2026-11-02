import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Compile the actual, side-effect-free Code component; do not render the page's network hooks.
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

describe("public evidence pages: scoped accessibility contracts", () => {
  it("puts the scrollable code example in the keyboard sequence", () => {
    expect(pre).toContain('tabindex="0"');
  });
  it("names the code region for assistive technology", () => {
    expect(pre).toContain('role="region"');
    expect(pre).toContain('aria-label="Scrollable code example"');
  });
  it("retains horizontal scrolling and a visible keyboard-focus treatment", () => {
    expect(pre).toContain("overflow-x-auto");
    expect(pre).toContain("focus-visible:outline-2");
    expect(pre).toContain("focus-visible:outline-emerald-400");
  });
  it("keeps code as escaped text rather than interactive markup", () => {
    const html = renderToStaticMarkup(createElement(Code, null, '<button>example</button>'));
    expect(html).toContain("&lt;button&gt;example&lt;/button&gt;");
    expect(html).not.toContain("<button>");
    expect(html).toContain("<code>");
  });
  it("uses the lighter text token for the dark service-card fallback", () => {
    const page = readFileSync(resolve(__dirname, "Services.tsx"), "utf8");
    expect(page).toMatch(/<p className="mt-3 text-\[12px\] text-slate-400">\s*No preview link is supplied for this record\./);
    expect(page).not.toContain('className="mt-3 text-[12px] text-slate-500"');
  });
});
