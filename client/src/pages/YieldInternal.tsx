import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

export default function YieldInternal() {
  return (
    <section className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Reference withdrawn | Council of AI</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>
      <section className="mx-auto max-w-3xl" aria-labelledby="withdrawn-reference-h">
        <h1 id="withdrawn-reference-h" className="text-3xl font-black">Reference withdrawn</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          This operator reference is no longer published. Current service status,
          published methods and dated corrections are available below.
        </p>
        <nav className="mt-6 flex flex-wrap gap-5 text-sm" aria-label="Public references">
          <Link href="/status" className="text-emerald-300 underline">Service status</Link>
          <Link href="/methodology" className="text-emerald-300 underline">Published methods</Link>
          <Link href="/corrections" className="text-emerald-300 underline">Corrections</Link>
        </nav>
      </section>
    </section>
  );
}
