import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const script = readFileSync(process.env.GSPC_TABLE_JS || new URL("./table.js", import.meta.url), "utf8");
const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const API = "https://councilof.ai/api/gspc";
const HUB = "https://councilof.ai/api/hub-cards";
const CARDS = "https://councilof.ai/signed/card_index.json";
const CORRECTIONS = "https://councilof.ai/api/corrections";
const primary = [API, CARDS, CORRECTIONS, HUB];

class Element extends EventTarget {
  constructor(attrs = {}) {
    super();
    this.attrs = attrs;
    this.dataset = {};
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.hidden = false;
    this.scrolls = 0;
  }
  getAttribute(name) { return this.attrs[name] ?? null; }
  scrollIntoView() { this.scrolls++; }
  querySelectorAll(selector) {
    const key = selector.includes("data-pillar") ? "data-pillar" : "data-axis";
    return [...this.innerHTML.matchAll(/<[^>]+\bdata-(?:axis|pillar)="[^"]*"[^>]*>/g)]
      .filter((match) => match[0].includes(key + '="'))
      .map((match) => new Element(Object.fromEntries(
        [...match[0].matchAll(/([-\w]+)="([^"]*)"/g)].map((attr) => [attr[1], attr[2]])
      )));
  }
}

function board(version = 1, axes = ["governance", "safety", "jail"]) {
  return {
    as_of: "2026-10-08T0" + version + ":00:00Z",
    totals: { lid: "source-lid-" + version, measured_axes: axes.length, items: version * 100 },
    axes: axes.map((axis) => ({
      axis, status: "MEASURED", family: "ai", leader: "model-" + version,
      n: version * 10, accuracy: version / 10, fleet_mean: 0.05, separation: "TIE",
    })),
    limitations: ["governance limitation " + version],
  };
}

function fixtures(version = 1) {
  return new Map([
    [API, board(version)],
    [CARDS, { cards: [{ axis: "governance", card: "governance-card-" + version }] }],
    [CORRECTIONS, { corrections: [{ id: "governance-correction-" + version, what_was_wrong: "governance prior value" }] }],
    [HUB, { cells: [
      { axis: "governance", model: "model-" + version, accuracy: version / 10, n: 20, status: "MEASURED" },
      { axis: "safety", model: "model-" + version, accuracy: version / 10, n: 20, status: "MEASURED" },
    ], counts: { complete: true, measured: 2 } }],
    ["./census-manifest.json", { n_unique_ids: 100, n_measured: 0 }],
    ["https://huggingface.co/datasets/csoai/hub-queue/resolve/main/SUMMARY.json", { n: 10, n_measured: 0, as_of: "queue-time" }],
    ["https://huggingface.co/datasets/csoai/living-catalog/resolve/main/catalog.json", { counts: { datasets: 1 } }],
    ["https://councilof.ai/interop/market-universe-2026-09/index.json", {}],
  ]);
}

async function flush() {
  for (let i = 0; i < 4; i++) await new Promise(setImmediate);
}

function harness({ initial = fixtures(), hash = "" } = {}) {
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => [match[1], new Element()]));
  const bodies = new Map();
  const document = new EventTarget();
  document.hidden = false;
  document.getElementById = (id) => elements.get(id) || null;
  document.querySelector = (selector) => {
    const match = /^#([\w-]+) tbody$/.exec(selector);
    assert.ok(match && elements.has(match[1]), "test selector must exist in canonical HTML: " + selector);
    if (!bodies.has(selector)) bodies.set(selector, new Element());
    return bodies.get(selector);
  };
  document.querySelectorAll = (selector) => {
    const match = /^#([\w-]+) (.+)$/.exec(selector);
    return elements.get(match[1]).querySelectorAll(match[2]);
  };
  const window = new EventTarget();
  const location = { hash };
  const historyCalls = [];
  const intervals = new Map();
  const timeouts = new Map();
  let timerId = 0;
  const requests = [];
  const replies = initial;
  const fetch = (url, options) => {
    requests.push({ url, options });
    const reply = replies.get(url);
    if (typeof reply === "function") return reply(options);
    if (reply instanceof Error) return Promise.reject(reply);
    return Promise.resolve({ ok: true, json: async () => structuredClone(reply) });
  };
  const context = vm.createContext({
    document, window, location, fetch, AbortController,
    history: { replaceState: (...args) => { historyCalls.push(args); location.hash = args[2]; } },
    localStorage: { getItem: () => null, setItem: () => {} },
    setInterval: (fn, ms) => { const id = ++timerId; intervals.set(id, { fn, ms }); return id; },
    clearInterval: (id) => intervals.delete(id),
    setTimeout: (fn, ms) => { const id = ++timerId; timeouts.set(id, { fn, ms }); return id; },
    clearTimeout: (id) => timeouts.delete(id),
  });
  vm.runInContext(script, context, { filename: "table.js" });
  return {
    context, document, window, replies, requests, intervals, timeouts, location, historyCalls,
    el: (id) => elements.get(id),
    body: (selector) => document.querySelector(selector),
    tick: () => [...intervals.values()].forEach(({ fn }) => fn()),
    primaryCount: () => requests.filter(({ url }) => primary.includes(url)).length,
    choosePillar: (id) => {
      const buttons = elements.get("pillars").querySelectorAll("[data-pillar]");
      // The fake parses rendered HTML but callbacks are the actual table.js bindings.
      const previous = elements.get("pillars").querySelectorAll;
      elements.get("pillars").querySelectorAll = () => buttons;
      vm.runInContext("renderPillars()", context);
      elements.get("pillars").querySelectorAll = previous;
      buttons.find((button) => button.getAttribute("data-pillar") === id).onclick();
    },
  };
}

