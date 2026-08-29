import { useMemo, useState } from "react";
import { FOCUS, MEASURE, PRIMARY, SP, TYPE } from "./glass";
import { CopyBlock, PaneHead, WireNotice } from "./paneKit";
import { quotableWire, stateWord, useBoardWire, useSignalCards } from "./boardWire";
import { badgeSnippet, cardSnippet, CARD_EMBED_HEIGHT, CARD_EMBED_WIDTH } from "@/lib/embedSnippet";

/**
 * LobbyEmbedPane — the white-label embed kit, NATIVE in Council OS.
 *
 * WHY THIS IS A PANE AND NOT A FRAMED PAGE. /embed shows two snippets with
 * `governance` and one card path hard-coded into them. A reader who wants a
 * different axis has to hand-edit a URL and hope the axis exists. This pane reads
 * the live board and the published card index, so the reader PICKS from what is
 * actually there, sees the real badge that will render, reads the axis's true
 * state beside it, and copies a snippet that already carries their choice.
 *
 * EVERY PREVIEW HERE IS THE REAL ARTEFACT, NOT A MOCK-UP.
 *   · The badge is <img src="/api/badge?axis=…"> — the same endpoint the snippet
 *     ships, rendered same-origin. If the board says "unmeasured", the preview
 *     says "unmeasured"; there is no styled placeholder to mistake for a score.
 *   · The card widget is the real /embed/verify.html iframe doing real Ed25519
 *     verification in this browser. A tampered card shows red here exactly as it
 *     would on the embedder's site.
 *
 * WHAT IS NEVER CONSTRUCTED. Card paths come from GET /signals/_index.json, never
 * derived from an axis name: the axes are `governance`/`provenance` while the
 * cards are `gov`/`prv`, so a constructed path 404s. Only cards the index actually
 * publishes are offered.
 *
 * DOCTRINE. A badge is a measurement, not a conformity mark, and the embedder
 * cannot alter the signed verdict — an edit to the card's bytes breaks the
 * signature and the widget shows it. Verification is free forever.
 */

const ORIGIN = "https://councilof.ai";

type Widget = "badge" | "card";

