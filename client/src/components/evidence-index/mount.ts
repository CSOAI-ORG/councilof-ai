/**
 * mountEvidenceIndex(host, options) — framework-free DOM for the GSPC evidence index.
 *
 * Used twice, from one source: the dashboard pane (EvidenceIndexPane.tsx, same-origin
 * reads) and the static Hugging Face Space build (spaces/gspc-board/evidence-index/,
 * cross-origin reads of https://councilof.ai with CORS). Renders into a shadow root so
 * neither host's CSS leaks in or out. Read-only: no writes, no signing, no paid calls.
 * All logic that decides a number lives in ./evidenceIndex.ts, where it is tested.
 */
import {
  COMPARE_LIMIT,
  DEFAULT_ORIGIN,
  STAGES,
  applyCoverageRead,
  exportRows,
  filteredRows,
  formatCount,
  readJSON,
  readView,
  reconcileSelection,
  relationshipRows,
  scopeHint,
  toggleCompare,
  viewURL,
  workerView,
  type CoverageReadState,
  type NormalizedRow,
  type View,
  type ViewState,
} from "./evidenceIndex";

export type MountOptions = {
  /** Stylesheet text injected into the shadow root (bundled from ./style.css). */
  cssText: string;
  /** Origin the two readers are fetched from. Dashboard: its own origin. Space: https://councilof.ai. */
  origin?: string;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
};

type ClientGuide = {
  name: string;
  text: string;
  url: string;
  config?: unknown;
};

const esc = (x: unknown) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
const title = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const date = (x: string | null | undefined) =>
  x
    ? `${new Date(x).toLocaleString("en-GB", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })} UTC`
    : "Not published";

/** Client guides point at the canonical public MCP endpoint, whichever origin hosts the view. */
export const CLIENT_GUIDES: ClientGuide[] = [
  {
    name: "ChatGPT",
    text: "Apps SDK / remote MCP. A working MCP endpoint is not an approved directory app. Test the app in Developer Mode before submission.",
    url: "https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk",
  },
  {
    name: "Claude",
    text: "Remote MCP connector; plugin packaging is a separate distribution route. Connect the existing server rather than creating a second backend.",
    url: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp",
  },
  {
    name: "Cursor",
    text: "Uses the existing HTTP MCP endpoint. Review tool permissions; this panel has not performed a fresh client installation.",
    url: "https://cursor.com/docs/mcp",
    config: { mcpServers: { csoai: { url: `${DEFAULT_ORIGIN}/mcp` } } },
  },
  {
    name: "VS Code / Copilot",
    text: "Workspace MCP configuration. Client policy and authorisation still apply; no extension-store availability is claimed.",
    url: "https://code.visualstudio.com/docs/agent-customization/mcp-servers",
    config: { servers: { csoai: { type: "http", url: `${DEFAULT_ORIGIN}/mcp` } } },
  },
  {
    name: "Gemini CLI",
    text: "Configure the existing remote endpoint, then inspect discovered tools. This does not establish a Gemini consumer-app integration.",
    url: "https://geminicli.com/docs/tools/mcp-server/",
    config: { mcpServers: { csoai: { httpUrl: `${DEFAULT_ORIGIN}/mcp` } } },
  },
  {
    name: "Hugging Face",
    text: "The board Space is a distribution surface onto the same evidence. Keep versioned datasets for releases; use mutable Buckets for working storage, not as the sole evidence authority.",
    url: "https://huggingface.co/spaces/csoai/gspc-board",
  },
];

type State = ViewState &
  CoverageReadState & {
    worker: unknown;
    workerError: string;
    workerObservedAt: string | null;
    workerMode: "not loaded" | "live read" | "retained, not live";
    loading: boolean;
    compare: string[];
    notice: string;
    clipboardText: string;
  };

