/**
 * The GSPC console, inside Council OS.
 *
 * This pane deliberately renders the SAME page that councilof.ai serves at
 * /gspc-console (27 Sep 2026: a React page in the site shell; `embed=1` drops the
 * chrome here). The csoai/gspc-board HF Space keeps its own copy of the retired
 * static file. Before this, the website board, the Council OS board and
 * the HF board were three different renderers over three different snapshots,
 * so they disagreed with each other and with /api/gspc.
 *
 * It is an iframe on purpose. A second React copy of the table would be a fourth
 * renderer and would drift the same way. The console fetches /api/gspc and
 * /api/findings itself, so there is exactly one data path.
 */
export default function DashboardConsolePane() {
  return (
    <div className="flex h-full min-h-[70vh] flex-col">
      <iframe
        src="/gspc-console/?embed=1"
        title="GSPC console — every published score in the current findings index"
        className="h-full min-h-[70vh] w-full flex-1 rounded-lg border border-emerald-900/20"
        loading="lazy"
      />
    </div>
  );
}
