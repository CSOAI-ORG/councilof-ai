/**
 * ResultCard — one tool result as a visual A2UI / AG-UI surface (owner brief, 1 Oct 2026):
 *   a compact header with a state chip, 2–4 stat tiles, ONE "Verify yourself" link,
 *   and the details and raw output behind an expander.
 * 8 px grid (p-2/p-4, gap-2), body ≥ 14 px, nothing under 12 px. Jargon lives in tooltips
 * (the chip's title, the link's title) and in the expander, never in the face of the card.
 * The link text is always "Verify yourself"; the record id or timestamp it points at is in title=.
 */
import type { ReactNode } from "react";
import { ChevronDown, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { toneOf, type Tone } from "@/lib/aguiTalk";
import { stateMeaning, type StatTile } from "@/lib/resultCard";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const CHIP_TONE: Record<Tone, string> = {
  measured: "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-950 dark:text-emerald-100",
  unmeasured: "border-slate-400/50 bg-slate-100 text-slate-800 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100",
  payment: "border-amber-700/30 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-950 dark:text-amber-100",
  problem: "border-rose-700/30 bg-rose-50 text-rose-900 dark:border-rose-400/40 dark:bg-rose-950 dark:text-rose-100",
  neutral: "border-border bg-muted text-foreground",
};

const RAIL: Record<Tone, string> = {
  measured: "before:bg-emerald-600",
  unmeasured: "before:bg-slate-400",
  payment: "before:bg-amber-500",
  problem: "before:bg-rose-600",
  neutral: "before:bg-border",
};

export function StateChip({ label, className = "" }: { label?: string; className?: string }) {
  if (!label) return null;
  const words = label.replace(/_/g, " ");
  return (
    <span
      title={stateMeaning(label)}
      className={`inline-flex max-w-full cursor-help items-center rounded-full border px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wide ${CHIP_TONE[toneOf(label)]} ${className}`}
      data-testid="talk-state"
    >
      <span className="truncate">{words}</span>
    </span>
  );
}

export type ResultCardProps = {
  title: string;
  /** The tool's own name, shown small (and in the expander) so agents and people see the same thing. */
  tool: string;
  /** Tooltip for the tool line, when the line is a plain phrase rather than a tool name. */
  toolHint?: string;
  label?: string;
  running?: boolean;
  tiles: StatTile[];
  verifyUrl?: string | null;
  recordId?: string | null;
  /** The tool's own state word, shown small when the chip says something plainer (READ). */
  toolWord?: string | null;
  /** One plain line on the card face naming what was looked up (e.g. the URL a domain became). */
  checked?: string | null;
  /** The tool's own one-line summary: goes in the expander, verbatim. */
  summary?: string;
  /** The answer text for this tool, as streamed: goes in the expander. */
  answer?: ReactNode;
  args?: string;
  raw?: unknown;
  /** Extra content under the tiles (a payment challenge, model rows ...). */
  children?: ReactNode;
  as?: "li" | "div";
  testId?: string;
};

export default function ResultCard({
  title,
  tool,
  toolHint,
  label,
  running,
  tiles,
  verifyUrl,
  recordId,
  toolWord,
  checked,
  summary,
  answer,
  args,
  raw,
  children,
  as = "li",
  testId = "talk-tool-card",
}: ResultCardProps) {
  const tone = toneOf(label);
  const Tag = as;
  const external = !!verifyUrl && /^https?:\/\//.test(verifyUrl);
  return (
    <Tag
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-4 pl-5 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 ${RAIL[tone]}`}
      data-testid={testId}
      data-state={label ?? (running ? "running" : "none")}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">{title}</h3>
          <p
            className={`${/^[\w.:/-]+$/.test(tool) ? "font-mono " : ""}text-xs text-muted-foreground`}
            title={toolHint ?? "The tool that answered (the same one /mcp serves)"}
          >
            {tool}
            {toolWord ? (
              <span className="font-sans" title="The tool's own word for this result" data-testid="result-tool-word">
                {" "}
                · the tool says {toolWord}
              </span>
            ) : null}
          </p>
        </div>
        {running ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden="true" /> checking
          </span>
        ) : (
          <StateChip label={label} className="shrink-0" />
        )}
      </div>

      {!running && label ? <p className="mt-2 text-sm leading-snug text-muted-foreground">{stateMeaning(label)}</p> : null}
      {!running && checked ? (
        <p className="mt-1 text-sm leading-snug text-foreground [overflow-wrap:anywhere]" data-testid="result-checked">
          {checked}
        </p>
      ) : null}

      {tiles.length ? (
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="result-tiles">
          {tiles.map((t) => (
            <div key={t.key} className="min-w-0 rounded-xl bg-muted/70 px-3 py-2" title={`Field: ${t.key}`}>
              <dt className="truncate text-xs font-medium text-muted-foreground">{t.label}</dt>
              <dd className="truncate font-mono text-base font-bold leading-tight text-foreground sm:text-lg" title={t.value}>{t.value}</dd>
              {t.hint ? (
                <dd className="truncate text-xs text-muted-foreground" title={t.hint}>
                  {t.hint}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}

      {children}

      {verifyUrl ? (
        <p className="mt-3 flex min-w-0 items-center gap-2 text-sm" data-testid="talk-citation">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
          <a
            href={verifyUrl}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            title={recordId ? `Record: ${recordId}` : verifyUrl}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded font-semibold text-emerald-800 underline underline-offset-2 dark:text-emerald-300 ${FOCUS}`}
          >
            Verify yourself
            {external ? <ExternalLink className="h-3 w-3" aria-hidden="true" /> : null}
            {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
          </a>
        </p>
      ) : null}

      {summary || answer || args || raw !== undefined ? (
        <details className="group mt-3 border-t border-border pt-2" data-testid="result-details">
          <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-1 rounded text-sm font-medium text-muted-foreground hover:text-foreground ${FOCUS}`}>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            Details and raw output
          </summary>
          <div className="space-y-2 pb-1 text-sm">
            {summary ? <p className="text-foreground [overflow-wrap:anywhere]">{summary}</p> : null}
            {answer ? <div data-testid="talk-answer-detail">{answer}</div> : null}
            {args ? (
              <p className="font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
                <span className="font-sans font-medium">Called with: </span>
                {args}
              </p>
            ) : null}
            {raw !== undefined && raw !== null ? (
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
                {JSON.stringify(raw, null, 2)}
              </pre>
            ) : null}
          </div>
        </details>
      ) : null}
    </Tag>
  );
}
