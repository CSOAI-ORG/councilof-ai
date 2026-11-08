import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JailEvidenceContent } from "./JailFolder";
import { fetchJailArchive, jailVerifyHref, JAIL_INDEX_LIMIT, JAIL_INDEX_URL,
  parseJailArchive, readJailBoard } from "./jailEvidence";
import type { GspcBoardState } from "@/components/board/useGspcBoard";

const id = "a".repeat(64);
const fixture = () => ({
  schema: "csoai.jail-index/0.1", kind: "folder", writes_board: false,
  axis: "jail", as_of: "2026-08-18", dataset: "csoai/gspc-jail-goldbank",
  dataset_url: "https://huggingface.co/datasets/csoai/gspc-jail-goldbank", separation: "TIE",
  cards: [{ id, axis: "jail-escape-detection", url: `/signed/cards/${id}.json` }],
});
const current = () => ({ axes: [{
  axis: "jail", status: "MEASURED", bench: "GoldBank-Detector", separation: "UNTESTED",
  n: 71, accuracy: 0.5915, n_note: "71 rows hold 27 distinct inputs.",
  separation_basis: "No per-row results; no supported separation determination.",
  measurement_time: { observed_on: "2026-08-18" },
}] });
const ready = (): GspcBoardState => ({ data: current(), error: null, loading: false });
function render(board = ready(), state: "ready" | "loading" | "error" = "ready", empty = false) {
  const value = fixture();
  if (empty) value.cards = [];
  return renderToStaticMarkup(<JailEvidenceContent board={board}
    archive={{ status: state, data: state === "ready" ? parseJailArchive(value) : null }} retry={() => {}} />);
}

// Synthetic fixtures exercise presentation; they are not new measurement evidence.
describe("jail current/archived evidence separation", () => {
  it("renders the canonical verdict separately from the dated historical label", () => {
    const html = render();
    const liveSection = html.split('aria-labelledby="jail-current-heading"')[1].split('</section>')[0];
    expect(liveSection).toContain("UNTESTED");
    expect(liveSection).not.toContain("TIE");
    expect(html).toContain("Historical separation label:");
    expect(html).toContain("TIE</strong> (archived, not current)");
    expect(html.toLowerCase()).toContain('datetime="2026-08-18"');
  });
  it("does not promote retained board data after a failed refresh", () => {
    const html = render({ ...ready(), error: "Refresh failed" });
    expect(html).toContain("Previous or archived results are not displayed as current");
    expect(html).not.toContain('data-testid="jail-current-record"');
    expect(html).toContain("Archived source index");
  });
  it("has distinct loading and missing-current states", () => {
    expect(render({ data: null, error: null, loading: true })).toContain("Loading the current board record");
    const html = render({ data: { axes: [] }, error: null, loading: false });
    expect(html).toContain("No current result is inferred");
    expect(html).not.toContain('data-testid="jail-current-record"');
  });
  it("offers an archive retry instead of an endless loading message", () => {
    const html = render(ready(), "error");
    expect(html).toContain("Retry archived index");
    expect(html).toContain("does not establish that records are absent");
    expect(html).not.toContain("Loading the archived");
    expect(html).toContain('data-testid="jail-current-record"');
  });
  it("keeps source and correction links available when both reads fail", () => {
    const html = render({ data: null, error: "offline", loading: false }, "error");
    for (const href of ["/board/", "/api/gspc?axis=jail", "/corrections/", JAIL_INDEX_URL]) {
      expect(html).toContain(`href="${href}"`);
    }
  });
  it("exposes scope and separation limitations without inventing a winner", () => {
    const html = render();
    expect(html).toContain("71 rows hold 27 distinct inputs.");
    expect(html).toContain("No per-row results");
    expect(html).not.toContain("winner");
  });
  it("links exact archived cards to the verifier and wraps long identifiers", () => {
    const card = parseJailArchive(fixture()).cards[0];
    const html = render();
    expect(html).toContain(`href="${jailVerifyHref(card)}"`);
    expect(html).toContain(`aria-label="Verify archived card ${id}"`);
    expect(html).toContain("break-all");
    expect(html).toContain("does not mean this page has verified its signature");
  });
  it("does not turn an empty archive into a claim about all records", () => {
    expect(render(ready(), "ready", true)).toContain("not a claim about other published records");
  });
});

