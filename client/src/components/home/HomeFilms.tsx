/**
 * Featured films — newest NotebookLM cuts, click-to-play.
 * Files stay under the Pages 25 MiB cap. Nothing autoplays a long clip.
 * Under each film: ticks and USPs so a first-time reader knows what they just saw.
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
    title: "The architecture of measurement",
    caption: "How a signed card is made. Deterministic grading, then Ed25519. Not a certificate.",
    takeaways: [
      { kind: "tick", text: "Frozen, published tests — the target does not move after you sit the run." },
      { kind: "tick", text: "A predicate an auditor can recompute. No model grades another model." },
      { kind: "tick", text: "The result is a small signed card: hash, signature, date, previous card." },
      { kind: "usp", text: "Not a certificate. Measurement you can check without asking us." },
    ],
  },
  {
    src: "/videos/architecture-of-trust.mp4",
    poster: "/videos/architecture-of-trust.jpg",
    title: "Council OS — the architecture of trust",
    caption: "The workspace: board, verify, get measured. One spine, two skins.",
    takeaways: [
      { kind: "tick", text: "Board, verify and get measured live in one workspace — no second login." },
      { kind: "tick", text: "Empty cells stay empty. A dash is honest emptiness, never a dressed-up zero." },
      { kind: "tick", text: "Two skins, one spine: the same living board whether you are on / or in /os." },
      { kind: "usp", text: "A rank is never sold. Position on the page is layout, not a purchase." },
    ],
  },
  {
    src: "/videos/trust-lobby.mp4",
    poster: "/videos/trust-lobby.jpg",
    title: "The trust lobby",
    caption: "Who the measurement is for. Insurers, labs, deployers. Rank is not for sale.",
    takeaways: [
      { kind: "tick", text: "Built for insurers, labs and deployers who need evidence, not adjectives." },
      { kind: "tick", text: "Verification is free forever — no account, no fee, no tier." },
      { kind: "watch", text: "We measure. We do not certify, accredit, enforce or give legal advice." },
      { kind: "usp", text: "Nobody we measure pays for a place, a score, or a removal." },
    ],
  },
];

export default function HomeFilms() {
  return (
    <section id="watch" aria-labelledby="watch-h" className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">Watch</p>
        <h2 id="watch-h" className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          See the instrument, then use it
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Three short films. Tap to play — the file loads only then. Under each one, what it
          actually means, in ticks. Verify a card when you are done.
        </p>
        <ul className="mt-10 grid gap-7 md:grid-cols-3">
          {FILMS.map((f) => (
            <li
              key={f.src}
              className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_18px_40px_-28px_rgba(4,18,12,.45)]"
            >
              <VideoEmbed src={f.src} poster={f.poster} title={f.title} caption={f.caption} className="max-w-none" />
              <div className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-1">
                <HomeUnderstand title="What this film is saying" items={f.takeaways} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
