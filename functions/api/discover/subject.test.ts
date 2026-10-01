import { describe, expect, it, vi } from "vitest";
import { handleSubject, SUBJECTS } from "./_subject";

const call = async (subject: string, headers?: HeadersInit) =>
  handleSubject(subject, {
    request: new Request(`https://councilof.ai/api/discover/${subject}`, {
      headers,
    }),
    env: {},
  });

describe("subject discovery doors", () => {
  it("covers Chainlink, Ondo and Ondo OUSG as distinct zero-priced resources", async () => {
    expect(Object.keys(SUBJECTS)).toEqual(["chainlink", "ondo", "ondo-ousg"]);
    for (const subject of Object.keys(SUBJECTS)) {
      const response = await call(subject);
      expect(response.status).toBe(402);
      const body = (await response.json()) as any;
      expect(body.resource.url).toBe(
        `https://councilof.ai/api/discover/${subject}`,
      );
      expect(body.accepts[0].amount).toBe("0");
      expect(body.extensions.bazaar.info).toBeTruthy();
      expect(JSON.stringify(body)).toMatch(
        /not a measurement|buys no measurement/i,
      );
    }
  });

  it("rejects unknown subjects instead of creating unbounded index spam", async () => {
    const response = await call("anything");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: "unknown_subject" });
  });

  it("fulfils with subject links after a verified zero-value settlement", async () => {
    const x402 = await import("../_x402");
    const spy = vi
      .spyOn(x402, "verifyX402Payment")
      .mockResolvedValue({ ok: true } as any);
    try {
      const response = await call("ondo-ousg", { "x-payment": "e30=" });
      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.state).toBe("DISCOVERY_ONLY");
      expect(body.subject.aliases).toContain("OUSG");
      expect(body.routes.signed_evidence).toContain("asset=OUSG");
      expect(body.paid.amount_usdc).toBe(0);
      expect(body.boundary).toMatch(/Measurement, not certification/);
    } finally {
      spy.mockRestore();
    }
  });
});
