import type { Point, Slide } from "./types";

/* ————— benefit-led bullets: PAIN · BENEFIT · USP ————— */
const TAG_LABEL: Record<Point["tag"], string> = { pain: "Pain", benefit: "You get", usp: "Only here" };
const TAG_LIGHT: Record<Point["tag"], string> = {
  pain: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  benefit: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  usp: "bg-emerald-600/12 text-emerald-800 ring-1 ring-emerald-600/25",
};
const TAG_DARK: Record<Point["tag"], string> = {
  pain: "bg-rose-500/20 text-rose-100 ring-1 ring-rose-300/30",
  benefit: "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/30",
  usp: "bg-emerald-400/20 text-emerald-50 ring-1 ring-emerald-300/45",
};

export function Points({ points, dark, center }: { points: Point[]; dark?: boolean; center?: boolean }) {
  return (
    <ul className={`measure mt-6 flex w-full flex-col gap-3 ${center ? "mx-auto text-left" : ""}`}>
      {points.map((pt) => (
        <li key={pt.text} className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${dark ? TAG_DARK[pt.tag] : TAG_LIGHT[pt.tag]}`}>
            {TAG_LABEL[pt.tag]}
          </span>
          <span className={`text-[15px] leading-[1.6] ${dark ? "text-white/90" : "text-gray-700"}`}>{pt.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function Cta({ slide }: { slide: Slide }) {
  if (!slide.href || !slide.cta) return null;
  return (
    <a
      href={slide.href}
      className="mt-8 inline-flex min-h-[44px] items-center rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-extrabold text-white shadow-lg shadow-emerald-900/15 transition-colors hover:bg-emerald-800"
    >
      {slide.cta}
    </a>
  );
}
