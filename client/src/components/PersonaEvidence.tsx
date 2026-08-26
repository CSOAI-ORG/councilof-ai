/**
 * PersonaEvidence — the checkable half of a /for/:persona page.
 *
 * WHY THIS EXISTS. A persona-audit of /for/* found that not one line on a
 * measurement company's audience pages named an axis, an n, or a card. The pages
 * asserted; nothing on them could be checked. This component is the correction:
 * each persona declares the board axes that actually speak to it, and this
 * renders those rows LIVE off GET /api/gspc.
 *
 * NOTHING HERE TYPES A NUMBER. The axis SLUGS below are pointers — identifiers
 * into the board, not counts — and every figure beside them (n, status, leader
 * accuracy, separation, and the board's own count sentence) is read out of the
 * payload. If the board cannot be read, the component says so in words and
 * still names the axes, so a reader always has something to go check. A
 * placeholder figure would be worse than an absent one.
 *
 * WHAT AN AXIS IS, AND IS NOT. These axes measure MODEL behaviour against a
 * frozen, published bank on a date. They are not an assessment of the reader's
 * organisation, and no row here is a conformity opinion. The copy says so
 * because a reader who mistakes one for the other has been misled by us.
 */
import { useGspcBoard, countLine, type GspcAxis } from "./board/useGspcBoard";

/** Read-only view of the fields this strip renders. All optional — see the header note. */
type Row = {
  slug: string;
  /** Why this axis is on this persona's page. Ours to write; not a claim about the data. */
  why: string;
  axis: GspcAxis | null;
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function StatusChip({ status }: { status?: string }) {
  const s = (status || "").toUpperCase();
  const measured = s === "MEASURED";
  return (
    <span
      className={
        "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider " +
        (measured
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-200 text-gray-700")
      }
    >
      {s || "not read"}
    </span>
  );
}

function AxisRow({ row }: { row: Row }) {
  const a = row.axis;
  const nUnit = typeof a?.n_unit === "string" ? (a.n_unit as string) : "bank items";
  return (
    <li className="rounded-2xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/gspc/${row.slug}`}
          className="font-mono text-sm font-bold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900"
        >
          {row.slug}
        </a>
        <StatusChip status={a?.status} />
        {a?.bench && (
          <span className="font-mono text-[11px] text-gray-500">{a.bench}</span>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-700">{row.why}</p>

      {a ? (
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {a.task && (
            <div className="sm:col-span-2">
              <dt className="inline font-semibold text-gray-900">What is graded: </dt>
              <dd className="inline text-gray-600">{a.task}</dd>
            </div>
          )}
          {typeof a.n === "number" && (
            <div>
              <dt className="inline font-semibold text-gray-900">n: </dt>
              <dd className="inline text-gray-600">
                {a.n} {nUnit}
              </dd>
            </div>
          )}
          {typeof a.accuracy === "number" && (
            <div>
              <dt className="inline font-semibold text-gray-900">Leader: </dt>
              <dd className="inline text-gray-600">
                {pct(a.accuracy)}
                {a.leader ? ` (${a.leader})` : ""}
              </dd>
            </div>
          )}
          {a.separation && (
            <div className="sm:col-span-2">
              <dt className="inline font-semibold text-gray-900">Separation: </dt>
              <dd className="inline text-gray-600">
                {a.separation}
                {a.separation === "TIE"
                  ? " — the leader's lead is not statistically separated, and a tie is never counted as a win."
                  : ""}
              </dd>
            </div>
          )}
          {a.dataset && (
            <div className="sm:col-span-2">
              <dt className="inline font-semibold text-gray-900">Frozen bank: </dt>
              <dd className="inline">
                <a
                  className="text-emerald-700 underline hover:text-emerald-900"
                  href={
                    typeof a.dataset_url === "string"
                      ? (a.dataset_url as string)
                      : `https://huggingface.co/datasets/${a.dataset}`
                  }
                  rel="noopener"
                >
                  {a.dataset}
                </a>
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-gray-500">
          The board did not answer on this render, so no figure is shown for this axis here.
          Read the row itself at{" "}
          <a className="text-emerald-700 underline" href={`/gspc/${row.slug}`}>
            /gspc/{row.slug}
          </a>
          .
        </p>
      )}
    </li>
  );
}

export default function PersonaEvidence({
  axes,
  lead,
}: {
  /** Board axis slugs, with the reason each is on this page. */
  axes: { slug: string; why: string }[];
  /** One sentence saying what these axes have to do with this audience. */
  lead: string;
}) {
  const { data, error, loading } = useGspcBoard();
  const board = Array.isArray(data?.axes) ? (data!.axes as GspcAxis[]) : [];
  const rows: Row[] = axes.map((a) => ({
    ...a,
    axis: board.find((b) => b.axis === a.slug) ?? null,
  }));
  const count = countLine(data);

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-xl font-bold text-gray-900">What you can check on the board</h2>
      <p className="mt-2 max-w-3xl text-sm text-gray-600">{lead}</p>
      <p className="mt-2 max-w-3xl text-sm text-gray-600">
        Every figure below is read live from{" "}
        <a className="text-emerald-700 underline" href="/api/gspc">
          GET /api/gspc
        </a>{" "}
        when this page loads — no count is typed into it. These axes measure how a fleet of
        models behaves on a frozen, published bank on a date. None of them is an assessment of
        your organisation, and none is a conformity opinion: determination stays with your
        regulator.
      </p>

      {count && (
        <p className="mt-2 font-mono text-xs text-gray-500">
          Board right now: {count}
          {loading ? " (loading)" : ""} — a published slot is not a measurement, which is why
          both numbers travel together.
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-amber-700">
          The board could not be read on this render ({error}). The axes are still named below
          so you can open each row yourself; no figure has been substituted.
        </p>
      )}

      <ul className="mt-5 grid gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <AxisRow key={r.slug} row={r} />
        ))}
      </ul>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
        <h3 className="text-sm font-bold text-emerald-900">Re-check it without us</h3>
        <p className="mt-1 text-sm text-emerald-900/80">
          Each published measurement card is Ed25519-signed over its exact bytes, and its id is
          the sha256 of those bytes. Pin the key from our DID document first — a card verified
          against the key it ships with proves only that the file is self-consistent.
        </p>
        <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          <li>
            <a className="text-emerald-800 underline" href="/signed/HOW-TO-VERIFY.md">
              /signed/HOW-TO-VERIFY.md
            </a>{" "}
            <span className="text-emerald-900/70">— the four commands, start here</span>
          </li>
          <li>
            <a className="text-emerald-800 underline" href="/signed/card_index.json">
              /signed/card_index.json
            </a>{" "}
            <span className="text-emerald-900/70">— the signed index of published cards</span>
          </li>
          <li>
            <a className="text-emerald-800 underline" href="/.well-known/did.json">
              /.well-known/did.json
            </a>{" "}
            <span className="text-emerald-900/70">— the key to pin against</span>
          </li>
          <li>
            <a className="text-emerald-800 underline" href="/gspc-verify">
              /gspc-verify
            </a>{" "}
            <span className="text-emerald-900/70">
              — recompute the replay chain in your browser, no account
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
