import type { ReactNode } from "react";

/**
 * answerText — render a Council reply the way it was written.
 *
 * /api/chat answers in Markdown: `**15**` for the figures that matter, `` `code` ``
 * for endpoints, `_…_` for the grounding footer, and `- ` bullets for the axis
 * lists. The thread rendered the raw string inside `whitespace-pre-wrap`, so the
 * Council OS ask bar — the estate's own front door — printed
 *
 *     **15** of the **22** published slots carry a measurement
 *     _Grounded in GET /api/gspc totals …_
 *
 * asterisks and all, with every bullet run together as plain text. The emphasis
 * the answer puts on its own numbers was the first thing lost.
 *
 * DELIBERATELY TINY, AND NEVER innerHTML. This builds React nodes from a
 * whitelist of four inline forms and one block form. There is no HTML parser and
 * no `dangerouslySetInnerHTML`, so a reply cannot inject markup into the OS no
 * matter what comes back over the wire. Anything it does not recognise — links,
 * tables, headings — falls through as literal text rather than being guessed at.
 */

/**
 * `**bold**`, `` `code` ``, `_italic_`. Bold and code are tried first so `**`
 * can never be mistaken for two italics.
 *
 * THE ITALIC RULE IS THE FIDDLY ONE, and getting it wrong is visible: a naive
 * `_[^_]+_` ate the underscores out of the grounding footer's own field names and
 * printed "(measured axis / public count)" for `(measured_axes / public_count)` —
 * turning the exact JSON keys a reader would grep for into prose. A `_` counts as
 * a delimiter only where it is NOT word-internal (nothing alphanumeric on the
 * outside), which leaves snake_case identifiers alone while still italicising a
 * footer that contains them.
 */
const INLINE =
  /(\*\*[^*]+\*\*|`[^`]+`|(?<![A-Za-z0-9_])_(?!\s)[^\n]*?(?<!\s)_(?![A-Za-z0-9_]))/g;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const parts = text.split(INLINE);
  parts.forEach((part, i) => {
    if (!part) return;
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      out.push(
        <strong key={key} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>,
      );
      return;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      out.push(
        <code key={key} className="rounded bg-slate-900/[0.06] px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>,
      );
      return;
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      out.push(
        <em key={key} className="text-slate-700">
          {part.slice(1, -1)}
        </em>,
      );
      return;
    }
    out.push(<span key={key}>{part}</span>);
  });
  return out;
}

/**
 * Render one reply. Consecutive `- ` lines become a real <ul>; blank lines break
 * paragraphs; every other line keeps its own line, as it did before.
 */
export function AnswerText({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let bullets: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const key = `p${blocks.length}`;
    blocks.push(
      <p key={key} className="whitespace-pre-wrap">
        {para.map((l, i) => (
          <span key={`${key}-l${i}`}>
            {i > 0 && "\n"}
            {inline(l, `${key}-l${i}`)}
          </span>
        ))}
      </p>,
    );
    para = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    const key = `u${blocks.length}`;
    blocks.push(
      <ul key={key} className="ml-1 space-y-0.5">
        {bullets.map((b, i) => (
          <li key={`${key}-i${i}`} className="flex gap-2">
            <span aria-hidden="true" className="select-none text-slate-400">
              ·
            </span>
            <span className="min-w-0">{inline(b, `${key}-i${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      bullets.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    flushBullets();
    if (line.trim() === "") {
      flushPara();
      continue;
    }
    para.push(line);
  }
  flushBullets();
  flushPara();

  return <div className="space-y-3">{blocks}</div>;
}
