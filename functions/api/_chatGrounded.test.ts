import { afterEach, describe, expect, it } from "vitest";
import { onRequestPost } from "./_chatGrounded";

// Why this file exists.
//
// On 2026-10-30 the model seat was unreachable for 21 hours and POST /api/chat answered
// `state: ungrounded`, `model: null`, `answered_by: "deterministic (no model in the path)"`.
// That refusal was TRUE — no published measurement answers the question — and USELESS: it
// named a missing fact where the truth was a broken dependency, and it was indistinguishable
// from a question the estate simply does not have a measurement for. The PAL lane already
// named the cause ("The language model is unreachable (http_error)"). These tests pin the
// chat route to the same vocabulary.
//
// The class is what is published. The raw failure text of a transport error can name the
// private seat hostname, and the seat's URL and routing id are never returned to public
// clients — so the class travels and the message does not.

const ORIGIN = "https://councilof.ai";
// A question no published record, tool or deterministic rule answers, and that the tool
// router does not claim.
const QUESTION = "What is 17 plus 25?";

type SeatBehaviour = "answer" | "unreachable" | "http_error" | "empty";

function stubFetch(seat: SeatBehaviour) {
  globalThis.fetch = (async (input: any) => {
    const url = String(typeof input === "string" ? input : (input?.url ?? input));
    if (url.includes("/v1/chat/completions")) {
      if (seat === "unreachable") throw new TypeError("fetch failed");
      if (seat === "http_error") return new Response("origin not reachable", { status: 530 });
      if (seat === "empty") return Response.json({ choices: [{ message: { content: "   " } }] });
      return Response.json({ choices: [{ message: { content: "Forty-two." } }] });
    }
    // Every origin read (the board) is unavailable: the question is NOT answerable from
    // published measurement, which is the state under test.
    throw new TypeError("fetch failed");
  }) as unknown as typeof fetch;
}

async function ask(seat: SeatBehaviour) {
  stubFetch(seat);
  const request = new Request(`${ORIGIN}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: QUESTION }),
  });
  const res = (await onRequestPost({
    request,
    env: { SOV_GATE_URL: "https://private-seat.example", SOV_GATE_TOKEN: "t" },
  } as any)) as Response;
  return { status: res.status, body: await res.json() as any };
}

afterEach(() => {
  // @ts-expect-error - restore the real fetch for the next test
  globalThis.fetch = globalThis.fetch;
});

describe("the chat route reports a model seat that cannot answer", () => {
  it("answers from the seat when the seat answers", async () => {
    const { status, body } = await ask("answer");
    expect(status).toBe(200);
    expect(body.state).toBe("model_response");
    expect(body.model).toBe("council-routing-default");
    expect(body.answered_by).toBe("upstream model runtime (single response)");
    expect(body.reply).toContain("Forty-two.");
    // A model that answered is not a fault, so nothing is published about a fault.
    expect(body.model_seat).toBeUndefined();
    expect(body.reply).not.toMatch(/did not answer/);
  });

  it("names an unreachable seat as a service state, not as a missing measurement", async () => {
    const { status, body } = await ask("unreachable");
    expect(status).toBe(200);
    // The doctrine does not change: there is still no grounding for this question.
    expect(body.state).toBe("ungrounded");
    expect(body.model).toBeNull();
    expect(body.answered_by).toBe("deterministic (no model in the path)");
    // What changes: the cause is named.
    expect(body.model_seat).toBe("unreachable");
    expect(body.reply).toContain("The model seat did not answer");
    expect(body.reply).toContain("unreachable");
    expect(body.provenance).toContain("the model seat did not answer");
  });

  it("names an http_error seat by its class and never relays the upstream body", async () => {
    const { body } = await ask("http_error");
    expect(body.state).toBe("ungrounded");
    expect(body.model_seat).toBe("http_error");
    // The upstream body and the status are not published.
    expect(body.reply).not.toContain("origin not reachable");
    expect(body.reply).not.toContain("530");
  });

  it("names a seat that answered with no content", async () => {
    const { body } = await ask("empty");
    expect(body.state).toBe("ungrounded");
    expect(body.model_seat).toBe("empty");
  });

  it("never publishes the seat's private URL or its routing id", async () => {
    for (const seat of ["unreachable", "http_error", "empty"] as SeatBehaviour[]) {
      const { body } = await ask(seat);
      const published = JSON.stringify(body);
      expect(published).not.toContain("private-seat.example");
      expect(published).not.toContain("sov6-ethics-v3-light");
      expect(published).not.toContain("fetch failed");
    }
  });
});
