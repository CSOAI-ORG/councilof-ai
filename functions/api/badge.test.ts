import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../_lib/cardVerify", () => ({ verifyCard: vi.fn() }));

import { verifyCard } from "../_lib/cardVerify";
import { onRequestGet } from "./badge";

const HASH = "a".repeat(64);
const REVISION = "b".repeat(40);
const SUBJECT = `owner/model@${REVISION}`;
const CARD_PATH = `/signed/cards/${HASH}.json`;

const entry = {
  card: HASH,
  card_url: CARD_PATH,
  axis: "governance",
  signed: true,
};

const card = {
  id: HASH,
  body: {
    kind: "gspc.measurement-card",
    axis: "governance",
    subject: { slug: "owner/model", revision: REVISION },
  },
  pubkey: "pinned-key",
  signature: "signature",
};

const invoke = (query: string) =>
  onRequestGet({
    request: new Request(`https://councilof.ai/api/badge?${query}`),
  } as never);

const installFetch = (
  indexEntry: Record<string, unknown> = entry,
  cardBody: Record<string, unknown> = card,
) => {
  const mocked = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input : input.url,
    );
    if (url.pathname === "/signed/card_index.json") {
      return Response.json({ cards: [indexEntry] });
    }
    if (url.pathname === CARD_PATH) return Response.json(cardBody);
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", mocked);
  return mocked;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("/api/badge card binding", () => {
  it("requires a full hash and immutable Hugging Face subject before reading the index", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    for (const query of [
      "card=aaaaaa&format=json",
      `card=${HASH}&format=json`,
      `card=${HASH}&subject=owner%2Fmodel%40main&format=json`,
    ]) {
      const body = await (await invoke(query)).json();
      expect(["invalid", "subject-required"]).toContain(body.state);
      expect(body.color).toBe("#9ca3af");
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns one VALID subject-bound meaning across JSON, Shields and SVG", async () => {
    installFetch();
    vi.mocked(verifyCard).mockResolvedValue({ valid: true, id: HASH } as never);
    const base = `card=${HASH}&subject=${encodeURIComponent(SUBJECT)}`;

    const json = await (await invoke(`${base}&format=json`)).json();
    expect(json).toMatchObject({
      label: "governance",
      message: "valid · subject-bound",
      color: "#16a34a",
      state: "valid",
    });

    const shields = await (await invoke(`${base}&format=shields`)).json();
    expect(shields).toMatchObject({
      label: "governance",
      message: "valid · subject-bound",
      color: "#16a34a",
    });

    const svg = await (await invoke(base)).text();
    expect(svg).toContain("governance: valid · subject-bound");
  });

  it("does not let an index signed flag substitute for cryptographic validity", async () => {
    installFetch();
    vi.mocked(verifyCard).mockResolvedValue({ valid: false, id: HASH } as never);

    const body = await (
      await invoke(`card=${HASH}&subject=${encodeURIComponent(SUBJECT)}&format=json`)
    ).json();
    expect(body).toMatchObject({ state: "invalid", color: "#9ca3af" });
    expect(body.message).toBe("invalid signature");
  });

  it("rejects subject mismatches and non-canonical card paths", async () => {
    installFetch();
    vi.mocked(verifyCard).mockResolvedValue({ valid: true, id: HASH } as never);

    const mismatch = await (
      await invoke(
        `card=${HASH}&subject=${encodeURIComponent(`other/model@${REVISION}`)}&format=json`,
      )
    ).json();
    expect(mismatch).toMatchObject({
      state: "subject-mismatch",
      color: "#9ca3af",
    });

    installFetch({ ...entry, card_url: "/signed/cards/../card_index.json" });
    const traversing = await (
      await invoke(`card=${HASH}&subject=${encodeURIComponent(SUBJECT)}&format=json`)
    ).json();
    expect(traversing).toMatchObject({
      state: "invalid",
      message: "invalid card path",
    });
  });
});
