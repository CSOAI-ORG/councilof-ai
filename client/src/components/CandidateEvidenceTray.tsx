import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Fingerprint,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link } from "wouter";
import {
  MAX_CANDIDATE_BYTES,
  candidateReceiptBytes,
  removeCandidateReceipt,
  signCandidateObservation,
  storeCandidateReceipt,
  submitCandidateForMeasurement,
  type CandidateObservation,
  type MeasurementIntakeReceipt,
  type SignedCandidateReceipt,
} from "@/lib/candidateEvidence";

function subjectFor(observation: CandidateObservation): string {
  const slug = observation.instrumentId
    .toLowerCase()
    .replace(/[^a-z0-9._+-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `game:${slug || "observation"}`;
}

function percent(value: number | undefined): string {
  return typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "—";
}

export default function CandidateEvidenceTray({
  observation,
  onDismiss,
}: {
  observation: CandidateObservation;
  onDismiss: () => void;
}) {
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<SignedCandidateReceipt | null>(null);
  const [submissionConsented, setSubmissionConsented] = useState(false);
  const [intake, setIntake] = useState<MeasurementIntakeReceipt | null>(null);
  const subject = useMemo(() => subjectFor(observation), [observation]);

  async function createReceipt() {
    if (!consented || busy) return;
    setBusy(true);
    setError("");
    try {
      const next = await signCandidateObservation(observation);
      storeCandidateReceipt(next);
      setReceipt(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  function downloadReceipt() {
    if (!receipt) return;
    const blob = new Blob([JSON.stringify(receipt)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `candidate-${receipt.proof.sha256.slice(0, 12)}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  function deleteReceipt() {
    if (!receipt) return;
    removeCandidateReceipt(receipt.proof.sha256);
    setReceipt(null);
    setConsented(false);
    setSubmissionConsented(false);
    setIntake(null);
  }

  async function submitForMeasurement() {
    if (!receipt || !submissionConsented || busy) return;
    setBusy(true);
    setError("");
    try {
      setIntake(await submitCandidateForMeasurement(receipt));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  const witnessHref = receipt
    ? `/dashboard?tab=tools&tool=witness_hash&sha256=${receipt.proof.sha256}&label=${encodeURIComponent(
        `${observation.surface} candidate observation`,
      )}`
    : "";
  const request = new URLSearchParams({ tab: "measured", subject });
  if (observation.axis) request.set("axis", observation.axis.toLowerCase());

  return (
    <aside
      aria-labelledby="candidate-evidence-title"
      className="mx-3 mb-2 shrink-0 overflow-hidden rounded-2xl border border-sky-800/20 bg-sky-50 shadow-sm sm:mx-6"
      data-testid="candidate-evidence-tray"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky-800">
          {receipt ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Fingerprint className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="candidate-evidence-title"
              className="text-xs font-semibold text-sky-950"
            >
              {receipt
                ? "Locally signed candidate created"
                : "Review a candidate observation"}
            </h2>
            <span className="rounded-full border border-sky-800/20 bg-white px-2 py-0.5 font-mono text-[9px] font-bold tracking-wide text-sky-900">
              CANDIDATE_FINDING
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-sky-950/80">
            <strong>{observation.surface}</strong> · {observation.activity}
            {observation.axis ? ` · ${observation.axis}` : ""} · score{" "}
            {percent(observation.score)}
            {observation.n === undefined ? "" : ` · n=${observation.n}`}
          </p>

          {!receipt ? (
            <>
              <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-sky-900/10 bg-white/70 px-3 py-2 text-[11px] leading-relaxed text-sky-950">
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={(event) => setConsented(event.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Create and keep one receipt in this browser. Nothing is
                  uploaded, added to GSPC, or authorised for model training.
                </span>
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!consented || busy}
                  onClick={createReceipt}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-sky-900 px-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {busy ? "Signing locally…" : "Create local signed receipt"}
                </button>
                <span className="text-[10px] text-sky-900/65">
                  Ed25519 · maximum {MAX_CANDIDATE_BYTES / 1024}KB
                </span>
              </div>
              {error ? (
                <p role="alert" className="mt-2 text-[11px] text-red-800">
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <div className="mt-2">
              <p className="break-all font-mono text-[9px] leading-relaxed text-sky-950/70">
                sha256:{receipt.proof.sha256} · {candidateReceiptBytes(receipt)}{" "}
                bytes
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-sky-950/70">
                The browser signature proves these bytes were signed together;
                it does not prove the result. Independent rerun and review are
                still required before MEASURED.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadReceipt}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-sky-900/20 bg-white px-3 text-[11px] font-semibold text-sky-950 hover:bg-sky-100"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Download JSON
                </button>
                <Link
                  href={witnessHref}
                  className="inline-flex min-h-9 items-center rounded-lg border border-sky-900/20 bg-white px-3 text-[11px] font-semibold text-sky-950 hover:bg-sky-100"
                >
                  Open witness challenge
                </Link>
                <Link
                  href={`/dashboard?${request.toString()}`}
                  className="inline-flex min-h-9 items-center rounded-lg border border-sky-900/20 bg-white px-3 text-[11px] font-semibold text-sky-950 hover:bg-sky-100"
                >
                  Review measurement scope
                </Link>
                <button
                  type="button"
                  onClick={deleteReceipt}
                  className="inline-flex min-h-9 items-center rounded-lg border border-sky-900/20 bg-white px-3 text-[11px] font-semibold text-sky-950 hover:bg-sky-100"
                >
                  Delete local copy
                </button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-sky-950/65">
                Witnessing is a separate, manual x402 request. It can anchor
                this digest asynchronously; it does not promote the candidate to
                MEASURED. Independent measurement is a new scoped workflow, not
                an automatic upgrade of this receipt.
              </p>
              {!intake ? (
                <div className="mt-3 rounded-xl border border-emerald-900/15 bg-emerald-50/80 p-3">
                  <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-emerald-950">
                    <input
                      type="checkbox"
                      checked={submissionConsented}
                      onChange={(event) =>
                        setSubmissionConsented(event.target.checked)
                      }
                      className="mt-0.5"
                    />
                    <span>
                      Upload this exact signed receipt for independent
                      measurement intake. This is not consent for training or
                      public release.
                    </span>
                  </label>
                  <button
                    type="button"
                    disabled={!submissionConsented || busy}
                    onClick={submitForMeasurement}
                    className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-emerald-800 px-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busy
                      ? "Verifying intake…"
                      : "Submit for independent review"}
                  </button>
                </div>
              ) : (
                <div
                  role="status"
                  className={`mt-3 rounded-xl border p-3 text-[11px] leading-relaxed ${
                    intake.stored
                      ? "border-emerald-800/20 bg-emerald-50 text-emerald-950"
                      : "border-amber-800/20 bg-amber-50 text-amber-950"
                  }`}
                >
                  <strong>
                    {intake.stored
                      ? "Stored for operator review."
                      : "Signature verified; intake was not stored."}
                  </strong>{" "}
                  {intake.meaning} State remains UNMEASURED; no worker, board
                  write, witness, public release or training use was triggered.
                </div>
              )}
              {error ? (
                <p role="alert" className="mt-2 text-[11px] text-red-800">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss candidate observation"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sky-900/60 hover:bg-white hover:text-sky-950"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
