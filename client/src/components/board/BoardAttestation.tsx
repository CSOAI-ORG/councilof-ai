/**
 * BoardAttestation — living tables showing Ed25519 signature, SHA-256 hash,
 * XRPL ledger status, and progress visualization from the live board.
 *
 * Click-through: every row opens a deep page with interactive graphs, traces,
 * logs. RWA.xyz-class or better.
 *
 * Fetches from /api/gspc at render time. No hardcoded scores. Empty fields
 * render as UNMEASURED with an honest reason.
 *
 * ── LOCKS ────────────────────────────────────────────────────────────────────
 * - site_attestation (Ed25519, did:web:csoai.org#board-attestation-1) verifies.
 * - living_stamp is UNVERIFIABLE (explicitly stated in the payload).
 * - Living root-as-index: GET /root.json is the living public index (unsigned
 *   envelope until keystone; leaf attestations = coverage harvest, not grades).
 *   /api/xrpl is a reader of that root (writes_board false). Live locked 16.
 * - Never certify. Verify stays free and loginless. No fake sig_ed25519 on the envelope.
 */

import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import AttestationDeepDive, { type DeepDiveKind } from "./AttestationDeepDive";

interface SiteAttestation {
  attests?: string;
  signer?: string;
  alg?: string;
  sig?: string;
  public_key_x?: string;
  sig_input?: string;
  sig_input_ensure_ascii?: boolean;
  sig_input_is_digest?: boolean;
  verify?: string;
}

interface LivingStamp {
  source?: string;
  updated?: string;
  signed?: boolean;
  verification_state?: string;
  verifiable?: boolean;
  signer?: string;
  signature?: string;
  unverifiable_note?: string;
}

interface BoardTotals {
  axes?: number;
  measured_axes?: number;
  unmeasured_axes?: number;
  public_count?: string;
  count_grammar?: string;
  comparison_axes?: number;
  separated_leads?: number;
  ties?: number;
}

interface InLaneAxis {
  axis: string;
  bench?: string;
  task?: string;
  n?: number;
  accuracy?: number;
  leader?: string;
  separation?: string;
  fleet_mean?: number;
  status?: string;
}

interface BoardAttestationProps {
  data: {
    site_attestation?: SiteAttestation;
    measured_on?: { living_stamp?: LivingStamp };
    totals?: BoardTotals;
    measured_in_lane?: InLaneAxis[];
  } | null;
  variant?: "light" | "dark";
  showProgress?: boolean;
  showInLane?: boolean;
  compact?: boolean;
}

