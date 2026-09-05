import { useEffect, useState } from "react";

// /report — the Global AI Watchdog intake. Anyone (human, analyst, agent) can
// report an AI incident, free, with no account.
//
// WHAT WAS WRONG HERE (2026-08-27, found by operating the form in a browser and
// watching the network layer). Submit POSTed to /api/sign — a path no function
// serves (404) — then hashed the text locally and told the reporter "Report
// sealed … logged", with a "live watchdog map" link that redirected to the OS
// home. The report reached nobody and was stored nowhere. That is the exact
// defect this estate exists to catch, committed on our own intake form.
//
// NOW: the form POSTs to /api/report (functions/api/report.ts), which returns a
// compact digest-bound acknowledgement when the signing key is bound and says
// proof.alg:"UNSIGNED" when it is not. The response never reflects the incident
// description or canonical record. stored:true only means the full report landed
// in the bound datastore; every later step remains separate and non-automatic.
const SEV = ["Low", "Medium", "High", "Critical"];
const KIND = [
  "Bias / discrimination",
  "Safety / physical harm",
  "Privacy / data",
  "Deception / manipulation",
  "Security / misuse",
  "Transparency (no AI disclosure)",
  "Other",
];

type Ack = {
  schema: "csoai.incident-intake-receipt/0.1";
  status: "REPORTED";
  report_id: string;
  received_at: string;
  record_digest: string;
  stored: boolean;
  fallback?: string;
  writes_board: false;
  model_training: false;
  external_witness_upload: false;
  measurement_state: "UNMEASURED";
  anchoring: { state: "NOT_REQUESTED"; automatic: false };
  proof: {
    alg: "Ed25519" | "UNSIGNED";
    sig: string;
    kid: string;
    sha256: string;
  };
};

export default function IncidentReport() {
  const [k, setK] = useState(KIND[0]);
  const [sev, setSev] = useState("High");
  const [system, setSystem] = useState("");
  const [where, setWhere] = useState("");
  const [what, setWhat] = useState("");
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState<Ack | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    document.title = "Report an AI incident — Global AI Watchdog | CSOAI";
  }, []);

  async function submit() {
    if (!what.trim() || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          incident_type: k,
          severity: sev,
          system,
          location: where,
          description: what.trim(),
        }),
      });
      const j = await res.json().catch(() => null);
      if (
        !res.ok ||
        !j ||
        j.schema !== "csoai.incident-intake-receipt/0.1" ||
        j.status !== "REPORTED" ||
        !j.report_id
      ) {
        throw new Error(j && j.error ? String(j.error) : `HTTP ${res.status}`);
      }
      setAck(j as Ack);
    } catch (error: unknown) {
      // The truth, not a thank-you: the report did not go through.
      const detail = error instanceof Error ? error.message : "network error";
      setFailure(
        "Your report was NOT submitted — the intake endpoint could not be reached (" +
          detail +
          "). Nothing was recorded. Your text is still in the box; email it to nicholas@csoai.org if this persists.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <a
          href="/dashboard?tab=home"
          className="font-mono text-[11px] font-semibold uppercase tracking-[3px] text-emerald-800 hover:text-emerald-950"
        >
          Council OS · Global AI Watchdog
        </a>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Report an AI incident.
        </h1>
        <p className="mt-3 leading-relaxed text-slate-600">
          See an AI system causing harm, discriminating, or hiding that it is
          AI? Report it — free, no account. The intake returns a compact
          acknowledgement containing the report's{" "}
          <span className="font-semibold text-emerald-800">
            SHA-256 digest, not its sensitive text
          </span>
          , and tells you whether the full record was stored. Intake is not
          triage, a finding, measurement, a board entry, anchoring, or consent
          to train a model.
        </p>

        {!ack ? (
          <div className="mt-7 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </label>
                <select
                  value={k}
                  onChange={(e) => setK(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {KIND.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Reported severity
                </label>
                <div className="flex gap-1.5">
                  {SEV.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSev(s)}
                      className={
                        "flex-1 rounded-lg px-2 py-2.5 text-xs font-bold transition " +
                        (sev === s
                          ? "bg-emerald-800 text-white"
                          : "border border-slate-300 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50")
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                AI system / company
              </label>
              <input
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                placeholder="e.g. a hiring AI at Acme Corp"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Location (optional)
              </label>
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="e.g. Germany, or remote/online"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                What happened
              </label>
              <textarea
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                rows={5}
                placeholder="Describe the incident — what the system did, who was affected, and how you know."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={busy || !what.trim()}
              className="w-full rounded-xl bg-emerald-800 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              {busy ? "Submitting…" : "Submit report ▶"}
            </button>
            {failure && (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-[12px] leading-relaxed text-red-800">
                {failure}
              </p>
            )}
            <p className="text-[11px] leading-relaxed text-slate-500">
              The receipt says <strong>UNSIGNED</strong> when no signing key is
              bound and <strong>stored: true</strong> only after the record
              lands in the datastore. It never sends the report to a witness,
              anchor, board, or training process automatically.
            </p>
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-lg">
                ✓
              </span>
              <span className="text-lg font-black">
                Intake receipt created{ack.stored ? " and report stored" : ""}.
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Incident{" "}
              <span className="font-mono font-semibold text-emerald-800">
                {ack.report_id.slice(0, 16)}
              </span>{" "}
              marked REPORTED at{" "}
              {ack.received_at.slice(0, 19).replace("T", " ")}Z.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-800">
                Reported
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                Unmeasured
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                Board write: no
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                Training: no
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                Anchor: not requested
              </span>
            </div>
            {!ack.stored && (
              <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-950">
                <strong>Report text not retained:</strong> the datastore write
                did not land. This receipt contains only its digest, so keep
                your original text.{" "}
                {ack.fallback ||
                  "Email the original report to nicholas@csoai.org."}
              </p>
            )}
            <div className="mt-4 whitespace-pre-wrap break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-[11px] leading-relaxed text-slate-600">
              {ack.proof.alg === "Ed25519" ? (
                <>
                  record {ack.record_digest}
                  {"\n"}receipt {ack.proof.sha256}
                  {"\n"}sig {ack.proof.sig.slice(0, 64)}… · Ed25519 ·{" "}
                  {ack.proof.kid}
                </>
              ) : (
                <>
                  record {ack.record_digest}
                  {"\n"}UNSIGNED — no signing key is bound. The digest
                  identifies the submitted bytes but does not prove Council
                  receipt.
                </>
              )}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              {ack.proof.alg === "Ed25519"
                ? "The signature covers this acknowledgement and the report digest, not the sensitive description itself. It acknowledges intake only; triage and independent measurement have not started."
                : "Triage and independent measurement have not started. They remain separate even when a signed intake receipt is available."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="/dashboard?tab=home"
                className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Return to Council OS
              </a>
              <a
                href={`/dashboard?tab=tools&tool=witness_hash&sha256=${ack.record_digest.replace(/^sha256:/, "")}&label=${encodeURIComponent(`incident ${ack.report_id} digest`)}`}
                className="rounded-lg border border-emerald-700/30 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
              >
                Request digest witness
              </a>
              <button
                type="button"
                onClick={() => {
                  setAck(null);
                  setWhat("");
                  setSystem("");
                  setWhere("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Report another
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Witnessing is a separate reviewed request. It can timestamp this
              digest; it cannot verify the incident or promote it to MEASURED.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