test("reads primary feeds each minute without replacing source measurement time", async () => {
  const h = harness();
  await flush();
  assert.equal(h.intervals.size, 1);
  assert.equal([...h.intervals.values()][0].ms, 60_000);
  assert.equal(h.el("lid").textContent, "Lid: source-lid-1");
  assert.match(h.el("board-refresh-status").textContent, /2026-10-08T01:00:00Z/);
  const before = h.primaryCount();
  for (const [url, reply] of fixtures(2)) h.replies.set(url, reply);
  h.tick();
  await flush();
  assert.equal(h.primaryCount() - before, 4);
  assert.equal(h.el("lid").textContent, "Lid: source-lid-2");
  assert.match(h.el("board-body").innerHTML, /model-2/);
  assert.match(h.el("board-refresh-status").textContent, /2026-10-08T02:00:00Z/);
  h.tick();
  await flush();
  assert.match(h.el("board-refresh-status").textContent, /2026-10-08T02:00:00Z/);
  assert.match(h.el("board-refresh-status").textContent, /not a new measurement/);
  assert.ok(h.requests.filter(({ url }) => primary.includes(url)).every(({ options }) => options.cache === "no-store"));
});

test("preserves filters, independent dropdowns and selected detail without scrolling", async () => {
  const h = harness();
  await flush();
  vm.runInContext('openAxis("governance")', h.context);
  h.el("q").value = "model";
  h.el("q").dispatchEvent(new Event("input"));
  h.choosePillar("saf");
  h.el("lb-axis").value = "safety";
  h.el("lb-axis").onchange();
  h.el("hub-axis").value = "safety";
  h.el("hub-axis").onchange();
  const scrolls = h.el("desk").scrolls;
  const history = h.historyCalls.length;
  for (const [url, reply] of fixtures(2)) h.replies.set(url, reply);
  h.replies.set(API, board(2, ["governance", "safety", "jail", "provenance"]));
  h.tick();
  await flush();
  assert.equal(h.el("q").value, "model");
  assert.equal(h.el("lb-axis").value, "safety");
  assert.equal(h.el("hub-axis").value, "safety");
  assert.equal(h.el("desk-h").textContent, "governance");
  assert.match(h.el("quote").innerHTML, /20%/);
  assert.doesNotMatch(h.el("board-body").innerHTML, /data-axis="governance"/);
  assert.match(h.el("board-body").innerHTML, /data-axis="safety"/);
  assert.match(h.el("lb-axis").innerHTML, /provenance/);
  assert.equal(h.el("desk").scrolls, scrolls);
  assert.equal(h.historyCalls.length, history);
  assert.match(h.el("ruling").textContent, /100 Hub listings/);
  assert.match(h.el("ruling").textContent, /10 names/);
});

