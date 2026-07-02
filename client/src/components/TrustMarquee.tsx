import { TRUST, KIND_META, type TrustItem } from "../data/trustWall";

// A horizontally-scrolling "trust wall" of frameworks we align to, open source we
// are built on, and standards we implement. Each chip links to its official source
// (that's what makes it real social authority — every claim is verifiable).
// variant="strip": slim single-line marquee for the OS bottom bar.
// variant="full":  headed section for pages, with a legend.

function Chip({ t, dark }: { t: TrustItem; dark?: boolean }) {
  const meta = KIND_META[t.kind];
  return (
    <a
      href={t.url}
      target="_blank"
      rel="noreferrer"
      title={`${t.full} — ${meta.note}`}
      className={
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold no-underline transition " +
        (dark
          ? "border-white/12 bg-white/[0.04] text-emerald-50/90 hover:border-white/30 hover:bg-white/10"
          : "border-gray-200 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50")
      }
    >
      <span aria-hidden style={{ fontSize: 13 }}>{t.emblem}</span>
      <span>{t.label}</span>
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 9, background: meta.tint }} />
    </a>
  );
}

export default function TrustMarquee({
  variant = "full",
  dark = false,
  speed = 60,
}: {
  variant?: "strip" | "full";
  dark?: boolean;
  speed?: number; // seconds per loop
}) {
  const row = [...TRUST, ...TRUST]; // duplicate for a seamless loop
  const track = (
    <div className="tm-track" style={{ animationDuration: speed + "s" }}>
      {row.map((t, i) => (
        <Chip key={t.label + i} t={t} dark={dark} />
      ))}
    </div>
  );

  const css = `
    .tm-mask{position:relative;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);}
    .tm-track{display:flex;gap:8px;width:max-content;animation-name:tmScroll;animation-timing-function:linear;animation-iteration-count:infinite;}
    .tm-mask:hover .tm-track{animation-play-state:paused;}
    @keyframes tmScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    @media (prefers-reduced-motion: reduce){.tm-track{animation:none;flex-wrap:wrap;width:auto;}}
  `;

  if (variant === "strip") {
    return (
      <div className={dark ? "w-full" : "w-full"}>
        <style>{css}</style>
        <div className="tm-mask py-1">{track}</div>
      </div>
    );
  }

  return (
    <section className={(dark ? "text-emerald-50" : "text-gray-900") + " w-full"}>
      <style>{css}</style>
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={"text-sm font-bold uppercase tracking-wide " + (dark ? "text-emerald-300" : "text-emerald-700")}>
            Aligned to the world's frameworks · built on open source · verifiable
          </h2>
          <p className={"text-[11px] " + (dark ? "text-emerald-200/60" : "text-gray-400")}>
            Every badge links to its official source. We map & implement these — we do not claim endorsement.
          </p>
        </div>
      </div>
      <div className="tm-mask py-2">{track}</div>
      <div className="mx-auto mt-2 flex max-w-6xl flex-wrap gap-x-4 gap-y-1 px-4 text-[10px]">
        {Object.entries(KIND_META).map(([k, m]) => (
          <span key={k} className={"inline-flex items-center gap-1 " + (dark ? "text-emerald-200/60" : "text-gray-400")}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: m.tint, display: "inline-block" }} />
            {m.note}
          </span>
        ))}
      </div>
    </section>
  );
}
