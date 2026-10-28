// @vitest-environment jsdom
// The human-in-the-loop console, mounted for real. No backend is contacted: fetch is stubbed and
// every assertion is about what the operator is shown, what is sent, and what is NOT sent.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import HitlConsole from "./HitlConsole";

const MODULE = {
  schema: "csoai.hitl-competency-module/0.1",
  id: "GSPC-governance",
  axis: "governance",
  title: 'Read the record for "governance"',
  briefing: "Axis: governance. Published status: MEASURED. Published separation: TIE.",
  question: 'According to the published record you were briefed on, which statement about the axis "governance" is TRUE?',
  options: [
    { id: "A", text: "It is MEASURED and its separation is TIE." },
    { id: "B", text: "It is UNMEASURED and its separation is TIE." },
    { id: "C", text: "It is MEASURED and its separation is UNTESTED." },
    { id: "D", text: "It is UNMEASURED and its separation is UNTESTED." },
  ],
  completed: false,
};

const CHALLENGE = {
  id: "chl_0123456789abcdef",
  axis: "governance",
  subject: "publish — the governance axis",
  proposed_action: "please publish the governance card",
  raised_by: "Measure (measure-csoai)",
  at: "2026-10-26T00:00:00.000Z",
  source: "POST /api/pals/measure/chat",
  facts: 'Axis "governance": status MEASURED, n 237.',
  required_module: "GSPC-governance",
};

function snapshot(over: Record<string, unknown> = {}) {
  return {
    schema: "csoai.hitl-companion-state/0.1",
    policy: "Measurement and Human-in-the-Loop Oversight — Never Certification",
    decisions: ["APPROVED", "HOLD", "REJECTED"],
    review_queue_summary: { PENDING: 1, APPROVED: 0, REJECTED: 0, HOLD: 0 },
    store_bound: true,
    decision_path: "open",
    operator_token_configured: true,
    signing_key_configured: true,
    signature_did: "did:web:csoai.org#board-attestation-1",
    modules: [MODULE],
    module_count: 1,
    completed_modules: [],
    ...over,
  };
}

