import { useEffect, useId, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { SECTORS, itemsBySector, libraryItems, type LibraryItem } from "../data/library-ia";
import { setMetaDescription } from "@/lib/utils";

// /library and /library/:sector — the archive hub. The "align, don't delete" surface: every
// page Council of AI has published, kept, dated, and organized by the 8 content sectors. This is
// the AEO/A2A engine: deep, factual, machine-legible coverage that answer engines cite and agents
// query. The primary experience stays lean; nothing is lost.
export default function Library() {
  const params = useParams();
  const searchId = useId();
  const activeSector = (params as any)?.sector as string | undefined;
  const [q, setQ] = useState("");
  const bySector = useMemo(() => itemsBySector(), []);
  const all = useMemo(() => libraryItems(), []);

  useEffect(() => {
    document.title = activeSector
      ? `${SECTORS.find((s) => s.id === activeSector)?.title ?? "Library"} — Library | Council of AI`
      : "Library — the Council of AI reference archive";
    const sectorMeta = activeSector ? SECTORS.find((s) => s.id === activeSector) : null;
    setMetaDescription(
      sectorMeta
        ? `${sectorMeta.title} — Library, Council of AI (CSOAI LTD, UK 16939677). ${sectorMeta.blurb}`
        : "The Council of AI reference library: every page we publish, dated and organised by sector — EU AI Act and regulation, GSPC benchmarks, frameworks, academy, regions, verification, product and company.",
    );
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Council of AI — Library",
      description:
        "The reference archive of Council of AI: measured axis, EU AI Act statute, governance frameworks, jurisdictions, verification tech, and company records — organized by sector.",
      url: "https://councilof.ai/library",
      isPartOf: { "@id": "https://councilof.ai/#org" },
      hasPart: SECTORS.map((s) => ({
        "@type": "CollectionPage",
        name: s.title,
        url: `https://councilof.ai/library/${s.id}`,
        description: s.blurb,
      })),
    });
    document.head.appendChild(sc);
    return () => { try { document.head.removeChild(sc); } catch { /* gone */ } };
  }, [activeSector]);

  const filter = (items: LibraryItem[]) =>
    !q.trim() ? items : items.filter((i) => (i.title + " " + i.path).toLowerCase().includes(q.toLowerCase()));

  const shownSectors = activeSector ? SECTORS.filter((s) => s.id === activeSector) : SECTORS;
  const matchCount = shownSectors.reduce((n, s) => n + filter(bySector[s.id] ?? []).length, 0);

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0c1a12]">
      <header className="border-b border-[#e6e8e2] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-700">Reference archive</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">The Council of AI Library</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Everything we have published — measured axes, EU AI Act statute, governance frameworks,
            jurisdictions, verification tech, and company records — kept, dated, and organized. The
            current experience is lean and lives at{" "}
            <Link href="/" className="font-semibold text-emerald-700 underline">the measurement board</Link>;
            this is the record behind it. {all.length} reference pages across {SECTORS.length} sectors.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="w-full max-w-sm">
              <label htmlFor={searchId} className="sr-only">Search the library</label>
              <input
                id={searchId}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the library…"
                aria-describedby={`${searchId}-count`}
                className="min-h-[44px] w-full rounded-lg border border-[#e6e8e2] bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              />
              <p id={`${searchId}-count`} className="sr-only" role="status" aria-live="polite">
                {q.trim() ? `${matchCount} of ${all.length} reference pages match` : `${all.length} reference pages`}
              </p>
            </div>
            {activeSector && (
              <Link href="/library" className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 sm:min-h-0">
                ← All sectors
              </Link>
            )}
          </div>
          {!activeSector && (
            <nav className="mt-5 flex flex-wrap gap-2" aria-label="Library sectors">
              {SECTORS.map((s) => (
                <Link key={s.id} href={`/library/${s.id}`}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-[#e6e8e2] bg-white px-3 py-1 text-[12px] font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-800 sm:min-h-0">
                  {s.title} <span className="text-slate-500">{bySector[s.id]?.length ?? 0}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {shownSectors.map((s) => {
          const items = filter(bySector[s.id] ?? []);
          if (!items.length) return null;
          return (
            <section key={s.id} className="mb-10" id={s.id}>
              <div className="flex items-baseline justify-between gap-3 border-b border-[#e6e8e2] pb-2">
                <h2 className="text-xl font-bold tracking-tight">{s.title}</h2>
                <span className="font-mono text-[11px] text-slate-500">{items.length} pages</span>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-600">{s.blurb}</p>
              <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it) => (
                  <li key={it.path}>
                    <Link href={it.path} className="group flex min-h-[44px] items-center gap-2 rounded px-1 py-1 text-sm hover:bg-emerald-50 sm:min-h-0 sm:items-baseline">
                      <span className="truncate text-slate-800 group-hover:text-emerald-800">{it.title}</span>
                      <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-500">{it.path}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {matchCount === 0 && (
          <p className="py-16 text-center text-sm text-slate-600">
            {q.trim()
              ? <>No reference pages match “{q}”. <Link href="/library" className="font-semibold text-emerald-700 underline">Clear the search</Link>.</>
              : <>This sector is empty. <Link href="/library" className="font-semibold text-emerald-700 underline">Back to all sectors</Link>.</>}
          </p>
        )}
      </main>
    </div>
  );
}
