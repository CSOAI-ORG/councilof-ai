import { useEffect, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "wouter";
import {
  NOTES_FEED_PATH,
  NOTES_INDEX_URL,
  ORIGIN,
  VERIFY_URL,
  articleLd,
  findNote,
  indexLd,
  noteUrl,
  notePath,
  notesNewestFirst,
} from "@/data/evidence-notes";

// /notes and /notes/:slug — one canonical, citable page per evidence note. Everything a note says
// is read from client/src/data/evidence-notes.json; the chrome below adds no numbers and no claims.
// The canonical <link> is owned by the central writer (RouteTitle + the prerender rewrite), so this
// page states the served URL in og:url and JSON-LD only.
export const NOTES_PAGE_COPY = {
  indexTitle: "Evidence notes",
  indexDescription:
    "Dated evidence notes from Council of AI, one citable page per note. Each note names the signed cards, receipts, ledgers or endpoints behind it, and a reader can fetch every one. Measurement, not certification.",
  indexIntro:
    "One page per note. Each note names the signed cards, receipts, ledgers or endpoints behind it, and a reader can fetch every one. Measurement, not certification: a gap without a separation test is not a ranking, and an UNMEASURED card has no quotable accuracy.",
  verify:
    "How to verify: fetch the artifacts listed above yourself, and check a signed card against the published key at",
  artifactsHeading: "Artifacts",
  feed: "Subscribe to new notes (RSS):",
  notFound: "No evidence note at this address.",
  allNotes: "All evidence notes",
  boundary: "Measurement, not certification. Not a grade, endorsement or legal finding.",
} as const;

const FEED_URL = `${ORIGIN}${NOTES_FEED_PATH}`;

// Render bare https URLs inside a note body as links, keeping the text byte-for-byte.
function linkify(text: string): ReactNode[] {
  const parts = text.split(/(https:\/\/[^\s)]+)/g);
  return parts.map((part, i) => {
    if (!part.startsWith("https://")) return part;
    const trail = part.match(/[.,;:]+$/)?.[0] ?? "";
    const href = trail ? part.slice(0, -trail.length) : part;
    return (
      <span key={i}>
        <a href={href} className="break-all font-mono text-[0.9em] text-emerald-800 underline underline-offset-4">
          {href}
        </a>
        {trail}
      </span>
    );
  });
}

export default function EvidenceNotesIndex() {
  const notes = notesNewestFirst();
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Helmet>
        <meta name="description" content={NOTES_PAGE_COPY.indexDescription} />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Evidence notes | Council of AI" />
        <meta property="og:description" content={NOTES_PAGE_COPY.indexDescription} />
        <meta property="og:url" content={NOTES_INDEX_URL} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Evidence notes | Council of AI" />
        <meta name="twitter:description" content={NOTES_PAGE_COPY.indexDescription} />
        <link rel="alternate" type="application/rss+xml" title="Council of AI — evidence notes" href={FEED_URL} />
        <script type="application/ld+json">{JSON.stringify(indexLd(notes))}</script>
      </Helmet>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">Measurement, not certification</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">{NOTES_PAGE_COPY.indexTitle}</h1>
      <p className="mt-3 text-slate-700">{NOTES_PAGE_COPY.indexIntro}</p>
      <p className="mt-2 text-sm text-slate-600">
        {NOTES_PAGE_COPY.feed}{" "}
        <a href={NOTES_FEED_PATH} className="font-mono text-emerald-800 underline">{NOTES_FEED_PATH}</a>
      </p>
      <ol className="mt-8 space-y-5">
        {notes.map((note) => (
          <li key={note.id} className="border-l-2 border-slate-200 pl-4">
            <time dateTime={note.date} className="font-mono text-xs text-slate-500">{note.date}</time>
            <h2 className="mt-1 text-lg font-bold leading-snug">
              <Link href={`${notePath(note.id)}/`} className="text-slate-900 hover:underline">{note.title}</Link>
            </h2>
            <p className="mt-1 text-sm text-slate-600">{note.summary}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}

export function EvidenceNotePage() {
  const params = useParams<{ slug: string }>();
  const note = findNote(params.slug);
  useEffect(() => {
    document.title = note ? `${note.title} | Council of AI` : "Evidence note not found | Council of AI";
  }, [note]);

  if (!note) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p>{NOTES_PAGE_COPY.notFound}</p>
        <Link href="/notes/" className="text-emerald-800 underline">{NOTES_PAGE_COPY.allNotes}</Link>
      </main>
    );
  }

  const url = noteUrl(note.id);
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Helmet>
        <meta name="description" content={note.summary} />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${note.title} | Council of AI`} />
        <meta property="og:description" content={note.summary} />
        <meta property="og:url" content={url} />
        <meta property="article:published_time" content={note.date} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${note.title} | Council of AI`} />
        <meta name="twitter:description" content={note.summary} />
        <link rel="alternate" type="application/rss+xml" title="Council of AI — evidence notes" href={FEED_URL} />
        <script type="application/ld+json">{JSON.stringify(articleLd(note))}</script>
      </Helmet>
      <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">
        <Link href="/notes/" className="hover:underline">{NOTES_PAGE_COPY.indexTitle}</Link>
      </nav>
      <article>
        <h1 className="mt-3 text-3xl font-black tracking-tight">{note.title}</h1>
        <p className="mt-2 font-mono text-xs text-slate-500">
          <time dateTime={note.date}>{note.date}</time> · Council of AI (CSOAI Ltd)
        </p>
        <p className="mt-6 text-lg leading-relaxed text-slate-700">{note.summary}</p>
        <p className="mt-6 break-words text-[16px] leading-relaxed text-slate-800">{linkify(note.body)}</p>
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{NOTES_PAGE_COPY.artifactsHeading}</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {note.artifacts.map((artifact) => (
              <li key={artifact.url}>
                <span className="font-semibold text-slate-800">{artifact.label}</span>
                <br />
                <a href={artifact.url} className="break-all font-mono text-xs text-emerald-800 underline underline-offset-4">
                  {artifact.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <p className="mt-8 text-sm text-slate-700">
          {NOTES_PAGE_COPY.verify}{" "}
          <a href={VERIFY_URL} className="font-mono text-emerald-800 underline">{VERIFY_URL}</a>.
        </p>
        <p className="mt-6 text-sm text-slate-500">{NOTES_PAGE_COPY.boundary}</p>
      </article>
      <p className="mt-10 text-sm">
        <Link href="/notes/" className="text-emerald-800 underline">{NOTES_PAGE_COPY.allNotes}</Link>
        {" · "}
        <a href={NOTES_FEED_PATH} className="font-mono text-emerald-800 underline">{NOTES_FEED_PATH}</a>
      </p>
    </main>
  );
}
