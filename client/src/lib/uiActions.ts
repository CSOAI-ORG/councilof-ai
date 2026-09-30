/**
 * uiActions — the browser half of watch mode: a typed command registry that executes the AG-UI
 * frontend tools Ask GSPC plans (functions/_lib/uiTools.ts), a screen reader for page context, an
 * undo stack and an action log.
 *
 * PORTED PATTERN, NOT PORTED BRAIN. The shape comes from meok.ai `sovereign-embed.js`
 * (`sovereignOSCommands` + `getScreenContext()` + a bounded step loop with an onStep trace, MIT,
 * CSOAI Ltd). Its model `brain()` and PDCA planning were deliberately NOT ported: here the plan
 * comes from the deterministic router, and this file only executes named steps.
 *
 * RULES THIS FILE ENFORCES
 *   - Nothing runs unless the viewer switched watch on in this tab (the pane does that), or, for an
 *     agent in the page, granted agent consent in this tab (sessionStorage, never shared).
 *   - fillForm types; it never submits. No executor clicks a submit, pay or send control.
 *   - A step with effect commit, pay or schedule is never executed here without `confirmed: true`;
 *     the pane shows a visible Confirm first.
 *   - Every executed, skipped or refused step goes to the action log with who asked for it.
 *   - Same-origin paths only. A step pointing off-site is refused.
 */
import { navigate as wouterNavigate } from "wouter/use-browser-location";
import type { FrontendToolName, PageContext, StepEffect } from "../../../functions/_lib/uiTools";
import { FRONTEND_TOOLS } from "../../../functions/_lib/uiTools";

type Json = Record<string, unknown>;

export type StepInput = {
  id: string;
  tool: FrontendToolName;
  args: Json;
  say?: string;
  effect?: StepEffect;
  confirm?: boolean;
};

export type StepOutcome = {
  ok: boolean;
  /** done | skipped (the target was not on this page) | refused (a rule stopped it) | failed */
  state: "done" | "skipped" | "refused" | "failed";
  detail: string;
};

export type LogEntry = {
  at: string;
  by: string;
  stepId: string;
  tool: string;
  args: Json;
  outcome: StepOutcome["state"] | "undone" | "confirmed" | "stopped" | "took_over";
  detail: string;
};

const reduceMotion = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ action log */

const LOG_KEY = "coai:ui-action-log";
let log: LogEntry[] = [];
const listeners = new Set<(l: LogEntry[]) => void>();
try {
  const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(LOG_KEY) : null;
  if (raw) log = (JSON.parse(raw) as LogEntry[]).slice(-200);
} catch {
  log = [];
}

export function logAction(e: Omit<LogEntry, "at">): void {
  log = [...log, { ...e, at: new Date().toISOString() }].slice(-200);
  try {
    sessionStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    /* storage blocked: the log stays in memory for this page */
  }
  listeners.forEach((fn) => fn(log));
}

export function readLog(): LogEntry[] {
  return log;
}

