import { useLocation, Link } from "wouter";
import { isLibraried, classify, replacementFor, PRIMARY_PATHS } from "../data/library-ia";
import { useSiteChromeHidden } from "@/lib/osChrome";

// ArchivedBanner — mounted once globally. On any LIBRARIED (non-primary) page it shows a slim,
// honest "archived / reference" strip that (a) tells the reader this is an archive page, (b)
// links to the page's sector in the Library, and (c) points to the lean current experience.
// Nothing is deleted — this is the gov.uk pattern: the page stays for SEO/AEO, marked as archive.
// Primary pages (PRIMARY_PATHS) render nothing.
export default function ArchivedBanner() {
  const hideChrome = useSiteChromeHidden();
  const [loc] = useLocation();
  const path = (loc || "/").replace(/\/$/, "") || "/";
  if (hideChrome || !isLibraried(path)) return null;

  const sector = classify(path);
  const repl = replacementFor(path);
  return (
    <div
      role="note"
      aria-label="Archived reference page"
      className="border-b border-amber-300/40 bg-amber-50 text-amber-900"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 text-[12px]">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          Reference / archive
        </span>
        <span className="text-amber-800/80">
          {repl ? (
            <>
              A reference page — there is a current version:{" "}
              <Link href={repl.path} className="font-semibold underline hover:text-amber-950">{repl.label} →</Link>
            </>
          ) : (
            /* This branch used to read "A dated reference page… start at the measurement
               board" and link to "/". Three things wrong with that, and 236 of the 251
               archived pages saw it: it called itself DATED while showing no date; it
               labelled the link "the measurement board" while pointing at the HOMEPAGE, so
               the label named a page the link did not go to; and by offering a destination
               at all it implied the homepage supersedes this page, when in fact nothing
               does — only 5 replacements are mapped. Saying "no current version" plainly is
               more useful to a reader than a confident pointer to the wrong place. */
            <>
              A reference page, kept for the record.{" "}
              <span className="text-amber-800/70">No current version supersedes it.</span>{" "}
              <Link href="/dashboard?tab=board" className="font-semibold underline hover:text-amber-950">
                See the measurement board →
              </Link>
            </>
          )}
        </span>
        <Link
          href={"/library/" + sector.id}
          className="ml-auto shrink-0 rounded-full border border-amber-400/50 px-2.5 py-0.5 font-semibold text-amber-800 hover:bg-amber-100"
        >
          {sector.title} →
        </Link>
      </div>
    </div>
  );
}

// Re-export so callers can gate other chrome the same way without re-importing the data module.
export { isLibraried, PRIMARY_PATHS };