describe("jail evidence readers", () => {
  it("requires one unambiguous canonical row", () => {
    expect(readJailBoard(null)).toBeNull();
    expect(readJailBoard({ axes: [null, {}] })).toBeNull();
    expect(readJailBoard({ axes: [current().axes[0], current().axes[0]] })).toBeNull();
    expect(readJailBoard(current())?.separation).toBe("UNTESTED");
  });
  it("preserves legitimate zero accuracy without coercing missing data to zero", () => {
    const value = current();
    value.axes[0].accuracy = 0;
    expect(readJailBoard(value)?.accuracy).toBe(0);
    expect(readJailBoard({ axes: [{ axis: "jail", status: "MEASURED" }] })?.accuracy).toBeNull();
  });
  it("withholds invalid counts and proportions", () => {
    for (const n of [-1, 0, 1.2, Number.MAX_SAFE_INTEGER + 1, Infinity, "71"]) {
      expect(readJailBoard({ axes: [{ ...current().axes[0], n }] })?.n).toBeNull();
    }
    for (const accuracy of [-0.1, 1.1, NaN, Infinity, "0.5915"]) {
      expect(readJailBoard({ axes: [{ ...current().axes[0], accuracy }] })?.accuracy).toBeNull();
    }
  });
  it("does not promote draft or unknown status into measured figures", () => {
    for (const status of ["DRAFT", "UNMEASURED", true, null, "UNKNOWN"]) {
      const row = readJailBoard({ axes: [{ ...current().axes[0], status }] });
      expect(row?.accuracy).toBeNull();
      expect(row?.n).toBeNull();
      expect(row?.separation).toBe("Not published");
    }
  });
  it("does not stamp retrieval time as measurement time", () => {
    const value = { axes: [{ ...current().axes[0], measurement_time: undefined }] };
    expect(readJailBoard(value)?.observedOn).toBeNull();
  });
  it("parses the archive without mutating original values", () => {
    const value = fixture(); const before = JSON.stringify(value);
    expect(parseJailArchive(value).separation).toBe("TIE");
    expect(JSON.stringify(value)).toBe(before);
  });
  it("rejects wrong schemas, axes, kinds, write authority and invalid calendar dates", () => {
    for (const change of [{ schema: "wrong" }, { axis: "other" }, { kind: "live" },
      { writes_board: true }, { as_of: "2026-02-30" }, { cards: null }]) {
      expect(() => parseJailArchive({ ...fixture(), ...change })).toThrow();
    }
  });
  it("rejects executable, off-origin and mismatched card links", () => {
    for (const url of ["javascript:alert(1)", "https://example.com/card", `//example.com/${id}.json`,
      `/signed/cards/${"b".repeat(64)}.json`, `/signed/cards/${id}.json?redirect=1`]) {
      const value = fixture(); value.cards[0].url = url;
      expect(() => parseJailArchive(value)).toThrow();
    }
  });
  it("rejects duplicate and excessive card lists", () => {
    const value = fixture(); value.cards.push(value.cards[0]);
    expect(() => parseJailArchive(value)).toThrow();
    expect(() => parseJailArchive({ ...fixture(), cards: Array(129).fill(fixture().cards[0]) })).toThrow();
  });
  it("rejects a dataset URL that does not match its declared Hugging Face dataset", () => {
    expect(() => parseJailArchive({ ...fixture(), dataset_url: "https://example.com/dataset" })).toThrow();
    expect(() => parseJailArchive({ ...fixture(), dataset: "../../private" })).toThrow();
  });
});

describe("bounded archive transport", () => {
  const signal = () => new AbortController().signal;
  it("loads valid JSON using the exact read-only route and caller abort signal", async () => {
    const s = signal(); let seenUrl: unknown; let seenOptions: RequestInit | undefined;
    const request: typeof fetch = async (url, options) => {
      seenUrl = url; seenOptions = options;
      return new Response(JSON.stringify(fixture()));
    };
    expect((await fetchJailArchive(s, request)).cards.length).toBe(1);
    expect(seenUrl).toBe(JAIL_INDEX_URL);
    expect(seenOptions?.signal).toBe(s);
    expect(seenOptions?.redirect).toBe("error");
  });
  it("rejects failed HTTP responses without reading them as records", async () => {
    const response = new Response(JSON.stringify(fixture()), { status: 503 });
    await expect(fetchJailArchive(signal(), async () => response)).rejects.toThrow("HTTP 503");
    expect(response.bodyUsed).toBe(false);
  });
  it("rejects HTML fallback and malformed JSON", async () => {
    for (const body of ["<html>fallback</html>", "{broken"]) {
      await expect(fetchJailArchive(signal(), async () => new Response(body))).rejects.toThrow();
    }
  });
  it("rejects a response beyond the byte limit", async () => {
    await expect(fetchJailArchive(signal(), async () => new Response(" ".repeat(JAIL_INDEX_LIMIT + 1)))).rejects.toThrow("read limit");
  });
  it("propagates an aborted read instead of presenting an empty archive", async () => {
    const controller = new AbortController(); controller.abort();
    const request: typeof fetch = async (_url, options) => {
      options?.signal?.throwIfAborted();
      return new Response(JSON.stringify(fixture()));
    };
    await expect(fetchJailArchive(controller.signal, request)).rejects.toThrow();
  });
});