export function subscribeLog(fn: (l: LogEntry[]) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearLog(): void {
  log = [];
  try {
    sessionStorage.removeItem(LOG_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(log));
}

/* ------------------------------------------------------------------ screen context */

/** What the page shows, for the router: headings, forms, the page's subject and the open pane. */
export function getScreenContext(): PageContext & { forms: { name: string; fields: string[] }[]; selection: string | null } {
  if (typeof document === "undefined") return { forms: [], selection: null };
  const txt = (n: Element | null) => (n?.textContent ?? "").replace(/\s+/g, " ").trim();
  const subjectEl = document.querySelector<HTMLElement>("[data-ui-subject]");
  const kind = subjectEl?.dataset.uiSubjectKind;
  let selection: string | null = null;
  try {
    selection = String(window.getSelection?.() ?? "").trim().slice(0, 300) || null;
  } catch {
    selection = null;
  }
  const params = new URLSearchParams(window.location.search);
  return {
    path: window.location.pathname + window.location.search,
    title: document.title.slice(0, 200),
    subject: subjectEl?.dataset.uiSubject ?? null,
    subjectKind: kind === "card" || kind === "server" || kind === "axis" ? kind : null,
    tab: params.get("tab"),
    headings: Array.from(document.querySelectorAll("main h1, main h2, h1")).slice(0, 8).map((h) => txt(h).slice(0, 80)).filter(Boolean),
    forms: Array.from(document.querySelectorAll("form")).slice(0, 4).map((f) => ({
      name: f.getAttribute("data-ui-form") ?? f.getAttribute("aria-label") ?? "",
      fields: Array.from(f.querySelectorAll<HTMLInputElement>("input,select,textarea")).map((i) => i.name || i.id || i.type).slice(0, 10),
    })),
    selection,
  };
}

/** The part of the screen context the router takes (forwardedProps.page). */
export function pageContext(): PageContext {
  const { forms: _f, selection: _s, ...page } = getScreenContext();
  return page;
}

/* ------------------------------------------------------------------ highlight overlay */

let ring: HTMLDivElement | null = null;
let ringTarget: Element | null = null;
let ringRaf = 0;

function place() {
  if (!ring || !ringTarget) return;
  const r = ringTarget.getBoundingClientRect();
  ring.style.transform = `translate(${Math.round(r.left - 6)}px, ${Math.round(r.top - 6)}px)`;
  ring.style.width = `${Math.round(r.width + 12)}px`;
  ring.style.height = `${Math.round(r.height + 12)}px`;
  ringRaf = requestAnimationFrame(place);
}

export function clearHighlight(): void {
  cancelAnimationFrame(ringRaf);
  ring?.remove();
  ring = null;
  ringTarget = null;
}

function drawRing(el: Element, label: string) {
  clearHighlight();
  ring = document.createElement("div");
  ring.setAttribute("data-ui-ring", "");
  ring.setAttribute("aria-hidden", "true");
  ring.style.cssText =
    "position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;border:3px solid #047857;border-radius:12px;" +
    "box-shadow:0 0 0 4px rgba(4,120,87,.18);transition:" +
    (reduceMotion() ? "none" : "transform .45s cubic-bezier(.2,.8,.2,1),width .45s,height .45s");
  if (label) {
    const tag = document.createElement("span");
    tag.textContent = label;
    tag.style.cssText =
      "position:absolute;left:-3px;top:-30px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" +
      "background:#065f46;color:#fff;font:600 12px/1.2 system-ui,sans-serif;padding:6px 8px;border-radius:6px";
    ring.appendChild(tag);
  }
  // Glide in from the launcher corner, the way DemoOS glides its windows onto the desktop.
  ring.style.transform = `translate(${window.innerWidth - 80}px, ${window.innerHeight - 80}px)`;
  ring.style.width = "48px";
  ring.style.height = "48px";
  document.body.appendChild(ring);
  ringTarget = el;
  requestAnimationFrame(() => requestAnimationFrame(place));
}

/* ------------------------------------------------------------------ element lookup */

/** Wait for a selector (panes load lazily). Null after `ms`: the step is reported skipped, never faked. */
export async function waitFor(selector: string, ms = 4000): Promise<Element | null> {
  const start = Date.now();
  for (;;) {
    let el: Element | null = null;
    try {
      el = document.querySelector(selector);
    } catch {
      return null; // an invalid selector is not retried
    }
    if (el) return el;
    if (Date.now() - start > ms) return null;
    await sleep(120);
  }
}

function sameOrigin(path: unknown): string | null {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

/* ------------------------------------------------------------------ undo */

type Undo = { stepId: string; tool: string; run: () => void };
const undoStack: Undo[] = [];

export function canUndo(): boolean {
  return undoStack.length > 0;
}

export function undoLast(by = "you"): boolean {
  const u = undoStack.pop();
  if (!u) return false;
  try {
    u.run();
  } finally {
    logAction({ by, stepId: u.stepId, tool: u.tool, args: {}, outcome: "undone", detail: "Reverted." });
  }
  return true;
}

function go(path: string) {
  const before = window.location.pathname + window.location.search;
  if (before === path) return false;
  wouterNavigate(path);
  return before;
}

/** Council OS pane → its URL. */
export function panelPath(id: string): string {
  return `/dashboard/?tab=${encodeURIComponent(id)}`;
}

/** Tell a mounted surface about a step (a pane listens for `council:ui` and marks detail.handled). */
function announce(tool: string, args: Json): boolean {
  const detail: Json & { handled?: boolean } = { tool, args };
  window.dispatchEvent(new CustomEvent("council:ui", { detail }));
  return detail.handled === true;
}

/* ------------------------------------------------------------------ the registry */

type Executor = (args: Json, step: StepInput) => Promise<StepOutcome>;

const done = (detail: string): StepOutcome => ({ ok: true, state: "done", detail });
const skipped = (detail: string): StepOutcome => ({ ok: false, state: "skipped", detail });
const refused = (detail: string): StepOutcome => ({ ok: false, state: "refused", detail });

export const UI_COMMANDS: Record<FrontendToolName, Executor> = {
  async navigate(args, step) {
    const path = sameOrigin(args.path);
    if (!path) return refused("Only paths on this site are opened.");
    const before = go(path);
    if (before) undoStack.push({ stepId: step.id, tool: "navigate", run: () => wouterNavigate(before) });
    await sleep(reduceMotion() ? 50 : 500);
    return done(`Opened ${path}.`);
  },

  async openPanel(args, step) {
    const id = typeof args.id === "string" && /^[a-z0-9-]{2,40}$/.test(args.id) ? args.id : null;
    if (!id) return refused("No pane id.");
    return UI_COMMANDS.navigate({ path: panelPath(id) }, step);
  },

  async openSubject(args, step) {
    const id = typeof args.id === "string" ? args.id.trim() : "";
    if (!id) return refused("No subject.");
    const path =
      args.kind === "card" && /^[0-9a-f]{64}$/i.test(id)
        ? `/dashboard/?tab=verify&card=${id.toLowerCase()}`
        : args.kind === "server" && /^https?:\/\//.test(id)
          ? `/verify-server/?url=${encodeURIComponent(id)}`
          : args.kind === "axis" && /^[a-z0-9-]{2,60}$/.test(id)
            ? `/dashboard/?tab=board&axis=${id}`
            : null;
    if (!path) return refused("That subject is not a card id, a server URL or an axis id.");
    return UI_COMMANDS.navigate({ path }, step);
  },

  async setFilter(args, step) {
    const key = typeof args.key === "string" && /^[a-z_]{1,30}$/.test(args.key) ? args.key : null;
    const value = typeof args.value === "string" ? args.value.slice(0, 120) : null;
    if (!key || value === null) return refused("A filter needs a key and a value.");
    const u = new URL(window.location.href);
    const prev = u.searchParams.get(key);
    u.searchParams.set(key, value);
    const before = window.location.pathname + window.location.search;
    wouterNavigate(u.pathname + u.search, { replace: true });
    announce("setFilter", { key, value });
    undoStack.push({ stepId: step.id, tool: "setFilter", run: () => wouterNavigate(before, { replace: true }) });
    return done(prev === value ? `Filter ${key} was already ${value}.` : `Filter ${key} = ${value} (in the URL, so it can be shared).`);
  },

  async highlight(args, step) {
    const sel = typeof args.selector === "string" ? args.selector : "";
    const el = await waitFor(sel, 8000); // a pane or a lookup may still be loading
    if (!el) return skipped("That part is not on this page, so nothing was highlighted.");
    el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
    drawRing(el, typeof args.label === "string" ? args.label.slice(0, 80) : "");
    undoStack.push({ stepId: step.id, tool: "highlight", run: clearHighlight });
    await sleep(reduceMotion() ? 50 : 700);
    return done("Highlighted.");
  },

  async fillForm(args, step) {
    const sel = typeof args.selector === "string" ? args.selector : "form";
    const form = (await waitFor(sel, 2500)) as HTMLFormElement | null;
    const values = args.values && typeof args.values === "object" ? (args.values as Record<string, unknown>) : {};
    if (!form) return skipped("No matching form on this page; nothing was typed.");
    const prev: [HTMLInputElement | HTMLTextAreaElement, string][] = [];
    let n = 0;
    for (const [name, v] of Object.entries(values)) {
      const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[name="${CSS.escape(name)}"], [data-ui-field="${CSS.escape(name)}"], #${CSS.escape(name)}`,
      );
      if (!field || field.type === "password" || field.type === "hidden") continue;
      prev.push([field, field.value]);
      // React-controlled inputs: set through the native setter, then fire input.
      const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(field, String(v));
      field.dispatchEvent(new Event("input", { bubbles: true }));
      n++;
    }
    undoStack.push({
      stepId: step.id,
      tool: "fillForm",
      run: () =>
        prev.forEach(([f, old]) => {
          const proto = f instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(f, old);
          f.dispatchEvent(new Event("input", { bubbles: true }));
        }),
    });
    return n ? done(`Typed ${n} field${n === 1 ? "" : "s"}. Nothing was submitted.`) : skipped("None of the named fields are on this form.");
  },

  async runVerify(args) {
    await sleep(reduceMotion() ? 50 : 300);
    if (announce("runVerify", args)) return done("The check ran in your browser. It signs nothing.");
    const btn = (await waitFor("[data-ui-action='verify-run']", 2500)) as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      return done("The check ran in your browser. It signs nothing.");
    }
    return skipped("There is no verify control on this page, so nothing was checked.");
  },

  async scroll(args) {
    const el = await waitFor(String(args.selector ?? ""));
    if (!el) return skipped("That part is not on this page.");
    el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    return done("Scrolled.");
  },

  async focus(args) {
    const el = (await waitFor(String(args.selector ?? ""), 2500)) as HTMLElement | null;
    if (!el) return skipped("Nothing to focus on this page.");
    if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: false });
    return done("Focus moved.");
  },
};

