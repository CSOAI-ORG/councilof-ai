// The <gspc-board> web component (public/embed/gspc-board.js), run in a minimal fake DOM.
// No jsdom in this repo, so the test supplies just what the script touches.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import capture from "../badge/__fixtures__/gspc-2026-09-05.json";

const SRC = readFileSync(resolve(__dirname, "../../public/embed/gspc-board.js"), "utf8");
const CAPTURE = capture as any;

function load(fetchImpl: (url: string) => Promise<unknown>) {
  const registry: Record<string, any> = {};
  class FakeHTMLElement {
    attrs: Record<string, string> = {};
    shadowRoot: any = null;
    attachShadow() { this.shadowRoot = { innerHTML: "" }; return this.shadowRoot; }
    setAttribute(k: string, v: string) { this.attrs[k] = v; }
    getAttribute(k: string) { return this.attrs[k] ?? null; }
  }
  const win: any = {
    HTMLElement: FakeHTMLElement,
    customElements: { get: (n: string) => registry[n], define: (n: string, c: any) => { registry[n] = c; } },
    fetch: fetchImpl,
  };
  vm.runInNewContext(SRC, { window: win, globalThis: win });
  return { win, registry };
}
const ok = (body: unknown, status = 200) => async () => ({ ok: status === 200, status, json: async () => body });

describe("<gspc-board>", () => {
  it("defines the element once and exposes its pure parts", () => {
    const { registry, win } = load(ok(CAPTURE));
    expect(typeof registry["gspc-board"]).toBe("function");
    expect(win.GSPCBoard.API).toBe("https://councilof.ai/api/gspc");
  });
  it("paints the board's public_count and as_of verbatim, with the link", async () => {
    const { registry } = load(ok(CAPTURE));
    const el = new registry["gspc-board"]();
    const p = el.connectedCallback();
    expect(el.shadowRoot.innerHTML).toContain("reading the board");
    await p;
    const html = el.shadowRoot.innerHTML;
    expect(html).toContain(`data-field="public_count">${CAPTURE.totals.public_count}</p>`);
    expect(html).toContain(`as_of: ${CAPTURE.measured_on.date}`);
    expect(html).toContain('href="https://councilof.ai/gspc"');
    expect(el.getAttribute("data-state")).toBe("derived");
  });
  it("HTTP error, network failure and a count-less payload all read 'unread' with no count", async () => {
    for (const f of [ok(CAPTURE, 503), async () => { throw new Error("offline"); }, ok({ totals: {} })]) {
      const { registry } = load(f as any);
      const el = new registry["gspc-board"]();
      await el.connectedCallback();
      expect(el.shadowRoot.innerHTML).toContain('data-field="unread"');
      expect(el.shadowRoot.innerHTML).not.toContain('data-field="public_count"');
      expect(el.getAttribute("data-state")).toBe("unread");
    }
  });
  it("escapes the payload", async () => {
    const evil = JSON.parse(JSON.stringify(CAPTURE));
    evil.totals.public_count = "<script>x</script>";
    const { registry } = load(ok(evil));
    const el = new registry["gspc-board"]();
    await el.connectedCallback();
    expect(el.shadowRoot.innerHTML).not.toContain("<script>x");
    expect(el.shadowRoot.innerHTML).toContain("&lt;script&gt;x&lt;/script&gt;");
  });
  it("renders no rank, grade, score, badge or certification wording", async () => {
    const { registry } = load(ok(CAPTURE));
    const el = new registry["gspc-board"]();
    await el.connectedCallback();
    const text = el.shadowRoot.innerHTML.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
    expect(text).not.toMatch(/\b(certified|certify|ranked|rank|grade[ds]?|scores?|badge)\b/i);
  });
});