test("failure and invalid payload retain last good board and recover on the next read", async () => {
  const h = harness();
  await flush();
  const rows = h.el("board-body").innerHTML;
  h.replies.set(API, new Error("network unavailable"));
  h.tick();
  await flush();
  assert.equal(h.el("board-body").innerHTML, rows);
  assert.match(h.el("board-refresh-status").textContent, /Latest read failed: board/);
  h.replies.set(API, { error: "not a snapshot" });
  h.tick();
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-1");
  h.replies.set(API, board(3));
  h.tick();
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-3");
  assert.doesNotMatch(h.el("board-refresh-status").textContent, /Latest read failed/);
});

test("failed auxiliary feeds retain cards, corrections and Hub cells with an explicit warning", async () => {
  const h = harness({ hash: "#governance" });
  await flush();
  for (const url of [CARDS, CORRECTIONS, HUB]) h.replies.set(url, new Error("blocked"));
  h.replies.set(API, board(2));
  h.tick();
  await flush();
  assert.match(h.el("rec-table").innerHTML, /governance-c/);
  assert.match(h.el("honest-table").innerHTML, /governance-correction-1/);
  assert.match(h.body("#hub-table tbody").innerHTML, /model-1/);
  assert.match(h.el("board-refresh-status").textContent, /signed cards, corrections, Hub cells/);
  for (const url of [CARDS, CORRECTIONS, HUB]) h.replies.set(url, fixtures(2).get(url));
  h.tick();
  await flush();
  assert.match(h.el("honest-table").innerHTML, /governance-correction-2/);
  assert.match(h.body("#hub-table tbody").innerHTML, /model-2/);
});

test("initial failure is UNCHECKABLE and periodic retry can load the first good snapshot", async () => {
  const initial = fixtures();
  for (const url of primary) initial.set(url, new Error("offline"));
  const h = harness({ initial });
  await flush();
  assert.match(h.el("lid").textContent, /UNCHECKABLE/);
  assert.match(h.el("board-body").innerHTML, /UNCHECKABLE/);
  assert.match(h.body("#hub-table tbody").innerHTML, /UNCHECKABLE/);
  for (const [url, reply] of fixtures()) h.replies.set(url, reply);
  h.tick();
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-1");
});

test("intervals and visibility changes do not overlap a pending primary read", async () => {
  const h = harness();
  await flush();
  let release;
  h.replies.set(API, () => new Promise((resolve) => { release = resolve; }));
  const before = h.primaryCount();
  h.tick();
  h.tick();
  h.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(h.primaryCount() - before, 4);
  release({ ok: true, json: async () => board(2) });
  await flush();
  h.replies.set(API, board(3));
  h.tick();
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-3");
});

test("hidden pages skip interval reads and refresh immediately when visible", async () => {
  const h = harness();
  await flush();
  const before = h.primaryCount();
  h.document.hidden = true;
  h.tick();
  await flush();
  assert.equal(h.primaryCount(), before);
  h.replies.set(API, board(2));
  h.document.hidden = false;
  h.document.dispatchEvent(new Event("visibilitychange"));
  await flush();
  assert.equal(h.primaryCount() - before, 4);
  assert.equal(h.el("lid").textContent, "Lid: source-lid-2");
});

