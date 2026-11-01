import { describe, expect, it, vi } from "vitest";
import {
  CARD_PARAM_MAX_BYTES,
  resolveCardParam,
  verifyCardHref,
} from "./cardParam";
import {
  GOVERNANCE_RETRIEVE,
  loadPublicCardExample,
  publicCardExampleSource,
} from "./publicCardExample";

const ORIGIN = "https://councilof.ai";
const PREVIEW = "https://example.councilof-ai.pages.dev";
const ID = "82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c";
const CARD = `/signed/cards/${ID}.json`;

function fakeFetch(response: Response) {
  const mock = vi.fn(async () => response);
  return { mock, fetchImpl: mock as unknown as typeof fetch };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("public example references", () => {
  it.each([CARD, GOVERNANCE_RETRIEVE])(
    "round-trips %s through the existing verifier URL resolver",
    (path) => {
      const source = publicCardExampleSource(path, ORIGIN);
      expect(source).toEqual({
        url: `${ORIGIN}${path}`,
        href: verifyCardHref(`${ORIGIN}${path}`),
      });
      expect(
        resolveCardParam(new URL(source.href, ORIGIN).search, ORIGIN),
      ).toEqual({
        state: "ok",
        url: path,
        href: `${ORIGIN}${path}`,
      });
    },
  );

  it("keeps the actual source origin", () => {
    const local = publicCardExampleSource(CARD, PREVIEW);
    expect(local.url).toBe(`${PREVIEW}${CARD}`);
    expect(
      resolveCardParam(new URL(local.href, PREVIEW).search, PREVIEW),
    ).toMatchObject({ state: "ok", url: CARD });

    const canonical = publicCardExampleSource(`${ORIGIN}${CARD}`, PREVIEW);
    expect(canonical.url).toBe(`${ORIGIN}${CARD}`);
    expect(
      resolveCardParam(new URL(canonical.href, PREVIEW).search, PREVIEW),
    ).toMatchObject({ state: "ok", url: `${ORIGIN}${CARD}` });
  });

  it("normalizes the default HTTPS port", () => {
    expect(
      publicCardExampleSource(`https://councilof.ai:443${CARD}`, ORIGIN).url,
    ).toBe(`${ORIGIN}${CARD}`);
  });

  it.each([
    '{"body":{"private":"record"},"signature":"secret"}',
    ID,
    "/api/private-record.json",
    "/cards/abc.json",
    CARD.replace(ID, ID.toUpperCase()),
    `${CARD}?token=secret`,
    `${CARD}?`,
    `${CARD}#private`,
    `${CARD}#`,
    `${CARD}\n`,
    `//councilof.ai${CARD}`,
    `https://foreign.example${CARD}`,
    `https://councilof.ai.evil.example${CARD}`,
    `https://user:secret@councilof.ai${CARD}`,
    `https://councilof.ai:8443${CARD}`,
    `http://councilof.ai${CARD}`,
    `https://councilof.ai/private/..${CARD}`,
  ])("refuses %s", (reference) => {
    expect(() => publicCardExampleSource(reference, ORIGIN)).toThrow();
  });
});

describe("public example loading", () => {
  it("fetches anonymously without redirects and preserves decoded text", async () => {
    const raw = '{\n  "note": "µ", "body": { "x": 1 }\n}\n';
    const { mock, fetchImpl } = fakeFetch(
      new Response(new TextEncoder().encode(raw)),
    );
    const signal = new AbortController().signal;

    expect(
      await loadPublicCardExample(CARD, ORIGIN, signal, fetchImpl),
    ).toEqual({
      raw,
      href: verifyCardHref(`${ORIGIN}${CARD}`),
    });
    expect(mock).toHaveBeenCalledExactlyOnceWith(`${ORIGIN}${CARD}`, {
      credentials: "omit",
      redirect: "error",
      signal,
    });
  });

  it("does not fetch pasted private JSON", async () => {
    const { mock, fetchImpl } = fakeFetch(new Response("{}"));
    await expect(
      loadPublicCardExample(
        '{"private":"record"}',
        ORIGIN,
        new AbortController().signal,
        fetchImpl,
      ),
    ).rejects.toThrow();
    expect(mock).not.toHaveBeenCalled();
  });

  it("rejects HTTP failures", async () => {
    const { fetchImpl } = fakeFetch(new Response("down", { status: 503 }));
    await expect(
      loadPublicCardExample(
        CARD, ORIGIN, new AbortController().signal, fetchImpl,
      ),
    ).rejects.toThrow("HTTP 503");
  });

  it("rejects an oversized declared body before reading it", async () => {
    const response = new Response("{}", {
      headers: { "content-length": String(CARD_PARAM_MAX_BYTES + 1) },
    });
    const read = vi.spyOn(response, "arrayBuffer");
    const { fetchImpl } = fakeFetch(response);

    await expect(
      loadPublicCardExample(
        CARD, ORIGIN, new AbortController().signal, fetchImpl,
      ),
    ).rejects.toThrow("byte limit");
    expect(read).not.toHaveBeenCalled();
  });

  it("enforces the actual byte limit without a content-length header", async () => {
    const { fetchImpl } = fakeFetch(
      new Response(new Uint8Array(CARD_PARAM_MAX_BYTES + 1)),
    );
    await expect(
      loadPublicCardExample(
        CARD, ORIGIN, new AbortController().signal, fetchImpl,
      ),
    ).rejects.toThrow("byte limit");
  });

  it("accepts exactly the byte limit", async () => {
    const raw = " ".repeat(CARD_PARAM_MAX_BYTES);
    const { fetchImpl } = fakeFetch(new Response(raw));
    expect(
      (await loadPublicCardExample(
        CARD, ORIGIN, new AbortController().signal, fetchImpl,
      )).raw,
    ).toBe(raw);
  });

  it("does not fetch when already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const { mock, fetchImpl } = fakeFetch(new Response("{}"));

    await expect(
      loadPublicCardExample(CARD, ORIGIN, controller.signal, fetchImpl),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(mock).not.toHaveBeenCalled();
  });

  it("rejects a late fetch resolution that ignored cancellation", async () => {
    const controller = new AbortController();
    const pendingResponse = deferred<Response>();
    const response = new Response("{}");
    const read = vi.spyOn(response, "arrayBuffer");
    const fetchImpl = vi.fn(
      () => pendingResponse.promise,
    ) as unknown as typeof fetch;

    const pending = loadPublicCardExample(
      CARD, ORIGIN, controller.signal, fetchImpl,
    );
    controller.abort();
    pendingResponse.resolve(response);

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(read).not.toHaveBeenCalled();
  });

  it("rejects a late body resolution that ignored cancellation", async () => {
    const controller = new AbortController();
    const reading = deferred<void>();
    const pendingBody = deferred<ArrayBuffer>();
    const response = new Response("{}");
    vi.spyOn(response, "arrayBuffer").mockImplementation(() => {
      reading.resolve(undefined);
      return pendingBody.promise;
    });
    const { fetchImpl } = fakeFetch(response);

    const pending = loadPublicCardExample(
      CARD, ORIGIN, controller.signal, fetchImpl,
    );
    await reading.promise;
    controller.abort();
    pendingBody.resolve(new ArrayBuffer(2));

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
