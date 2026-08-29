/**
 * Featured films — newest NotebookLM cuts, click-to-play.
 * Files stay under the Pages 25 MiB cap. Nothing autoplays a long clip.
 */
import { VideoEmbed } from "@/components/scrollworld";

const FILMS = [
  {
    src: "/videos/architecture-of-measurement.mp4",
    poster: "/videos/architecture-of-measurement.jpg",
    title: "The architecture of measurement",
    caption: "How a signed card is made. Deterministic grading, then Ed25519. Not a certificate.",
  },
  {
    src: "/videos/architecture-of-trust.mp4",
    poster: "/videos/architecture-of-trust.jpg",
    title: "Council OS — the architecture of trust",
    caption: "The workspace: board, verify, get measured. One spine, two skins.",
  },
  {
    src: "/videos/trust-lobby.mp4",
    poster: "/videos/trust-lobby.jpg",
    title: "The trust lobby",
    caption: "Who the measurement is for. Insurers, labs, deployers. Rank is not for sale.",
  },
] as const;

export default function HomeFilms() {
  return (
    <section id="watch" aria-labelledby="watch-h" className="border-t border-slate-200 bg-slate-50 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">Watch</p>
        <h2 id="watch-h" className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          See the instrument, then use it
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Three short films. Tap to play — the file loads only then. Verify a card when you are done.
        </p>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {FILMS.map((f) => (
            <li key={f.src}>
              <VideoEmbed src={f.src} poster={f.poster} title={f.title} caption={f.caption} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
