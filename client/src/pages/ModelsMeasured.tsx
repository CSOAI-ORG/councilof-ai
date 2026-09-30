/**
 * /models-measured/ — every AI model we have measured on a frozen bank, and the rule that decides.
 *
 * The list behind the home page's model figure. Everything renders from
 * /interop/models-measured.json, which scripts/build-models-measured.mjs derives at build time
 * from the signed card index and the OIDC-signed mill cards (their Ed25519 signatures are checked
 * there). Every count on this page is an array length or a field of that file; none is typed.
 *
 * Our own models are listed in their own table and never counted in the headline figure: they are
 * prompt overlays on stock base models, and a measurement body does not quote itself.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

interface Row {
  id: string;
  kind: "third_party" | "own" | "own_unconfirmed" | string;
  cards: number;
  axes: number;
  sources: string[];
  admission_receipt?: boolean;
  recorded_as?: string[];
}
interface Doc {
  schema: string;
  what: string;
  headline: { third_party_models: number; own_models_excluded: number; own_unconfirmed: number; third_party_with_admission_receipt?: number };
  not_this: string[];
  identity_rule: string;
  own_model_rule: string;
  sources: {
    signed_card_index: { path: string; cards_read: number };
    mill_cards_signed: { path: string; files_read: number; cards_counted: number; rule: string };
  };
  inputs_sha256: string;
  models: Row[];
}

type Read = { kind: "loading" } | { kind: "ready"; doc: Doc } | { kind: "failed"; reason: string };

const SRC = "/interop/models-measured.json";
const nf = new Intl.NumberFormat("en-GB");

function Table({ rows, caption, testid }: { rows: Row[]; caption: string; testid: string }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-border" data-testid={testid}>
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-bold">Model</th>
            <th scope="col" className="px-4 py-3 text-right font-bold">Signed cards</th>
            <th scope="col" className="px-4 py-3 text-right font-bold">Axes</th>
            <th scope="col" className="px-4 py-3 font-bold">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <th scope="row" className="break-all px-4 py-2.5 font-mono text-[13px] font-semibold text-foreground">{r.id}</th>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">{nf.format(r.cards)}</td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">{nf.format(r.axes)}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                {r.sources.join(", ")}
                {r.admission_receipt ? " · admission receipt" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ModelsMeasured() {
  const [read, setRead] = useState<Read>({ kind: "loading" });

  useEffect(() => {
    document.title = "AI models measured on frozen banks — Council of AI";
    setMetaDescription(
      "Every AI model Council of AI has measured on a frozen, published question bank, derived from the signed cards. Our own models are listed separately and never counted in.",
    );
    let alive = true;
    fetch(SRC, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((doc: Doc) => {
        if (!alive) return;
        if (doc?.schema !== "csoai.models-measured/0.1" || !Array.isArray(doc.models)) throw new Error("unexpected schema");
        setRead({ kind: "ready", doc });
      })
      .catch((e) => alive && setRead({ kind: "failed", reason: String(e?.message ?? e) }));
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => {
    if (read.kind !== "ready") return null;
    const m = read.doc.models;
    return {
      third: m.filter((r) => r.kind === "third_party").sort((a, b) => a.id.localeCompare(b.id)),
      own: m.filter((r) => r.kind === "own").sort((a, b) => a.id.localeCompare(b.id)),
      unconfirmed: m.filter((r) => r.kind === "own_unconfirmed").sort((a, b) => a.id.localeCompare(b.id)),
    };
  }, [read]);

  return (
    <main className="surface-base section-y" data-testid="models-measured">
      <div className="section-shell">
        <p className="t-kicker text-emerald-800 dark:text-emerald-300">Models measured</p>
        <h1 className="t-band mt-3 max-w-3xl text-foreground">Every AI model we have measured on a frozen bank</h1>

        {read.kind === "loading" ? <div className="mt-8 min-h-[24rem]" aria-busy="true" aria-label="Loading the list" /> : null}
        {read.kind === "failed" ? (
          <p className="mt-8 max-w-3xl rounded-2xl border border-amber-500/50 bg-amber-50 px-5 py-4 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            The list is unread right now ({read.reason}). No count is shown in its place.{" "}
            <a href={SRC} className="font-bold underline">Open the file</a>.
          </p>
        ) : null}

        {read.kind === "ready" && groups ? (
          <>
            <p className="t-lede measure mt-5 text-muted-foreground">
              <strong className="font-black text-foreground" data-testid="models-measured-headline">
                {nf.format(groups.third.length)}
              </strong>{" "}
              third-party models carry at least one signed, quotable measurement (n of 30 or more) on a frozen, published
              question bank. Our own {nf.format(groups.own.length)} models are listed below them and never counted in.
            </p>
            <ul className="mt-6 max-w-3xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              {read.doc.not_this.map((t) => (
                <li key={t}>{t}</li>
              ))}
              <li>{read.doc.identity_rule}</li>
            </ul>

            <h2 className="mt-12 text-xl font-black tracking-tight text-foreground">
              Third-party models <span className="font-normal text-muted-foreground">({nf.format(groups.third.length)})</span>
            </h2>
            <Table rows={groups.third} caption="Third-party models measured on frozen banks" testid="models-third-party" />

            <h2 className="mt-12 text-xl font-black tracking-tight text-foreground">
              Our own models, never counted in <span className="font-normal text-muted-foreground">({nf.format(groups.own.length)})</span>
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Prompt overlays on stock base models, measured on the same banks and excluded before any comparison. Rule:{" "}
              {read.doc.own_model_rule}
            </p>
            <Table rows={groups.own} caption="Our own models, excluded from the count" testid="models-own" />

            {groups.unconfirmed.length > 0 ? (
              <>
                <h2 className="mt-12 text-xl font-black tracking-tight text-foreground">
                  Names that suggest a model we derived, unconfirmed <span className="font-normal text-muted-foreground">({nf.format(groups.unconfirmed.length)})</span>
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  No byte we hold says whose these are, so they are in neither count.
                </p>
                <Table rows={groups.unconfirmed} caption="Unconfirmed models, in neither count" testid="models-unconfirmed" />
              </>
            ) : null}

            <h2 className="mt-12 text-xl font-black tracking-tight text-foreground">Where this comes from</h2>
            <ul className="mt-3 max-w-3xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                The signed card index (<a className="font-mono underline" href={read.doc.sources.signed_card_index.path}>{read.doc.sources.signed_card_index.path}</a>):{" "}
                {nf.format(read.doc.sources.signed_card_index.cards_read)} cards read.
              </li>
              <li>
                The signed mill cards (<a className="font-mono underline" href={read.doc.sources.mill_cards_signed.path}>{read.doc.sources.mill_cards_signed.path}</a>):{" "}
                {nf.format(read.doc.sources.mill_cards_signed.files_read)} files read, {nf.format(read.doc.sources.mill_cards_signed.cards_counted)} counted. Rule:{" "}
                {read.doc.sources.mill_cards_signed.rule}.
              </li>
              <li>
                The whole derivation as JSON: <a className="font-mono underline" href={SRC}>{SRC}</a> (inputs sha256{" "}
                <span className="break-all font-mono">{read.doc.inputs_sha256.slice(0, 16)}…</span>).
              </li>
            </ul>
            <p className="mt-8 text-sm">
              <Link href="/board/models" className="font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
                Results by model and axis →
              </Link>
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