/**
 * Execute one step. `confirmed` must be true for a commit, pay or schedule step; without it the
 * step is refused (the pane shows Confirm first and calls again). Always logged.
 */
export async function executeStep(step: StepInput, opts: { by?: string; confirmed?: boolean } = {}): Promise<StepOutcome> {
  const by = opts.by ?? "Ask GSPC";
  const needsConfirm = step.confirm === true || (step.effect !== undefined && step.effect !== "view");
  let out: StepOutcome;
  if (needsConfirm && !opts.confirmed) out = refused("This step needs your Confirm first.");
  else {
    const fn = UI_COMMANDS[step.tool];
    if (!fn) out = refused(`Unknown step ${String(step.tool)}.`);
    else {
      try {
        out = await fn(step.args ?? {}, step);
      } catch (e) {
        out = { ok: false, state: "failed", detail: e instanceof Error ? e.message : String(e) };
      }
    }
  }
  logAction({ by, stepId: step.id, tool: step.tool, args: step.args ?? {}, outcome: out.state, detail: out.detail });
  return out;
}

/* ------------------------------------------------------------------ agents in the page */

const AGENT_KEY = "coai:ui-agent-consent";

export function agentConsent(): boolean {
  try {
    return sessionStorage.getItem(AGENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAgentConsent(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(AGENT_KEY, "1");
    else sessionStorage.removeItem(AGENT_KEY);
  } catch {
    /* storage blocked: consent stays off */
  }
  logAction({ by: "you", stepId: "-", tool: "consent", args: { agents: on }, outcome: on ? "confirmed" : "stopped", detail: on ? "Agents may act in this tab until you switch it off or close the tab." : "Agent actions switched off." });
  window.dispatchEvent(new CustomEvent("council:agent-consent", { detail: on }));
}

/**
 * window.councilUi — the same frontend tools for an agent running in this page (a browser agent,
 * an extension, WebMCP). Refused unless the viewer granted agent consent in this tab. Commit, pay
 * and schedule steps are always refused here: those need the viewer's own Confirm in the pane.
 */
export function installAgentBridge(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { councilUi?: unknown };
  if (w.councilUi) return;
  w.councilUi = Object.freeze({
    version: "0.1",
    tools: FRONTEND_TOOLS,
    doc: "https://councilof.ai/agents/",
    consent: () => agentConsent(),
    context: () => getScreenContext(),
    async run(step: StepInput & { agent?: string }): Promise<StepOutcome> {
      const by = `agent${typeof step?.agent === "string" ? `:${step.agent.slice(0, 40)}` : ""}`;
      if (!agentConsent()) {
        const out = refused("The viewer has not allowed agents to act in this tab.");
        logAction({ by, stepId: String(step?.id ?? "-"), tool: String(step?.tool ?? "?"), args: {}, outcome: out.state, detail: out.detail });
        return out;
      }
      if (step?.effect && step.effect !== "view") {
        const out = refused("Commit, pay and schedule steps need the viewer's Confirm in the Ask GSPC pane.");
        logAction({ by, stepId: String(step.id ?? "-"), tool: String(step.tool), args: step.args ?? {}, outcome: out.state, detail: out.detail });
        return out;
      }
      window.dispatchEvent(new CustomEvent("council:agent-step", { detail: { by, step } }));
      return executeStep({ ...step, id: String(step?.id ?? `agent_${Date.now()}`), effect: "view", confirm: false }, { by });
    },
  });
}
