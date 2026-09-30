/**
 * DocMeta — the header strip a docs page carries (the Cloudflare developer-docs pattern): Last
 * updated, Copy as Markdown, a copyable "set up your agent" prompt, and "Was this helpful".
 *
 * Copy as Markdown converts the page's own rendered <main> text, so it cannot drift from the page.
 * "Was this helpful" keeps the answer in this browser only (nothing is sent; there is no feedback
 * endpoint) and points to the correction route for anything specific. `updated` is the date the
 * page's source last changed (git log), set when the page changes.
 */
import { useState } from "react";
import { Bot, Check, ClipboardCopy, ThumbsDown, ThumbsUp } from "lucide-react";

export const AGENT_SETUP_PROMPT = [
  "Add the free Council of AI MCP server to this agent: https://councilof.ai/mcp/free (streamable HTTP, no key).",
  "Then call board_totals and quote public_count verbatim with its state.",
  "Then call list_cards with limit 1 and verify_card on the id it returns; report the state the tool returns (VALID, INVALID or UNCHECKABLE).",
  "Rules: quote tool fields, never invent a number, say 'not measured' when no tool answers, and never describe anything as certified.",
  "Docs: https://councilof.ai/agents/ and https://councilof.ai/connect/",
].join("\n");

/** Rendered DOM → Markdown: headings, paragraphs, lists, code, links, tables as rows. */
export function toMarkdown(root: Element): string {
  const out: string[] = [];
  const inline = (n: Node): string => {
    if (n.nodeType === Node.TEXT_NODE) return (n.textContent ?? "").replace(/\s+/g, " ");
    if (!(n instanceof HTMLElement)) return "";
    if (n.getAttribute("aria-hidden") === "true" || n.hidden || n.dataset.docMeta !== undefined) return "";
    const kids = Array.from(n.childNodes).map(inline).join("");
    const tag = n.tagName;
    if (tag === "A") {
      const href = n.getAttribute("href") ?? "";
      const abs = href.startsWith("/") ? `https://councilof.ai${href}` : href;
      return abs ? `[${kids.trim()}](${abs})` : kids;
    }
    if (tag === "CODE") return `\`${kids}\``;
    if (tag === "STRONG" || tag === "B") return `**${kids.trim()}**`;
    if (tag === "EM" || tag === "I") return `_${kids.trim()}_`;
    if (tag === "BR") return "\n";
    return kids;
  };
  const block = (el: Element, depth = 0) => {
    if (!(el instanceof HTMLElement)) return;
    if (el.getAttribute("aria-hidden") === "true" || el.hidden || el.dataset.docMeta !== undefined) return;
    if (/^(SCRIPT|STYLE|NOSCRIPT|BUTTON|FORM|NAV|SVG)$/.test(el.tagName)) return;
    const m = el.tagName.match(/^H([1-6])$/);
    if (m) return void out.push(`${"#".repeat(Number(m[1]))} ${inline(el).trim()}`, "");
    if (el.tagName === "P") {
      const t = inline(el).trim();
      if (t) out.push(t, "");
      return;
    }
    if (el.tagName === "PRE") return void out.push("```", (el.textContent ?? "").replace(/\n$/, ""), "```", "");
    if (el.tagName === "UL" || el.tagName === "OL") {
      Array.from(el.children).forEach((li, i) => {
        if (li.tagName !== "LI") return;
        out.push(`${"  ".repeat(depth)}${el.tagName === "OL" ? `${i + 1}.` : "-"} ${inline(li).trim()}`);
      });
      out.push("");
      return;
    }
    if (el.tagName === "TABLE") {
      el.querySelectorAll("tr").forEach((tr, i) => {
        const cells = Array.from(tr.children).map((c) => inline(c).trim().replace(/\|/g, "\\|"));
        out.push(`| ${cells.join(" | ")} |`);
        if (i === 0) out.push(`|${cells.map(() => " --- ").join("|")}|`);
      });
      out.push("");
      return;
    }
    Array.from(el.children).forEach((c) => block(c, depth));
  };
  block(root);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function useCopy() {
  const [done, setDone] = useState<string | null>(null);
  const copy = (key: string, text: string) =>
    void navigator.clipboard?.writeText(text).then(
      () => {
        setDone(key);
        window.setTimeout(() => setDone((d) => (d === key ? null : d)), 2500);
      },
      () => setDone(null),
    );
  return { done, copy };
}

export default function DocMeta({ updated, slug }: { updated: string; slug: string }) {
  const { done, copy } = useCopy();
  const key = `coai:helpful:${slug}`;
  const [vote, setVote] = useState<"yes" | "no" | null>(() => {
    try {
      const v = window.localStorage.getItem(key);
      return v === "yes" || v === "no" ? v : null;
    } catch {
      return null;
    }
  });
  const cast = (v: "yes" | "no") => {
    setVote(v);
    try {
      window.localStorage.setItem(key, v);
    } catch {
      /* storage blocked: the answer lasts for this page */
    }
  };
  const d = new Date(`${updated}T00:00:00Z`);
  const human = Number.isNaN(d.getTime()) ? updated : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const btn =
    "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700";

  return (
    <div data-doc-meta="" className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900" data-testid="doc-meta">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-slate-700">
          Last updated <time dateTime={updated}>{human}</time>
        </p>
        <button
          type="button"
          className={btn}
          onClick={() => {
            const main = document.querySelector("main") ?? document.body;
            copy("md", toMarkdown(main));
          }}
        >
          {done === "md" ? <Check className="h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
          {done === "md" ? "Copied" : "Copy as Markdown"}
        </button>
        <button type="button" className={btn} onClick={() => copy("agent", AGENT_SETUP_PROMPT)} aria-describedby={`${slug}-agent-hint`}>
          {done === "agent" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Bot className="h-4 w-4" aria-hidden="true" />}
          {done === "agent" ? "Copied" : "Set up your agent"}
        </button>
      </div>
      <p id={`${slug}-agent-hint`} className="mt-1 text-xs text-slate-700">
        &ldquo;Set up your agent&rdquo; copies a prompt for Claude, Cursor, Codex or any MCP client: it adds the free MCP door and runs one
        verify.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2" role="group" aria-label="Was this page helpful?">
        <span className="text-sm font-semibold">Was this helpful?</span>
        <button type="button" className={btn} aria-pressed={vote === "yes"} onClick={() => cast("yes")}>
          <ThumbsUp className="h-4 w-4" aria-hidden="true" /> Yes
        </button>
        <button type="button" className={btn} aria-pressed={vote === "no"} onClick={() => cast("no")}>
          <ThumbsDown className="h-4 w-4" aria-hidden="true" /> No
        </button>
        {vote ? (
          <span className="text-xs text-slate-700" aria-live="polite">
            Thank you. Your answer stays in this browser; nothing is sent. To tell us something specific,{" "}
            <a href="/dispute/" className="font-medium underline underline-offset-2">
              ask for a correction
            </a>
            .
          </span>
        ) : null}
      </div>
    </div>
  );
}
