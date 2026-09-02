import { useCallback, useState } from "react";
import { FOCUS, MEASURE, PRIMARY, TYPE } from "./glass";
import { CopyBlock, Field, PaneHead } from "./paneKit";

/**
 * LobbyArt50Pane — Article 50 marking evidence, NATIVE in Council OS.
 *
 * THE ONE QUESTION. Does a generative output carry a machine-readable mark that a named method
 * can DETECT, right now? The Function at /api/art50/marking-evidence answers by bytes: it
 * locates and recomputes a C2PA manifest (assertion hashes, hard binding, claim signature),
 * reads the IPTC DigitalSourceType, and declares every watermark UNCHECKABLE with the reason.
 * This pane is the door: paste a URL, read the free preview, then commission the signed pack
 * for an organisation and get the invoice reference.
 *
 * WORDING RULE, ENFORCED HERE AS IN THE FUNCTION. A result is "detected" or "not detected by
 * method X". The pane never says a mark is absent, never calls an output compliant or otherwise,
 * never calls the pack a certificate, and never states a price: the pack is an independently
 * signed, timestamped measurement, and the invoice is the owner's to issue.
 *
 * NOTHING IS TYPED. Every line under "Measured" is the Function's own `checked[]`,
 * `statements[]` and `gaps` — rendered, not paraphrased.
 */

type Check = { method: string; result: string; note?: string };
type Measurement = {
  subject: { sha256: string | null; bytes: number | null; container: string; source: string | null; url: string | null };
  checked: Check[];
  unmeasured: string[];
  gaps: Record<string, string>;
  statements: string[];
};
type Preview = { mode: "preview"; fetched_at: string; measurement: Measurement | null; law: { text: string; text_sha256: string; sources: { eur_lex: string } } };
type Pack = {
  mode: string;
  signed: boolean;
  unsigned_reason: string | null;
  bytes: number;
  payment: { mode: string; reference: string; commissioned_by: string };
  card: Record<string, unknown>;
};

const EP = "/api/art50/marking-evidence";

function tone(result: string): string {
  if (result === "DETECTED" || result === "VALID") return "bg-emerald-100 text-emerald-800";
  if (result === "INVALID") return "bg-rose-100 text-rose-900";
  if (result === "NOT_DETECTED") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-900";
}