export default function LobbyEmbedPane({
  onOpenRoute,
}: {
  onOpenRoute: (path: string, label: string) => void;
}) {
  const wire = useBoardWire();
  const cards = useSignalCards();
  const [widget, setWidget] = useState<Widget>("badge");
  /** "" means the overall board badge (no ?axis) — a real, distinct option. */
  const [axis, setAxis] = useState<string>("");
  const [cardPath, setCardPath] = useState<string>("");

  // A LIST of axes, not the selected one. The axes->axis display sweep renamed this
  // identifier into a collision with the `axis` state above, and line 2 still reads
  // `axes`. Identifiers are not display text.
  const axes = wire.phase === "ready" ? wire.board.axes : [];
  const chosen = axes.find((a) => a.axis === axis) ?? null;

  const badgeSrc = axis ? `/api/badge?axis=${encodeURIComponent(axis)}` : "/api/badge";
  const badgeAlt = axis
    ? `${axis} — measured by Council of AI`
    : "Council of AI — the board's own measured count";

  const badgePaste = useMemo(() => badgeSnippet(axis, ORIGIN), [axis]);
  const cardPaste = useMemo(() => (cardPath ? cardSnippet(cardPath, ORIGIN) : ""), [cardPath]);

  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <PaneHead eyebrow="Embed kit" title="Build the embed, from what is actually on the board">
        Pick a live axis or a published signed card. The preview below is the real endpoint, not a
        mock-up — what you see here is what a visitor to your site sees. This is measurement and
        attestation, never a certification or a conformity mark, and verification is free forever.
        The snippet hashes the same card-v1 bytes. No extra kinds.
      </PaneHead>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Which embed">
        {(["badge", "card"] as Widget[]).map((w) => (
          <button
            key={w}
            type="button"
            aria-pressed={widget === w}
            onClick={() => setWidget(w)}
            className={
              `rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition motion-reduce:transition-none ${FOCUS} ` +
              (widget === w
                ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-700/30"
                : "border border-slate-900/12 bg-white text-slate-700 hover:bg-slate-900/5")
            }
          >
            {w === "badge" ? "Live status badge" : "Self-verifying card"}
          </button>
        ))}
      </div>

      {widget === "badge" ? (
        wire.phase !== "ready" ? (
          <WireNotice phase={wire.phase} error={wire.phase === "failed" ? wire.error : undefined} />
        ) : (
          <section className="mt-6">
            <label htmlFor="coai-embed-axis" className="block">
              <span className="block text-[12.5px] font-semibold text-slate-900">Axis</span>
              <span className={`mt-0.5 block ${TYPE.fine}`}>
                Read from the live board — {wire.board.publicCount || "counts from GET /api/gspc"}.
              </span>
              <select
                id="coai-embed-axis"
                value={axis}
                onChange={(e) => setAxis(e.target.value)}
                className={`mt-1.5 w-full max-w-md rounded-xl border border-slate-900/15 bg-white px-3 py-2 text-[13px] text-slate-900 ${FOCUS}`}
              >
                <option value="">The whole board (no ?axis)</option>
                {wire.board.axes.map((a) => (
                  <option key={a.axis} value={a.axis}>
                    {a.axis} — {stateWord(a)}
                    {a.n > 0 ? ` · n=${a.n}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 rounded-2xl border border-slate-900/10 bg-white/90 p-5">
              <p className={TYPE.section}>Live preview — the real endpoint</p>
              <div className="mt-3">
                <img src={badgeSrc} alt={badgeAlt} height={20} />
              </div>
              <p className={`mt-3 ${MEASURE} ${TYPE.muted}`}>
                {chosen ? (
                  <>
                    <strong className="font-semibold text-slate-900">{chosen.axis}</strong> is{" "}
                    {stateWord(chosen)} on today's board
                    {chosen.n > 0 ? ` over n=${chosen.n}` : ""}
                    {quotableWire(chosen) ? (
                      <>
                        {" "}
                        — the leader is{" "}
                        <span className="font-mono text-[11.5px]">{chosen.leader ?? "not published"}</span>
                        {chosen.separation === "TIE"
                          ? ". A tie means the point-estimate lead is not a measured advantage; the badge says so."
                          : "."}
                      </>
                    ) : (
                      ". No score is published for it, so the badge carries none."
                    )}
                  </>
                ) : (
                  "The overall badge states the board's own derived count — never a typed slot number."
                )}
              </p>
              <CopyBlock text={badgePaste} label="copy-paste · HTML" />
            </div>
          </section>
        )
      ) : (
        <section className="mt-6">
          {cards.phase === "loading" && (
            <p className={`rounded-xl border border-slate-900/10 bg-white/80 px-4 py-3 ${TYPE.muted}`}>
              Reading <code className="font-mono text-[11px]">/signals/_index.json</code>…
            </p>
          )}
          {cards.phase === "failed" && (
            <div className="rounded-xl border border-amber-600/35 bg-amber-50 px-4 py-3.5">
              <p className="text-[13px] font-semibold text-amber-900">
                The published card index did not answer.
              </p>
              <p className={`mt-1.5 ${MEASURE} text-[12px] leading-relaxed text-amber-900/90`}>
                Card paths are never derived from an axis name — the axis are{" "}
                <code className="font-mono text-[11px]">governance</code> while the cards are{" "}
                <code className="font-mono text-[11px]">gov</code>, so a constructed path 404s. Until
                the index answers, no card is offered.
              </p>
              <p className="mt-2 font-mono text-[11px] text-amber-900/80">{cards.error}</p>
            </div>
          )}
          {cards.phase === "ready" && (
            <>
              <label htmlFor="coai-embed-card" className="block">
                <span className="block text-[12.5px] font-semibold text-slate-900">Signed card</span>
                <span className={`mt-0.5 block ${TYPE.fine}`}>
                  {cards.cards.length} card{cards.cards.length === 1 ? "" : "s"} published under{" "}
                  <code className="font-mono text-[11px]">/signals</code>. Only these are offered.
                </span>
                <select
                  id="coai-embed-card"
                  value={cardPath}
                  onChange={(e) => setCardPath(e.target.value)}
                  className={`mt-1.5 w-full max-w-md rounded-xl border border-slate-900/15 bg-white px-3 py-2 text-[13px] text-slate-900 ${FOCUS}`}
                >
                  <option value="">Choose a card…</option>
                  {cards.cards.map((c) => (
                    <option key={c.path} value={c.path}>
                      {c.slug} — {c.status}
                      {c.contentId ? ` · ${c.contentId}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-5 rounded-2xl border border-slate-900/10 bg-white/90 p-5">
                <p className={TYPE.section}>Live widget — real Ed25519, in this browser</p>
                {cardPath ? (
                  <>
                    <iframe
                      key={cardPath}
                      src={`/embed/verify.html?card=${cardPath}`}
                      width={CARD_EMBED_WIDTH}
                      height={CARD_EMBED_HEIGHT}
                      loading="lazy"
                      style={{ border: 0, maxWidth: "100%" }}
                      title="Verify a signed measurement card"
                      className="mt-3 rounded-xl"
                    />
                    <CopyBlock text={cardPaste} label="copy-paste · HTML" />
                  </>
                ) : (
                  <p className={`mt-2 ${MEASURE} ${TYPE.body}`}>
                    Choose a card above and the real widget loads here, verifying it in this browser
                    before you ship the snippet.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <div className="mt-8 rounded-2xl border border-slate-900/10 bg-white/85 p-5">
        <h3 className="text-[15px] font-semibold text-slate-900">
          Why a visitor can trust it without trusting the embedder
        </h3>
        <ol className={`mt-3 list-decimal space-y-2 pl-5 ${MEASURE} ${TYPE.body}`}>
          <li>
            The card commits to its own bytes: <code className="font-mono text-[11.5px]">content_id</code>{" "}
            is the SHA-256 of its canonical form, recomputed locally. Any edit changes the hash.
          </li>
          <li>
            That hash is signed with Ed25519 and checked against the published signer at{" "}
            <code className="font-mono text-[11.5px]">/.well-known/did.json</code>.
          </li>
          <li>
            None of it contacts us. That is what self-verifying means — and it is free for everyone,
            forever.
          </li>
        </ol>
        {/* ONE door, not two. /white-label renders the very same component as
            /embed, so a second button labelled "white-label terms" would promise
            a page that does not exist and land on this one. */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onOpenRoute("/embed", "Embed / white-label")}
            className={`${PRIMARY} px-3.5 py-2 text-[12.5px]`}
          >
            The full embed guide
          </button>
          <button
            type="button"
            onClick={() => onOpenRoute("/gspc-verify", "Verify a card")}
            className={`rounded-xl border border-slate-900/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
          >
            Verify a card yourself
          </button>
        </div>
      </div>
    </div>
  );
}
