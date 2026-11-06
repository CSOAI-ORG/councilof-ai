import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import FaqPage from "./FaqPage";
import LegacyFAQ from "./FAQ";
import { FAQ_ITEMS } from "../data/home-faq";

const render = () => renderToStaticMarkup(createElement(Router, {
  ssrPath: "/faq",
  children: createElement(FaqPage),
}));

describe("canonical public FAQ", () => {
  it("keeps the legacy import on the same component", () => {
    expect(LegacyFAQ).toBe(FaqPage);
  });

  it("publishes the same twelve answers in visible content and structured data", () => {
    const html = render();
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]));
    const faq = schemas.find((schema) => schema["@type"] === "FAQPage");
    expect(faq.mainEntity).toHaveLength(12);
    for (const [index, item] of FAQ_ITEMS.entries()) {
      expect(faq.mainEntity[index].name).toBe(item.q);
      expect(faq.mainEntity[index].acceptedAnswer.text).toBe(item.a);
      expect(html).toContain(renderToStaticMarkup(createElement(Fragment, null, item.a)));
    }
  });

  it("links every question to its rendered anchor, including the named buying entry", () => {
    const html = render();
    for (const [index, item] of FAQ_ITEMS.entries()) {
      const id = item.id ?? `q${index + 1}`;
      expect(html).toContain(`href="#${id}"`);
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).not.toContain('href="#q11"');
  });
});