function CheckRow({ c }: { c: Check }) {
  return (
    <li className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-900/10 bg-white/85 px-3 py-2">
      <code className="font-mono text-[12px] text-slate-900">{c.method}</code>
      <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${tone(c.result)}`}>{c.result}</span>
      {c.note && <span className={`basis-full ${TYPE.fine}`}>{c.note}</span>}
    </li>
  );
}

export default function LobbyArt50Pane({ onOpenRoute }: { onOpenRoute?: (path: string, label: string) => void }) {
  const [url, setUrl] = useState("");
  const [org, setOrg] = useState("");
  const [phase, setPhase] = useState<"idle" | "measuring" | "commissioning">("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clean = url.trim();
  const urlOk = /^https?:\/\/\S+$/i.test(clean);
  const orgOk = /^[A-Za-z0-9][A-Za-z0-9 .,&'()_/-]{1,79}$/.test(org.trim());

  const measure = useCallback(async () => {
    setPhase("measuring");
    setError(null);
    setPack(null);
    try {
      const r = await fetch(`${EP}?preview=1&url=${encodeURIComponent(clean)}`);
      const b = await r.json();
      if (!r.ok) {
        setPreview(null);
        setError(`${r.status}: ${b.reason || b.error || "the Function did not answer"}`);
      } else setPreview(b as Preview);
    } catch (e) {
      setPreview(null);
      setError((e as Error).message);
    } finally {
      setPhase("idle");
    }
  }, [clean]);

  const commission = useCallback(async () => {
    setPhase("commissioning");
    setError(null);
    try {
      const r = await fetch(`${EP}?commissioned_by=${encodeURIComponent(org.trim())}&invoice=gbp&url=${encodeURIComponent(clean)}`);
      const b = await r.json();
      if (!r.ok) setError(`${r.status}: ${b.reason || b.error || "the Function did not answer"}`);
      else setPack(b as Pack);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPhase("idle");
    }
  }, [clean, org]);

  const m = preview?.measurement ?? null;

  return (
    <div className="h-full overflow-y-auto px-5 py-5 sm:px-7">
      <PaneHead eyebrow="Article 50 · marking evidence" title="Article 50 marking evidence">
        One output, one point in time: is a machine-readable mark <strong>detected</strong> by named methods?
        The Function recomputes a C2PA manifest by bytes and names every method it cannot run. Marks can be
        stripped or forged, so this is detection at a time — an independently signed, timestamped measurement,
        not a conformity opinion, not a guarantee, not legal advice.
      </PaneHead>

      <section className="mt-5 rounded-xl border border-slate-900/10 bg-white/80 px-4 py-3.5">
        <p className={TYPE.section}>The dates and the ceiling — quoted, not interpreted</p>
        <ul className={`mt-2 space-y-1 ${MEASURE} text-[13px] leading-relaxed text-slate-800`}>
          <li>
            <strong>Applies from 2 August 2026</strong> — Article 113, Regulation (EU) 2024/1689.
          </li>
          <li>
            <strong>Systems already on the market before that date: to 2 December 2026</strong> — Commission FAQ on the AI Act.
          </li>
          <li>
            <strong>Article 99(4)(g):</strong> up to EUR 15 000 000 or 3 % of total worldwide annual turnover, whichever is higher.
          </li>
        </ul>
        <p className={`mt-2 ${TYPE.fine}`}>
          The pack carries the verbatim Article 50(2) text, its SHA-256 and the EUR-Lex link, so a reader checks the
          words themselves.
        </p>
      </section>

      <section className="mt-5">
        <Field id="coai-a50-url" label="URL of the output to measure" hint="Public https URL of an image, video, audio or PDF (≤ 20 MiB). Bytes can also be POSTed to the Function directly." value={url} onChange={setUrl} placeholder="https://…/output.jpg" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" disabled={!urlOk || phase !== "idle"} onClick={measure} className={`${PRIMARY} ${FOCUS} disabled:opacity-50`}>
            {phase === "measuring" ? "Measuring…" : "Measure (free preview, unsigned)"}
          </button>
          <span className={TYPE.fine}>Reads the bytes once. Nothing is stored.</span>
        </div>
      </section>

      {error && (
        <div className="mt-4 rounded-xl border border-amber-600/35 bg-amber-50 px-4 py-3">
          <p className="text-[13px] font-semibold text-amber-900">The Function did not return a measurement.</p>
          <p className="mt-1 font-mono text-[11px] text-amber-900/85">{error}</p>
        </div>
      )}

      {m && preview && (
        <section className="mt-6">
          <p className={TYPE.section}>Measured at {preview.fetched_at}</p>
          <p className={`mt-1 ${TYPE.fine}`}>
            sha256 <code className="font-mono">{m.subject.sha256 ?? "—"}</code> · {m.subject.bytes ?? "?"} bytes · {m.subject.container}
          </p>
          <ul className="mt-3 space-y-2">
            {m.checked.map((c) => (
              <CheckRow key={c.method} c={c} />
            ))}
          </ul>
          <ul className={`mt-3 space-y-1 ${MEASURE} text-[13px] leading-relaxed text-slate-800`}>
            {m.statements.map((s) => (
              <li key={s}>— {s}</li>
            ))}
          </ul>
          <p className={`mt-4 ${TYPE.section}`}>Not measured by this Function ({m.unmeasured.length})</p>
          <ul className={`mt-2 space-y-1 ${MEASURE}`}>
            {m.unmeasured.map((k) => (
              <li key={k} className="text-[12px] leading-relaxed text-slate-700">
                <code className="font-mono text-[11.5px] text-slate-900">{k}</code> — {m.gaps[k]}
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-slate-900/10 bg-white/85 px-4 py-4">
            <p className={TYPE.section}>Commission the signed pack</p>
            <p className={`mt-1 ${MEASURE} ${TYPE.body}`}>
              The same measurement, Ed25519-signed and timestamped as one card-v0 leaf, commissioned for an organisation and
              settled on a CSOAI LTD invoice in GBP. The reference below is what the invoice cites; the amount is on the
              invoice, not here.
            </p>
            <div className="mt-3">
              <Field id="coai-a50-org" label="Organisation commissioning the pack" value={org} onChange={setOrg} placeholder="Acme Design Ltd" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" disabled={!orgOk || !urlOk || phase !== "idle"} onClick={commission} className={`${PRIMARY} ${FOCUS} disabled:opacity-50`}>
                {phase === "commissioning" ? "Issuing…" : "Commission (GBP invoice)"}
              </button>
              <span className={TYPE.fine}>Agents settle the same pack on the x402 rail at the Function.</span>
            </div>
          </div>
        </section>
      )}

      {pack && (
        <section className="mt-6 rounded-xl border border-emerald-700/30 bg-emerald-50/70 px-4 py-4">
          <p className={TYPE.section}>Pack issued · {pack.signed ? "signed" : "unsigned"}</p>
          <p className="mt-1 text-[15px] font-semibold text-slate-900">
            Invoice reference <code className="font-mono">{pack.payment.reference}</code>
          </p>
          <p className={`mt-1 ${TYPE.fine}`}>
            Commissioned by {pack.payment.commissioned_by} · {pack.bytes} bytes of signed payload
            {!pack.signed && pack.unsigned_reason ? ` · unsigned: ${pack.unsigned_reason}` : ""}
          </p>
          <CopyBlock label="The card-v0 leaf (verify at /gspc-verify)" text={JSON.stringify(pack.card, null, 2)} />
          {onOpenRoute && (
            <button type="button" onClick={() => onOpenRoute("/gspc-verify", "Verify a card")} className={`mt-3 text-[12.5px] font-semibold text-emerald-800 underline-offset-2 hover:underline ${FOCUS}`}>
              Verify this card →
            </button>
          )}
        </section>
      )}
    </div>
  );
}