function truncateSig(sig: string | undefined, len = 16): string {
  if (!sig) return "—";
  if (sig.length <= len * 2) return sig;
  return `${sig.slice(0, len)}…${sig.slice(-8)}`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BoardAttestation({
  data,
  variant = "light",
  showProgress = true,
  showInLane = true,
  compact = false,
}: BoardAttestationProps) {
  const [deepDive, setDeepDive] = useState<{ kind: DeepDiveKind; extra?: any } | null>(null);
  
  const dark = variant === "dark";
  const att = data?.site_attestation;
  const stamp = data?.measured_on?.living_stamp;
  const totals = data?.totals;
  const inLane = data?.measured_in_lane;

  const axes = totals?.axes ?? 0;
  const measured = totals?.measured_axes ?? 0;
  const unmeasured = totals?.unmeasured_axes ?? (axes - measured);
  const progressPct = axes > 0 ? (measured / axes) * 100 : 0;

  const borderCls = dark ? "border-emerald-500/20" : "border-emerald-600/15";
  const bgCls = dark ? "bg-[#05140d]" : "bg-white";
  const textMuted = dark ? "text-emerald-100/70" : "text-gray-600";
  const textPrimary = dark ? "text-emerald-50" : "text-gray-900";
  const labelCls = `text-[11px] font-bold uppercase tracking-wider ${dark ? "text-emerald-300/60" : "text-emerald-700/70"}`;
  const hoverCls = `cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${dark ? "hover:border-emerald-400/40" : "hover:border-emerald-500/40"}`;
  const clickHintCls = `ml-auto shrink-0 ${dark ? "text-emerald-400/50" : "text-emerald-600/40"}`;

  return (
    <>
    <div className={`rounded-2xl border ${borderCls} ${bgCls} p-5 space-y-5`}>
      {/* ATTESTATION TABLE */}
      <div>
        <h3 className={`${labelCls} mb-3`}>Attestation · live from GET /api/gspc · click any row for traces</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Ed25519 Signature */}
          <button
            onClick={() => setDeepDive({ kind: "ed25519" })}
            className={`rounded-lg border ${borderCls} p-3 text-left ${hoverCls}`}
          >
            <div className="flex items-center">
              <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Ed25519 Signature</p>
              <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
            </div>
            {att?.sig ? (
              <p className={`mt-1 font-mono text-[12px] ${textPrimary} break-all`} title={att.sig}>
                {truncateSig(att.sig, 20)}
              </p>
            ) : (
              <p className={`mt-1 text-[12px] ${textMuted}`}>
                Empty — no site_attestation.sig in payload
              </p>
            )}
            {att?.alg && (
              <p className={`mt-1 text-[10px] ${textMuted}`}>alg: {att.alg}</p>
            )}
          </button>

          {/* SHA-256 / Content Hash */}
          <button
            onClick={() => setDeepDive({ kind: "sha256" })}
            className={`rounded-lg border ${borderCls} p-3 text-left ${hoverCls}`}
          >
            <div className="flex items-center">
              <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Content Integrity</p>
              <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
            </div>
            {att?.sig_input ? (
              <>
                <p className={`mt-1 text-[12px] ${textPrimary}`}>
                  SHA-256 over canonical JSON
                </p>
                <p className={`mt-1 text-[10px] ${textMuted}`}>
                  ensure_ascii={String(att.sig_input_ensure_ascii ?? "false")}, 
                  is_digest={String(att.sig_input_is_digest ?? "false")}
                </p>
              </>
            ) : (
              <p className={`mt-1 text-[12px] ${textMuted}`}>
                Empty — no sig_input rule in payload
              </p>
            )}
          </button>

          {/* XRPL Ledger Height */}
          <button
            onClick={() => setDeepDive({ kind: "xrpl" })}
            className={`rounded-lg border ${borderCls} p-3 text-left ${hoverCls}`}
          >
            <div className="flex items-center">
              <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>XRPL Ledger Height</p>
              <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
            </div>
            <p className={`mt-1 text-[12px] font-semibold ${dark ? "text-amber-300" : "text-amber-700"}`}>
              /api/xrpl is a reader
            </p>
            <p className={`mt-1 text-[10px] ${textMuted}`}>
              Living root-as-index: GET /root.json (unsigned envelope until keystone;
              leaf attestations = coverage harvest, not grades). Live locked 16, same merkle.
              Not a GSPC grade. Not MEASURED. Not DEVNET.
            </p>
          </button>
        </div>

        {/* Signer / Verification Method */}
        {att?.signer && (
          <button
            onClick={() => setDeepDive({ kind: "ed25519" })}
            className={`mt-3 rounded-lg border ${borderCls} p-3 w-full text-left ${hoverCls}`}
          >
            <div className="flex items-center">
              <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Verification Method</p>
              <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
            </div>
            <p className={`mt-1 font-mono text-[12px] ${textPrimary} break-all`}>
              {att.signer}
            </p>
            {att.public_key_x && (
              <p className={`mt-1 text-[10px] ${textMuted}`}>
                public_key_x: {truncateSig(att.public_key_x, 12)}
              </p>
            )}
            <p className={`mt-2 text-[11px] ${textMuted}`}>
              Fetch /.well-known/did.json → verify sig over canonical(payload minus site_attestation).
            </p>
          </button>
        )}

        {/* Living Stamp Warning */}
        {stamp && (
          <div className={`mt-3 rounded-lg border ${dark ? "border-amber-500/30 bg-amber-900/20" : "border-amber-300 bg-amber-50"} p-3`}>
            <p className={`text-[10px] uppercase tracking-wide ${dark ? "text-amber-300/80" : "text-amber-700"}`}>
              Living Stamp — {stamp.verification_state || "UNVERIFIABLE"}
            </p>
            <p className={`mt-1 text-[11px] ${dark ? "text-amber-200/70" : "text-amber-800"}`}>
              {stamp.unverifiable_note
                ? stamp.unverifiable_note.slice(0, 200) + (stamp.unverifiable_note.length > 200 ? "…" : "")
                : "Do not treat this as a valid attestation. Check site_attestation instead."}
            </p>
            {stamp.updated && (
              <p className={`mt-1 text-[10px] ${textMuted}`}>
                Stamp dated: {formatDate(stamp.updated)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* PROGRESS VISUALIZATION */}
      {showProgress && totals && (
        <div className={`border-t ${borderCls} pt-5`}>
          <h3 className={`${labelCls} mb-3`}>Progress · {totals.public_count || `${axes} axis · ${measured} measured`}</h3>
          
          <button
            onClick={() => setDeepDive({ kind: "progress" })}
            className={`w-full rounded-lg border ${borderCls} p-4 text-left ${hoverCls}`}
          >
            <div className="flex items-center gap-4">
              {/* Progress Bar */}
              <div className="flex-1">
                <div className={`h-3 rounded-full ${dark ? "bg-emerald-900/40" : "bg-gray-200"} overflow-hidden`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px]">
                  <span className={textMuted}>{measured} measured</span>
                  <span className={dark ? "text-amber-300/70" : "text-amber-700"}>{unmeasured} empty (visible)</span>
                  <span className={textMuted}>{axes} total</span>
                </div>
              </div>
              
              {/* Numbers */}
              <div className="text-right">
                <p className={`text-2xl font-black ${textPrimary}`}>
                  {measured}<span className={textMuted}>/</span>{axes}
                </p>
                <p className={`text-[10px] ${textMuted}`}>axis</p>
              </div>
              <ChevronRight className={`h-4 w-4 ${clickHintCls}`} />
            </div>
          </button>

          {/* Count Grammar */}
          {!compact && totals.count_grammar && (
            <p className={`mt-3 text-[11px] ${textMuted}`}>
              {totals.count_grammar}
            </p>
          )}

          {/* Separation Summary */}
          {totals.comparison_axes !== undefined && totals.separated_leads !== undefined && (
            <button
              onClick={() => setDeepDive({ kind: "separation" })}
              className={`mt-3 w-full rounded-lg border ${borderCls} p-3 text-left ${hoverCls}`}
            >
              <div className="flex items-center">
                <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Separation Summary</p>
                <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                <span className={`rounded-full border ${dark ? "border-emerald-500/30 bg-emerald-900/30" : "border-emerald-300 bg-emerald-50"} px-2.5 py-1 font-semibold ${dark ? "text-emerald-300" : "text-emerald-800"}`}>
                  {totals.separated_leads} SEPARATED
                </span>
                <span className={`rounded-full border ${dark ? "border-amber-500/30 bg-amber-900/30" : "border-amber-300 bg-amber-50"} px-2.5 py-1 font-semibold ${dark ? "text-amber-300" : "text-amber-800"}`}>
                  {totals.ties ?? 0} TIE
                </span>
                <span className={textMuted}>
                  of {totals.comparison_axes} model-comparison axis (McNemar p&lt;0.05)
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* IN-LANE / UNSIGNED PATH */}
      {showInLane && inLane && inLane.length > 0 && (
        <div className={`border-t ${borderCls} pt-5`}>
          <div className="flex items-center mb-3">
            <h3 className={labelCls}>
              Unsigned Financial Slots · not board rows
            </h3>
            <button
              onClick={() => setDeepDive({ kind: "in-lane" })}
              className={`ml-2 text-[10px] ${dark ? "text-emerald-400" : "text-emerald-700"} hover:underline`}
            >
              view all traces →
            </button>
          </div>
          <p className={`text-[11px] ${textMuted} mb-3`}>
            {inLane.length} unsigned financial slots measured on a smaller fleet with no separation test.
            Published as <code className="text-[10px]">measured_in_lane</code> on GET /api/gspc.
            NOT stamped onto the board 15. public_count stays 22 axis · 15 measured.
            Fetched from /interop/ as unsigned leftover only.
          </p>
          
          <div className="grid gap-2 sm:grid-cols-2">
            {inLane.map((axis) => (
              <button
                key={axis.axis}
                onClick={() => setDeepDive({ kind: "axis", extra: { selectedAxis: axis } })}
                className={`rounded-lg border ${borderCls} p-3 text-left ${hoverCls}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-semibold ${textPrimary}`}>{axis.axis}</p>
                    <p className={`text-[11px] ${textMuted}`}>{axis.bench || axis.task}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${dark ? "border-violet-500/40 bg-violet-900/30 text-violet-300" : "border-violet-300 bg-violet-50 text-violet-800"}`}>
                    IN-LANE
                  </span>
                </div>
                {axis.n !== undefined && (
                  <div className={`mt-2 flex flex-wrap gap-3 text-[11px] font-mono`}>
                    <span className={textPrimary}>n={axis.n}</span>
                    {axis.accuracy !== undefined && (
                      <span className={textMuted}>acc={(axis.accuracy * 100).toFixed(0)}%</span>
                    )}
                    {axis.fleet_mean !== undefined && (
                      <span className={textMuted}>fleet={(axis.fleet_mean * 100).toFixed(0)}%</span>
                    )}
                  </div>
                )}
                {axis.separation === "UNTESTED" && (
                  <p className={`mt-2 text-[10px] ${dark ? "text-amber-300/70" : "text-amber-700"}`}>
                    Path to signed: needs n≥30 + 4-way separation test + keystone
                  </p>
                )}
                <ChevronRight className={`absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 ${clickHintCls} opacity-0 group-hover:opacity-100`} />
              </button>
            ))}
          </div>

          {/* Unsigned-to-Signed Path */}
          <button
            onClick={() => setDeepDive({ kind: "in-lane" })}
            className={`mt-4 w-full rounded-lg border ${dark ? "border-emerald-500/20 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50/50"} p-3 text-left ${hoverCls}`}
          >
            <div className="flex items-center">
              <p className={`text-[11px] font-semibold ${dark ? "text-emerald-300" : "text-emerald-800"}`}>
                Unsigned → Signed path (honest)
              </p>
              <ChevronRight className={`h-3 w-3 ${clickHintCls}`} />
            </div>
            <ul className={`mt-2 text-[11px] ${textMuted} space-y-1`}>
              <li>• n ≥ 30 usable items (current: {inLane.map(a => a.n ?? 0).join(", ") || "—"})</li>
              <li>• 4-way separation test (McNemar on discordant items)</li>
              <li>• Keystone attestation (Ed25519 over canonical JSON)</li>
              <li>• Board gate reconciliation (owner-gated)</li>
            </ul>
            <p className={`mt-2 text-[10px] ${dark ? "text-amber-300/60" : "text-amber-600"}`}>
              No fake close: these axes are not marked signed, no completion date is invented,
              and no path is painted as complete.
            </p>
          </button>
        </div>
      )}

      {/* LINKS */}
      {!compact && (
        <div className={`border-t ${borderCls} pt-4 flex flex-wrap gap-3 text-[12px]`}>
          <Link
            href="/gspc-verify"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            Verify the chain →
          </Link>
          <a
            href="/.well-known/did.json"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            DID document →
          </a>
          <a
            href="/api/gspc"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            Raw JSON →
          </a>
          <a
            href="/root.json"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            Living root-as-index (/root.json) →
          </a>
          <Link
            href="/xrpl-attest"
            className={dark ? "text-emerald-300 hover:underline" : "text-emerald-700 hover:underline"}
          >
            XRPL public-root catalogue →
          </Link>
        </div>
      )}
    </div>
    
    {/* Deep Dive Modal */}
    {deepDive && (
      <AttestationDeepDive
        kind={deepDive.kind}
        data={{ ...data, ...(deepDive.extra || {}) }}
        onClose={() => setDeepDive(null)}
      />
    )}
    </>
  );
}