describe("the human-in-the-loop console", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
    vi.restoreAllMocks();
  });

  async function mount(props: Record<string, unknown> = {}) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(<HitlConsole {...(props as any)} />);
    });
    return container;
  }

  function stub(handlers: (url: string, init?: any) => Response | null) {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init?: any) => {
      const url = String(input);
      const r = handlers(url, init);
      if (r) return r;
      throw new Error(`unexpected fetch: ${url}`);
    });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  it("states the policy line and the MEOK decision vocabulary", async () => {
    stub((url) =>
      url.endsWith("/api/hitl")
        ? json(snapshot())
        : url.endsWith("/api/hitl/challenges")
          ? json({ challenges: [] })
          : null,
    );
    const c = await mount();
    expect(c.querySelector('[data-testid="hitl-policy"]')?.textContent).toContain(
      "Measurement and Human-in-the-Loop Oversight — Never Certification",
    );
    expect(c.textContent).toContain("APPROVED, HOLD, REJECTED");
  });

  it("says plainly when the decision path is locked, and refuses to pretend it is open", async () => {
    stub((url) =>
      url.endsWith("/api/hitl")
        ? json(snapshot({ decision_path: "locked", operator_token_configured: false }))
        : url.endsWith("/api/hitl/challenges")
          ? json({ challenges: [] })
          : null,
    );
    const c = await mount({ challenge: CHALLENGE });
    expect(c.querySelector('[data-testid="hitl-locked-note"]')).not.toBeNull();
    expect(c.textContent).toContain("No decision can be taken on this deployment");
    // The buttons are disabled, so the operator cannot take a decision the server would refuse.
    const approve = c.querySelector<HTMLButtonElement>('[data-testid="hitl-decide-APPROVED"]')!;
    expect(approve.disabled).toBe(true);
  });

  it("shows the challenge the staff member raised, with the record it was raised against", async () => {
    stub((url) =>
      url.endsWith("/api/hitl")
        ? json(snapshot())
        : url.endsWith("/api/hitl/challenges")
          ? json({ challenges: [] })
          : null,
    );
    const c = await mount({ challenge: CHALLENGE });
    const view = c.querySelector('[data-testid="hitl-challenge"]');
    expect(view).not.toBeNull();
    expect(view!.textContent).toContain("publish — the governance axis");
    expect(view!.textContent).toContain("please publish the governance card");
    expect(view!.textContent).toContain("chl_0123456789abcdef");
    // The record travels with the challenge, so the human decides on the record.
    expect(view!.textContent).toContain("status MEASURED");
  });

  it("shows the competency module for the axis under review", async () => {
    stub((url) =>
      url.endsWith("/api/hitl")
        ? json(snapshot())
        : url.endsWith("/api/hitl/challenges")
          ? json({ challenges: [] })
          : null,
    );
    const c = await mount({ challenge: CHALLENGE });
    expect(c.querySelector('[data-testid="hitl-module-question"]')?.textContent).toContain("governance");
    expect(c.querySelector('[data-testid="hitl-option-A"]')?.textContent).toContain("It is MEASURED");
    expect(c.querySelector('[data-testid="hitl-submit-module"]')).not.toBeNull();
  });

  it("checks the answer against the live record and reports what the server said", async () => {
    const seen: any[] = [];
    stub((url, init) => {
      if (url.endsWith("/api/hitl")) return json(snapshot());
      if (url.endsWith("/api/hitl/challenges")) return json({ challenges: [] });
      if (url.endsWith("/api/hitl/modules")) {
        seen.push(JSON.parse(String(init?.body ?? "{}")));
        return json({
          ok: true,
          correct: true,
          module_id: "GSPC-governance",
          axis: "governance",
          correct_option: "A",
          explanation: "The published record for governance reports status MEASURED and separation TIE.",
          oversight_gate_unlocked: true,
        });
      }
      return null;
    });
    const c = await mount({ challenge: CHALLENGE });

    await act(async () => {
      const radio = c.querySelector<HTMLInputElement>('[data-testid="hitl-option-A"] input')!;
      radio.click();
    });
    await act(async () => {
      c.querySelector<HTMLButtonElement>('[data-testid="hitl-submit-module"]')!.click();
    });

    expect(seen[0]).toEqual({ module_id: "GSPC-governance", answer: "A" });
    expect(c.querySelector('[data-testid="hitl-module-result"]')?.textContent).toContain("Correct");
  });

  it("sends the decision with the challenge, the module and the answer — and the token in the HEADER, never the body", async () => {
    const seen: any[] = [];
    stub((url, init) => {
      if (url.endsWith("/api/hitl")) return json(snapshot());
      if (url.endsWith("/api/hitl/challenges")) return json({ challenges: [] });
      if (url.endsWith("/api/hitl/modules")) {
        seen.push({ url, body: JSON.parse(String(init?.body ?? "{}")), headers: init?.headers });
        return json({ ok: true, correct: true, module_id: "GSPC-governance", axis: "governance", correct_option: "A" });
      }
      if (url.endsWith("/api/hitl/decision")) {
        seen.push({ url, body: JSON.parse(String(init?.body ?? "{}")), headers: init?.headers });
        return json({
          ok: true,
          blocked_by_competency_gate: false,
          receipt: {
            schema: "csoai.hitl-oversight-receipt/0.1",
            decision: "APPROVED",
            axis: "governance",
            at: "2026-10-26T00:00:00.000Z",
            note: "competency-verified",
            signature: {
              value_hex: "ab".repeat(64),
              did: "did:web:csoai.org#board-attestation-1",
              sha256: "cd".repeat(32),
              unsigned_reason: null,
            },
          },
        });
      }
      return null;
    });
    const c = await mount({ challenge: CHALLENGE });

    // Answer the module, name the operator, type the token, then decide.
    await act(async () => {
      c.querySelector<HTMLInputElement>('[data-testid="hitl-option-A"] input')!.click();
    });
    await act(async () => {
      c.querySelector<HTMLButtonElement>('[data-testid="hitl-submit-module"]')!.click();
    });
    await act(async () => {
      const op = c.querySelector<HTMLInputElement>('[data-testid="hitl-operator"]')!;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(op, "the operator");
      op.dispatchEvent(new Event("input", { bubbles: true }));
      const tok = c.querySelector<HTMLInputElement>('[data-testid="hitl-token"]')!;
      setter.call(tok, "s3cret");
      tok.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      c.querySelector<HTMLButtonElement>('[data-testid="hitl-decide-APPROVED"]')!.click();
    });

    const decision = seen.find((s) => s.url.endsWith("/api/hitl/decision"));
    expect(decision).toBeTruthy();
    expect(decision.body.challenge.id).toBe("chl_0123456789abcdef");
    expect(decision.body.decision).toBe("APPROVED");
    expect(decision.body.operator).toBe("the operator");
    expect(decision.body.module_id).toBe("GSPC-governance");
    expect(decision.body.answer).toBe("A");
    // The token travels in the header. A body gets logged; a header does not.
    expect(decision.headers["x-hitl-token"]).toBe("s3cret");
    expect(JSON.stringify(decision.body)).not.toContain("s3cret");

    // And the receipt is shown, with its signature state.
    const receipt = c.querySelector('[data-testid="hitl-receipt"]');
    expect(receipt).not.toBeNull();
    expect(receipt!.textContent).toContain("APPROVED");
    expect(receipt!.textContent).toContain("did:web:csoai.org#board-attestation-1");
  });

  it("shows the reason when the competency gate blocks the decision", async () => {
    stub((url, init) => {
      if (url.endsWith("/api/hitl")) return json(snapshot());
      if (url.endsWith("/api/hitl/challenges")) return json({ challenges: [] });
      if (url.endsWith("/api/hitl/modules")) {
        return json({ ok: true, correct: false, module_id: "GSPC-governance", axis: "governance" });
      }
      if (url.endsWith("/api/hitl/decision")) {
        return json(
          {
            ok: false,
            blocked_by_competency_gate: true,
            reason: "Human-in-the-Loop Competency Gate: the answer does not match the live published record.",
          },
          422,
        );
      }
      return null;
    });
    const c = await mount({ challenge: CHALLENGE });
    await act(async () => {
      c.querySelector<HTMLInputElement>('[data-testid="hitl-option-A"] input')!.click();
    });
    await act(async () => {
      c.querySelector<HTMLButtonElement>('[data-testid="hitl-submit-module"]')!.click();
    });
    await act(async () => {
      c.querySelector<HTMLButtonElement>('[data-testid="hitl-decide-APPROVED"]')!.click();
    });
    expect(c.querySelector('[data-testid="hitl-error"]')?.textContent).toContain("Competency Gate");
    // Nothing was recorded, so there is no receipt to show.
    expect(c.querySelector('[data-testid="hitl-receipt"]')).toBeNull();
  });

  it("says so when nothing is waiting for a human", async () => {
    stub((url) =>
      url.endsWith("/api/hitl")
        ? json(snapshot())
        : url.endsWith("/api/hitl/challenges")
          ? json({ challenges: [] })
          : null,
    );
    const c = await mount();
    expect(c.querySelector('[data-testid="hitl-no-challenge"]')).not.toBeNull();
    expect(c.querySelector('[data-testid="hitl-decide-APPROVED"]')?.hasAttribute("disabled")).toBe(true);
  });
});
