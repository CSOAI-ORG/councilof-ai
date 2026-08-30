/**
 * HomeUnderstand — ticks, USPs and watch-outs for a first-time reader.
 *
 * Used under films, the desk, the board and product tiles so every band
 * answers “what does this mean for me?” in the same voice. No invented
 * board counts. Measurement, not certification.
 */

export type UnderstandKind = "tick" | "usp" | "watch";

export type UnderstandItem = {
  kind?: UnderstandKind;
  text: string;
};

const MARK: Record<UnderstandKind, { glyph: string; wrap: string; glyphClass: string }> = {
  tick: {
    glyph: "✓",
    wrap: "text-emerald-800",
    glyphClass: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  },
  usp: {
    glyph: "★",
    wrap: "text-emerald-950",
    glyphClass: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-500/25",
  },
  watch: {
    glyph: "·",
    wrap: "text-slate-700",
    glyphClass: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-300/80",
  },
};

export default function HomeUnderstand({
  title,
  items,
  className = "",
}: {
  title?: string;
  items: Array<string | UnderstandItem>;
  className?: string;
}) {
  return (
    <div className={className}>
      {title && (
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
          {title}
        </p>
      )}
      <ul className="space-y-2">
        {items.map((raw) => {
          const item = typeof raw === "string" ? { text: raw, kind: "tick" as const } : raw;
          const kind = item.kind ?? "tick";
          const mark = MARK[kind];
          return (
            <li key={item.text} className={`flex items-start gap-2.5 text-[13.5px] leading-snug ${mark.wrap}`}>
              <span
                aria-hidden
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${mark.glyphClass}`}
              >
                {mark.glyph}
              </span>
              <span>
                {kind === "usp" && (
                  <span className="mr-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                    only here
                  </span>
                )}
                {item.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
