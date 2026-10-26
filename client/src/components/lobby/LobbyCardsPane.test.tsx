/**
 * The Signed cards pane as the dashboard renders it: <C /> with no props (tools audit, 6 Oct 2026).
 * "Verify a record you were given" called onOpenRoute unconditionally, so in the dashboard it threw
 * "onOpenRoute is not a function" and did nothing.
 */
import { describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import LobbyCardsPane, { VerifyGivenRecord } from "./LobbyCardsPane";

const render = (node: React.ReactNode) => renderToStaticMarkup(<Router ssrPath="/dashboard">{node}</Router>);

describe("Signed cards pane", () => {
  it("with no onOpenRoute, the control is a link to Check a result, and clicking it cannot throw", () => {
    const el = VerifyGivenRecord({}) as ReactElement<{ href?: string; onClick?: unknown }>;
    expect(isValidElement(el)).toBe(true);
    expect(el.props.href).toBe("/dashboard?tab=verify");
    expect(el.props.onClick).toBeUndefined();
    const html = render(<VerifyGivenRecord />);
    expect(html).toContain('href="/dashboard?tab=verify"');
    expect(html).toContain("Verify a record you were given");
  });

  it("with a host handler, clicking opens the verifier through it", () => {
    const onOpenRoute = vi.fn();
    const el = VerifyGivenRecord({ onOpenRoute }) as ReactElement<{ onClick: () => void }>;
    el.props.onClick();
    expect(onOpenRoute).toHaveBeenCalledWith("/gspc-verify", "Verify a card");
  });

  it("renders with no props, under one plain h1, with the separate root behind a Technical expander", () => {
    const html = render(<LobbyCardsPane />);
    expect(html.match(/<h1[^>]*>/g)?.length).toBe(1);
    expect(html).toContain(">Check the published cards</h1>");
    expect(html).toMatch(/<details[^>]*data-testid="cards-technical"/);
    expect(html).toContain("Technical: a separate collection of signed measurement cards");
    // Closed by default: the root file is neither fetched nor shown until the reader opens it.
    expect(html).not.toContain("active leaves");
  });
});
