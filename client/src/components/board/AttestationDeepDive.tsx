/**
 * AttestationDeepDive — click-through deep pages for attestation rows.
 * LOCKS: Living root-as-index GET /root.json; N→N+1 drift = UNCHECKABLE; board 22·15·7; never certify.
 */
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

export type DeepDiveKind =
  | "ed25519"
  | "sha256"
  | "xrpl"
  | "progress"
  | "separation"
  | "in-lane"
  | "axis";

type Props = {
  kind: DeepDiveKind;
  data?: any;
  onClose: () => void;
};

const FOCUS = "focus:outline-none focus:ring-2 focus:ring-emerald-500/40";

function ProgressPanel({ data }: { data?: any }) {
  const totals = data?.totals;
  const measured = totals?.measured_axes ?? 15;
  const axes = totals?.axes ?? 22;
  const empty = totals?.unmeasured_axes ?? 7;

  return (
    <div className="space-y-4 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        N→N+1 drift · UNCHECKABLE
      </p>
      <p className="mt-1 text-xs text-slate-600">
        No published board time series for N→N+1 drift. Empty stays empty — do not invent
        drift numbers or a Merkle seal. Cite the living root-as-index at{" "}
        <a href="/root.json" className="underline">
          /root.json
        </a>{" "}
        for the current snapshot only.
      </p>
      <p className="text-sm text-slate-700">
        Progress · {axes} axis · {measured} measured · {empty} empty (visible). Board stays{" "}
        <strong>22 · 15 · 7</strong>. Never fill empty. Never certify.
      </p>
    </div>
  );
}

function XrplPanel() {
  const [root, setRoot] = useState<any>(null);
  const [xrpl, setXrpl] = useState<any>(null);

  useEffect(() => {
    fetch("/root.json")
      .then((r) => r.json())
      .then(setRoot)
      .catch(() => setRoot(null));
    fetch("/api/xrpl")
      .then((r) => r.json())
      .then(setXrpl)
      .catch(() => setXrpl(null));
  }, []);

  const merkleMatch =
    root?.merkle_root && xrpl?.merkle && String(root.merkle_root) === String(xrpl.merkle);

  return (
    <div className="space-y-3 p-4 text-sm text-slate-700">
      <p className="font-semibold">/api/xrpl is a reader of GET /root.json</p>
      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
        <li>
          • GET /root.json is the living root-as-index (card-v0 leaves). Envelope unsigned until
          keystone — no fake sig_ed25519 on the envelope.
        </li>
        <li>• Leaf attestations = coverage harvest, not grades.</li>
        <li>• writes_board false. Not MEASURED. Not DEVNET.</li>
        <li>
          • {merkleMatch ? "same merkle as /root.json" : "waiting for merkle / mismatch check"}
        </li>
      </ul>
      <a href="/root.json" className={`inline-flex items-center gap-1 text-emerald-700 hover:underline ${FOCUS}`}>
        /root.json <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

export default function AttestationDeepDive({ kind, data, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-emerald-600/20 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
            Deep dive · {kind}
          </h2>
          <button type="button" onClick={onClose} className={`text-xs text-slate-500 hover:text-slate-800 ${FOCUS}`}>
            Close
          </button>
        </div>
        {kind === "progress" ? <ProgressPanel data={data} /> : null}
        {kind === "xrpl" ? <XrplPanel /> : null}
        {kind !== "progress" && kind !== "xrpl" ? (
          <div className="space-y-2 p-4 text-sm text-slate-700">
            <p>
              Cite living GET <a className="underline" href="/api/gspc">/api/gspc</a> and{" "}
              <a className="underline" href="/root.json">
                /root.json
              </a>
              . Board 22 · 15 · 7. Never certify.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