test("pagehide aborts pending reads and restoration ignores their late results", async () => {
  const h = harness();
  await flush();
  let releaseOld;
  let signal;
  h.replies.set(API, (options) => {
    signal = options.signal;
    return new Promise((resolve) => { releaseOld = resolve; });
  });
  h.tick();
  h.window.dispatchEvent(new Event("pagehide"));
  assert.equal(signal.aborted, true);
  assert.equal(h.intervals.size, 0);
  h.replies.set(API, board(3));
  h.window.dispatchEvent(new Event("pageshow"));
  h.window.dispatchEvent(new Event("pageshow"));
  await flush();
  assert.equal(h.intervals.size, 1);
  assert.equal(h.el("lid").textContent, "Lid: source-lid-3");
  releaseOld({ ok: true, json: async () => board(2) });
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-3");
  h.replies.set(API, board(4));
  h.tick();
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-4");
});

test("read timeout frees the next interval to retry instead of remaining stuck", async () => {
  const h = harness();
  await flush();
  h.replies.set(API, ({ signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("read timeout")), { once: true });
  }));
  h.tick();
  const timeout = [...h.timeouts.values()].find(({ ms }) => ms === 20_000);
  assert.ok(timeout);
  timeout.fn();
  await flush();
  assert.match(h.el("board-refresh-status").textContent, /Latest read failed: board/);
  h.replies.set(API, board(2));
  h.tick();
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-2");
});

test("removing the selected axis closes its detail rather than retaining a stale record", async () => {
  const h = harness({ hash: "#governance" });
  await flush();
  assert.equal(h.el("desk").hidden, false);
  h.replies.set(API, board(2, ["safety"]));
  h.tick();
  await flush();
  assert.equal(h.el("desk").hidden, true);
  assert.equal(h.el("lb-axis").value, "safety");
  assert.doesNotMatch(h.el("lb-axis").innerHTML, /governance/);
});

test("malformed auxiliary responses are rejected rather than clearing previously read evidence", async () => {
  const h = harness({ hash: "#governance" });
  await flush();
  const cardRows = h.el("rec-table").innerHTML;
  const correctionRows = h.el("honest-table").innerHTML;
  const hubRows = h.body("#hub-table tbody").innerHTML;
  h.replies.set(CARDS, { cards: [null] });
  h.replies.set(CORRECTIONS, { corrections: "not records" });
  h.replies.set(HUB, { cells: null });
  h.tick();
  await flush();
  assert.equal(h.el("rec-table").innerHTML, cardRows);
  assert.equal(h.el("honest-table").innerHTML, correctionRows);
  assert.equal(h.body("#hub-table tbody").innerHTML, hubRows);
  assert.match(h.el("board-refresh-status").textContent, /signed cards, corrections, Hub cells/);
});

test("HTTP and JSON parse failures are read failures and do not replace a good board", async () => {
  const h = harness();
  await flush();
  h.replies.set(API, async () => ({ ok: false, status: 503 }));
  h.tick();
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-1");
  h.replies.set(API, async () => ({ ok: true, json: async () => { throw new SyntaxError("invalid JSON"); } }));
  h.tick();
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-1");
  assert.match(h.el("board-refresh-status").textContent, /Latest read failed: board/);
});

test("a valid empty snapshot clears stale leaderboard and detail rather than inventing rows", async () => {
  const h = harness({ hash: "#governance" });
  await flush();
  h.replies.set(API, board(2, []));
  h.tick();
  await flush();
  assert.equal(h.el("lid").textContent, "Lid: source-lid-2");
  assert.equal(h.el("desk").hidden, true);
  assert.equal(h.el("lb-axis").innerHTML, "");
  assert.equal(h.el("podium").innerHTML, "");
  assert.match(h.body("#lb-table tbody").innerHTML, /No axes in the current board/);
  assert.doesNotMatch(h.body("#lb-table tbody").innerHTML, /model-1/);
  assert.doesNotMatch(h.el("board-refresh-status").textContent, /Latest read failed/);
});