export function mountEvidenceIndex(host: HTMLElement, options: MountOptions): () => void {
  if (!(host instanceof HTMLElement)) throw new Error("Evidence index needs a host element.");
  const origin = (options.origin || DEFAULT_ORIGIN).replace(/\/$/, "");
  const root = host.shadowRoot || host.attachShadow({ mode: "open" });
  const coverageURL = `${origin}/api/coverage`;
  const workerURL = `${origin}/api/worker`;
  const state: State = {
    ...readView(location.search),
    data: null,
    observedAt: null,
    mode: "not loaded",
    error: "",
    worker: null,
    workerError: "",
    workerObservedAt: null,
    workerMode: "not loaded",
    loading: false,
    compare: [],
    notice: "",
    clipboardText: "",
  };
  let disposed = false;
  let controller: AbortController | null = null;
  let renderedView: View | null = null;
  const style = `<style>${options.cssText}</style>`;

  const sync = (push = false) => {
    const u = viewURL(location.href, state);
    try {
      history[push ? "pushState" : "replaceState"](history.state, "", u);
    } catch {
      /* sandboxed frames may refuse history writes; the view still works */
    }
  };
  const visible = () => filteredRows(state.data?.rows || [], state.query, state.filter);
  const selection = () => state.data?.rows.find((r) => r.id === state.selected);
  const button = (label: string, action: string, cls = "") =>
    `<button type="button" data-action="${esc(action)}" class="${esc(cls)}">${label}</button>`;
  const links = (row: NormalizedRow) =>
    row.href
      ? `<a class="button" href="${esc(row.href)}" target="_blank" rel="noopener noreferrer">Open existing workspace ↗</a>`
      : "";

  function detail(row: NormalizedRow | undefined) {
    if (!row) return "";
    return `<section class="detail" aria-labelledby="ei-detail-title"><div class="headrow"><div><div class="eyebrow">Selected evidence family · ${esc(row.unit)}</div><h3 id="ei-detail-title">${esc(row.label)}</h3></div>${button("Close details", "close")}</div>
  <p>${esc(row.note || "No scope note was published.")}</p><div class="detailgrid">${STAGES.map((k) => {
    const c = row.cells[k];
    return `<div class="field"><strong>${title(k)} · reported value</strong><div class="big">${formatCount(c.value)}</div><p class="muted">${esc(c.reason)}</p><code>${esc(c.source || "Source not published")}<br>${esc(c.field || "Field not published")}</code></div>`;
  }).join("")}</div>
  <div class="actions" style="margin-top:16px">${links(row)}${button("Trace sources", "trace")}${button("Export this family", "export-one")}</div>
  <p class="muted">These are aggregate source declarations, not a verification result for any individual subject or card.</p></section>`;
  }

  function compareView() {
    const rows = (state.data?.rows || []).filter((r) => state.compare.includes(r.id));
    if (!rows.length) return "";
    return `<section class="comparison"><div class="toolbar"><h3>Pinned comparison (${rows.length}/${COMPARE_LIMIT})</h3>${button("Clear comparison", "clear-compare")}</div><p class="muted">Pinned items stay here when filters change. Values are displayed side by side, never added or ranked across units.</p><div class="detailgrid">${rows
      .map(
        (r) =>
          `<article class="field"><h4>${esc(r.label)}</h4><p class="muted">${esc(r.unit)}</p>${STAGES.map((k) => `<p>${title(k)}: <strong>${formatCount(r.cells[k].value)}</strong></p>`).join("")}</article>`,
      )
      .join("")}</div></section>`;
  }

  function indexView() {
    const data = state.data!;
    const rows = visible();
    const selected = selection();
    const table = rows.length
      ? `<div class="tablewrap" role="region" aria-label="Evidence-family coverage table; scroll horizontally on small screens" tabindex="0"><table><caption class="sr">Reported stage counts; source fields may count different objects. No combined total is meaningful.</caption><thead><tr><th scope="col">Evidence family</th>${STAGES.map((k) => `<th scope="col">${title(k)}</th>`).join("")}<th scope="col">Compare</th></tr></thead><tbody>${rows
          .map(
            (r) =>
              `<tr class="${r.id === state.selected ? "selected" : ""}"><td><button data-row="${esc(r.id)}" type="button" aria-expanded="${r.id === state.selected}" aria-label="Inspect ${esc(r.label)}">${esc(r.label)}</button><small>${esc(r.unit)} · ${esc(r.sourceState)}</small></td>${STAGES.map((k) => {
                const c = r.cells[k];
                const hint = scopeHint(r, k);
                return `<td class="num" title="${esc(`${c.field} — ${c.reason}`)}"><span class="${c.value === null ? "unknown" : ""}">${formatCount(c.value)}</span>${hint ? `<small>${hint}</small>` : ""}${c.value === null ? '<span class="sr"> Not published</span>' : ""}</td>`;
              }).join("")}<td><label class="check"><input class="compare-check" type="checkbox" data-compare="${esc(r.id)}" aria-label="Compare ${esc(r.label)}" ${state.compare.includes(r.id) ? "checked" : ""}></label></td></tr>`,
          )
          .join("")}</tbody></table></div>`
      : `<div class="empty"><h3>No matching evidence families</h3><p>Change your search or reset filters. The index has not reported a zero measurement.</p>${button("Reset filters", "reset")}</div>`;
    return `<div class="summary"><div><strong>${formatCount(data.rows.length)}</strong><small>Evidence families in this reader</small></div><div><strong>${data.complete ? "Complete" : "Partial"}</strong><small>Reader response, not universal coverage</small></div><div><strong>Separate</strong><small>Measurement · integrity · time · delivery</small></div></div>
   <div class="headrow"><div><h3>Explore evidence coverage</h3><p class="muted">Inspect what each source actually reports. Axes, assets, tools and settlements are not interchangeable.</p></div></div>
   <div class="filters"><label>Search this index<input id="ei-search" type="search" value="${esc(state.query)}" placeholder="Name, source, protocol or evidence type" maxlength="300"></label><label>Show<select id="ei-filter"><option value="all" ${state.filter === "all" ? "selected" : ""}>All evidence families</option><option value="gaps" ${state.filter === "gaps" ? "selected" : ""}>Has unpublished stages</option><option value="measured" ${state.filter === "measured" ? "selected" : ""}>Reports a measurement</option></select></label>${button("Reset", "reset")}${button("Export view", "export")}</div>
   <div class="toolbar"><span class="muted" id="ei-result-count">${rows.length} of ${data.rows.length} evidence families</span><span class="badge neutral">Read-only · no inference spend</span></div>${table}
   <p class="legend">— = no count published. 0 = an explicit source-reported zero. “Signed” is not “safe”; “paid” is not “delivered”. Shared-ledger payment values must not be added together. Select a family to see each cell’s source and exact field.</p>
   ${compareView()}${selected ? detail(selected) : '<p class="muted">Select a family to inspect its scope, source fields and existing product route.</p>'}`;
  }

  function relationshipsView() {
    const data = state.data!;
    const row = selection() || data.rows[0];
    if (!row) return emptyBody();
    const edges = relationshipRows(row);
    return `<div class="eyebrow">Source ontology · declared relations</div><h3>Trace each value to its source</h3><p class="network-desc muted">This view maps an evidence family to the exact source fields that report it. It does not invent subject-level provenance, root membership, partnerships or causal relationships.</p>
  <div class="filters"><label>Evidence family<select id="ei-graph-family">${data.rows.map((r) => `<option value="${esc(r.id)}" ${r.id === row.id ? "selected" : ""}>${esc(r.label)}</option>`).join("")}</select></label>${button("Export source relationships", "export-graph")}</div>
  <div class="relationships" role="list" aria-label="Declared source relationships"><article class="node" role="listitem"><div class="eyebrow">Evidence family</div><h3>${esc(row.label)}</h3><p>${esc(row.unit)}</p><p class="muted">${esc(row.id)}</p></article><div class="edges">${edges.map((e) => `<article class="edge" role="listitem"><div class="label">${esc(e.relation)} → ${formatCount(e.value)}</div><code>${esc(e.to)}</code><code class="muted">${esc(e.field)}</code></article>`).join("")}</div></div>
  <details><summary>Read the relationships as a table</summary><div class="tablewrap" tabindex="0"><table><thead><tr><th>From</th><th>Relation</th><th>To / field</th></tr></thead><tbody>${edges.map((e) => `<tr><td>${esc(e.from)}</td><td>${esc(e.relation)}</td><td>${esc(e.to)}<br>${esc(e.field)}</td></tr>`).join("")}</tbody></table></div></details><p class="legend">Schema proposal for deeper graph work: subject → version → method → observation → admitted card → scoped commitment → witness → publication. Only add an edge when a record establishes it.</p>`;
  }

  function computeView() {
    let w: ReturnType<typeof workerView> | null = null;
    try {
      if (state.worker) w = workerView(state.worker, Date.now());
    } catch {
      w = null;
    }
    const retained = state.workerMode === "retained, not live";
    return `<div class="eyebrow">Compute is not publication</div><h3>Know which part is working</h3><p class="network-desc muted">RunPod executes jobs. The evidence pipeline admits and publishes results. Hugging Face provides public repositories and interfaces; a Bucket is working storage.</p>
  <p class="time">Worker observation: ${date(state.workerObservedAt)} · ${esc(state.workerMode)}</p>
  ${state.workerError ? `<div class="callout" role="alert">Worker source unavailable: ${esc(state.workerError)}. ${w ? "The previous observation is retained, not live." : "No worker values substituted."}</div>` : ""}
  <div class="compute"><article><h4>RunPod endpoint</h4><div class="big">${esc(w?.endpoint || "UNKNOWN")}</div><p>Worker state: <strong>${esc(w?.state || "UNKNOWN")}</strong></p><p class="muted">${esc(w?.reason || "No response loaded")}</p><p class="time">Heartbeat: ${date(w?.heartbeat)}</p></article>
  <article><h4>Last successful execution</h4><p class="time">${date(w?.lastSuccess)}</p><div class="big">${!w || w.minutesSinceSuccess === null ? "—" : `${w.minutesSinceSuccess} min`}</div><p class="muted">Age at view time${retained ? " (from a retained, not-live observation)" : ""}, not a published-result count.</p></article>
  <article><h4>This worker process</h4><p>${formatCount(w?.successes)} successful runs · ${formatCount(w?.failures)} failed runs</p><p>${formatCount(w?.jobs)} playlist jobs</p><p class="muted">${esc(w?.scope || "No process counters available.")}</p></article>
  <article><h4>Admission and delivery</h4><p class="big">Not established here</p><p class="muted">A successful execution does not establish a signed, rooted, witnessed or delivered result. Follow the existing card and request readers.</p><a href="${DEFAULT_ORIGIN}/dashboard?tab=cards" target="_blank" rel="noopener noreferrer">Open published cards ↗</a></article></div>
  <div class="callout">A responsive endpoint with a waiting worker is not evidence of continuing throughput. Diagnose the published wait reason; do not automatically restart, increase spend or bypass admission gates.</div>
  <details><summary>Storage and hosting responsibilities</summary><div class="detailgrid"><div class="field"><strong>Hugging Face datasets</strong>Versioned public releases, banks and evidence mirrors.</div><div class="field"><strong>Hugging Face Spaces</strong>Interfaces onto the same evidence; not independent scoreboards.</div><div class="field"><strong>Hugging Face Buckets</strong>Mutable checkpoints, logs and staging. Bucket inventory, permissions and backups are not verified by this view.</div><div class="field"><strong>RunPod</strong>Bounded compute with separately governed intake, signing and publication.</div></div></details>`;
  }

  function connectView() {
    return `<div class="eyebrow">One backend · client-specific packaging</div><h3>Connect the existing evidence service</h3><p class="network-desc muted">Endpoint, compatible configuration, successful client test and marketplace approval are separate states. These guides are not proof that CSOAI is installed or approved on every platform.</p><div class="callout">No client installs, permission grants, paid calls or store submissions are executed by this panel. Review discovered tools before enabling them.</div><div class="connectgrid">${CLIENT_GUIDES.map(
      (c, i) =>
        `<article><div class="toolbar"><h4>${esc(c.name)}</h4><span class="badge neutral">Client test pending</span></div><p>${esc(c.text)}</p><a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Official setup reference ↗</a>${c.config ? `<details><summary>Configuration example</summary><pre>${esc(JSON.stringify(c.config, null, 2))}</pre>${button("Copy configuration", `copy-config-${i}`)}</details>` : ""}</article>`,
    ).join("")}</div><details><summary>App and extension release identity</summary><p>Keep exact package ID, version, owner, backend URL, transport, supported tasks, privacy/permissions, test receipt and store URL in the existing capability register. A legacy MEOK extension must not silently be relabelled as a CSOAI product.</p></details>`;
  }

  function emptyBody() {
    return `<div class="empty"><h3>${state.loading ? "Loading evidence sources…" : "Evidence source unavailable"}</h3><p>${esc(state.error || "No response has been loaded. No measurements are invented.")}</p>${state.loading ? "" : button("Retry sources", "refresh", "primary")}</div>`;
  }

  function statusLine() {
    if (state.error && state.data) {
      return `<strong>Refresh failed — retained data is not live.</strong> ${esc(state.error)}`;
    }
    if (state.error) return `<strong>Source unavailable.</strong> ${esc(state.error)}`;
    if (state.loading) return "Reading sources…";
    if (state.mode === "live read") return `<strong>Live read</strong> · ${date(state.observedAt)}`;
    return "Not loaded";
  }

  function render(restoreSearch = false) {
    if (disposed) return;
    const active = root.activeElement as (HTMLElement & { selectionStart?: number | null }) | null;
    const focusSearch = restoreSearch && active?.id === "ei-search";
    const start = active?.selectionStart ?? null;
    const focusSelector = active?.id
      ? `#${CSS.escape(active.id)}`
      : active?.dataset?.compare
        ? `[data-compare="${CSS.escape(active.dataset.compare)}"]`
        : active?.dataset?.action
          ? `[data-action="${CSS.escape(active.dataset.action)}"]`
          : null;
    const opened =
      renderedView === state.view
        ? [...root.querySelectorAll("details")]
            .map((el, index) => (el.open ? index : -1))
            .filter((index) => index >= 0)
        : [];
    renderedView = state.view;
    const body =
      state.view === "connect"
        ? connectView()
        : state.view === "compute"
          ? computeView()
          : state.data
            ? state.view === "relationships"
              ? relationshipsView()
              : indexView()
            : emptyBody();
    root.innerHTML = `${style}<section class="ei" aria-label="GSPC evidence index"><div class="header"><div class="headrow"><div><div class="eyebrow">Council of AI / GSPC</div><h2>Evidence index</h2><p class="muted">One index over the estate's published readers: coverage, source relationships, compute and client connections. Measurement, not certification.</p></div><div class="actions">${button(state.loading ? "Refreshing…" : "Refresh sources", "refresh", "primary")}${button("Copy view link", "share")}</div></div></div>
  <div class="status ${state.error ? "error" : ""}" data-testid="ei-status"><span>${statusLine()}</span><span>No signatures verified by this view</span></div>
  <nav class="tabs" aria-label="Evidence views">${(
    [
      ["index", "Evidence index"],
      ["relationships", "Source graph"],
      ["compute", "Compute & storage"],
      ["connect", "Connect apps"],
    ] as const
  )
    .map(([id, label]) => `<button type="button" data-view="${id}" aria-pressed="${state.view === id}">${label}</button>`)
    .join("")}</nav>
  <div class="body">${body}</div>
  ${state.clipboardText ? `<div class="body"><label for="ei-copy-fallback">Clipboard unavailable — select and copy this text</label><textarea id="ei-copy-fallback" readonly rows="5" style="display:block;width:100%;margin-top:8px">${esc(state.clipboardText)}</textarea></div>` : ""}<div class="footer"><span>Public evidence first. No pay-to-pass. No invented zeroes.</span><a href="${DEFAULT_ORIGIN}/gspc-verify" target="_blank" rel="noopener noreferrer">Open existing verifier ↗</a><a href="${esc(coverageURL)}" target="_blank" rel="noopener noreferrer">Coverage JSON ↗</a></div><div id="ei-announcement" class="sr" role="status" aria-live="polite">${esc(state.notice)}</div></section>`;
    const refreshButton = root.querySelector<HTMLButtonElement>("[data-action=refresh]");
    if (refreshButton) refreshButton.disabled = state.loading;
    const details = root.querySelectorAll("details");
    for (const index of opened) if (details[index]) details[index].open = true;
    if (!focusSearch && focusSelector) root.querySelector<HTMLElement>(focusSelector)?.focus();
    if (focusSearch) {
      const el = root.querySelector<HTMLInputElement>("#ei-search");
      el?.focus();
      try {
        if (start !== null) el?.setSelectionRange(start, start);
      } catch {
        /* type=search may not support selection ranges */
      }
    }
  }

  function updateSelection() {
    const before = state.selected;
    state.selected = reconcileSelection(before, visible());
    if (before && !state.selected) state.notice = "Selection cleared because it is outside the current filter.";
  }

  function download(value: unknown, name: string) {
    const b = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    state.notice = "Exported unsigned derived data; no signature or measurement was created.";
    render();
  }

  async function copy(text: string) {
    state.clipboardText = "";
    try {
      await navigator.clipboard.writeText(text);
      state.notice = "Copied.";
    } catch {
      state.clipboardText = text;
      state.notice = "Clipboard is unavailable. Select and copy the text below.";
    }
    render();
    if (state.clipboardText) {
      const el = root.querySelector<HTMLTextAreaElement>("#ei-copy-fallback");
      el?.focus();
      el?.select();
    }
  }

  async function refresh() {
    if (state.loading || disposed) return;
    controller?.abort();
    controller = new AbortController();
    state.loading = true;
    render();
    const signal = controller.signal;
    const now = () => new Date().toISOString();
    const [c, w] = await Promise.allSettled([
      readJSON(coverageURL, { signal, fetchImpl: options.fetchImpl }),
      readJSON(workerURL, { signal, fetchImpl: options.fetchImpl }),
    ]);
    if (disposed || signal.aborted) return;
    const next = applyCoverageRead(
      state,
      c.status === "fulfilled"
        ? { ok: true, body: c.value }
        : { ok: false, error: (c.reason as Error)?.message || "Coverage request failed." },
      now(),
      origin,
    );
    Object.assign(state, next);
    if (state.data) {
      updateSelection();
      const ids = new Set(state.data.rows.map((r) => r.id));
      state.compare = state.compare.filter((id) => ids.has(id));
    }
    if (w.status === "fulfilled") {
      try {
        workerView(w.value);
        state.worker = w.value;
        state.workerObservedAt = now();
        state.workerMode = "live read";
        state.workerError = "";
      } catch (e) {
        state.workerError = (e as Error).message;
        state.workerMode = state.worker ? "retained, not live" : "not loaded";
      }
    } else {
      state.workerError = (w.reason as Error)?.message || "Worker request failed.";
      state.workerMode = state.worker ? "retained, not live" : "not loaded";
    }
    state.loading = false;
    render();
  }

  function click(e: Event) {
    const el = (e.target as HTMLElement | null)?.closest("button");
    if (!el) return;
    if (el.dataset.view) {
      state.view = el.dataset.view as View;
      if (state.view === "index") updateSelection();
      sync(true);
      render();
      root.querySelector<HTMLElement>(`[data-view="${state.view}"]`)?.focus();
      return;
    }
    if (el.dataset.row) {
      const id = el.dataset.row;
      state.selected = state.selected === id ? null : id;
      sync();
      render();
      root.querySelector<HTMLElement>(`[data-row="${CSS.escape(id)}"]`)?.focus();
      return;
    }
    const action = el.dataset.action;
    if (action === "refresh") void refresh();
    if (action === "reset") {
      state.query = "";
      state.filter = "all";
      updateSelection();
      sync();
      render();
      root.querySelector<HTMLElement>("#ei-search")?.focus();
    }
    if (action === "close") {
      const id = state.selected;
      state.selected = null;
      sync();
      render();
      if (id) root.querySelector<HTMLElement>(`[data-row="${CSS.escape(id)}"]`)?.focus();
    }
    if (action === "trace") {
      state.view = "relationships";
      sync(true);
      render();
    }
    if (action === "share") void copy(viewURL(location.href, state));
    if (action === "clear-compare") {
      state.compare = [];
      render();
    }
    if (action === "export") download(exportRows(visible(), state.observedAt, origin), "csoai-coverage-view.json");
    const sel = selection();
    if (action === "export-one" && sel) {
      download(exportRows([sel], state.observedAt, origin), `csoai-family-${sel.id}.json`);
    }
    if (action === "export-graph") {
      const r = sel || state.data?.rows[0];
      if (r) {
        download(
          {
            schema: "csoai.source-relationships/0.1",
            kind: "UNSIGNED_DERIVED_VIEW",
            observed_at: state.observedAt,
            edges: relationshipRows(r),
          },
          "csoai-source-relationships.json",
        );
      }
    }
    if (action?.startsWith("copy-config-")) {
      const guide = CLIENT_GUIDES[Number(action.split("-").at(-1))];
      if (guide?.config) void copy(JSON.stringify(guide.config, null, 2));
    }
  }

  function change(e: Event) {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (el.id === "ei-filter") {
      state.filter = el.value as State["filter"];
      updateSelection();
      sync();
      render();
    }
    if (el.id === "ei-graph-family") {
      state.selected = el.value;
      sync();
      render();
    }
    const compareId = (el as HTMLInputElement).dataset?.compare;
    if (compareId) {
      const result = toggleCompare(state.compare, compareId, (el as HTMLInputElement).checked);
      state.compare = result.compare;
      if (result.refused) {
        state.notice = `Compare up to ${COMPARE_LIMIT} families. Remove a pinned family first.`;
      }
      render();
    }
  }

  function input(e: Event) {
    const el = e.target as HTMLInputElement;
    if (el.id === "ei-search") {
      state.query = el.value;
      updateSelection();
      sync();
      render(true);
    }
  }

  function pop() {
    Object.assign(state, readView(location.search));
    updateSelection();
    render();
  }

  root.addEventListener("click", click);
  root.addEventListener("change", change);
  root.addEventListener("input", input);
  window.addEventListener("popstate", pop);
  void refresh();

  return () => {
    disposed = true;
    controller?.abort();
    root.removeEventListener("click", click);
    root.removeEventListener("change", change);
    root.removeEventListener("input", input);
    window.removeEventListener("popstate", pop);
    root.innerHTML = "";
  };
}
