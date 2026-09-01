/**
 * Featured films — three NotebookLM cuts, click-to-play, one row.
 * Files stay under the Pages 25 MiB cap. Nothing autoplays a long clip.
 */
import { VideoEmbed } from "@/components/scrollworld";
import HomeUnderstand, { type UnderstandItem } from "./HomeUnderstand";

const FILMS: {
  src: string;
  poster: string;
  title: string;
  caption: string;
  takeaways: UnderstandItem[];
}[] = [
  {
    src: "/videos/architecture-of-measurement.mp4",
    poster: "/videos/architecture-of-measurement.jpg",
    title: "How a card is made",
    caption: "Frozen tests. Deterministic grade. Then Ed25519. Not a certificate.",
    takeaways: [
      { kind: "tick", text: "Frozen, published tests — the target does not move after you sit the run." },
      { kind: "tick", text: "No model grades another model." },
      { kind: "usp", text: "A small signed card. Anyone checks it without us." },
    ],
  },
  {
    src: "/videos/architecture-of-trust.mp4",
    poster: "/videos/architecture-of-trust.jpg",
    title: "One workspace. Two skins.",
    caption: "Board, verify, get measured. The same living board on / and in /os.",
    takeaways: [
      { kind: "tick", text: "One workspace. No second login." },
      { kind: "tick", text: "Empty cells stay empty. A dash is honest emptiness, never a dressed-up zero." },
      { kind: "usp", text: "A rank is never sold. Layout is not a purchase." },
    ],
  },
  {
    src: "/videos/trust-lobby.mp4",
    poster: "/videos/trust-lobby.jpg",
    title: "Who the measurement is for",
    caption: "Insurers, labs, deployers. Evidence, not adjectives.",
    takeaways: [
      { kind: "tick", text: "Built for people who need evidence, not adjectives." },
      { kind: "watch", text: "We measure. We do not certify, accredit or enforce." },
      { kind: "usp", text: "Nobody we measure pays for a place or a score." },
    ],
  },
];

export default function HomeFilms() {
  return (
    <section
      id="watch"
      aria-labelledby="watch-h"
      className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-700">Watch</p>
        <h2 id="watch-h" className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Three films. Then the scale.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          Tap to play — the file loads only then. Under each one, what it actually means.
        </p>
        <ul className="mt-14 grid gap-8 lg:grid-cols-3 lg:gap-7">
          {FILMS.map((f) => (
            <li
              key={f.src}
              className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_18px_40px_-28px_rgba(4,18,12,.45)]"
            >
              <VideoEmbed src={f.src} poster={f.poster} title={f.title} caption={f.caption} className="max-w-none" />
              <div className="flex flex-1 flex-col px-5 pb-6 pt-1 sm:px-6">
                <HomeUnderstand title="What this film is saying" items={f.takeaways} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
