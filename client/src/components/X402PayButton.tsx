import { useEffect, useRef, useState } from "react";
import {
  buildTypedData,
  chainIdFromNetwork,
  discoverEIP6963,
  formatPaymentAmount,
  signX402Challenge,
  type X402Challenge,
} from "@/lib/x402Wallet";

/** Result of retrying the original paid MCP tool with `x_payment`. */
export type X402ExecutionResult = {
  status: "delivered" | "reissued" | "failed";
  paymentResponse?: string | null;
  detail?: string;
};

export type PayState =
  | { kind: "idle" }
  | { kind: "reviewing" }
  | { kind: "discovering" }
  | { kind: "no-wallet" }
  | { kind: "signing"; wallet: string }
  | { kind: "paying" }
  | { kind: "delivered"; settlementResponse: boolean }
  | { kind: "wrong-network"; detail: string }
  | { kind: "rejected"; detail: string }
  | { kind: "reissued"; detail: string }
  | { kind: "error"; detail: string };

/** EIP-1193: 4001 is "user rejected request". */
function isUserRejection(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  return (
    code === 4001 ||
    /user (rejected|denied)/i.test(String((error as Error)?.message ?? ""))
  );
}

export function classifyPayError(error: unknown): PayState {
  const message = String((error as Error)?.message ?? error);
  if (isUserRejection(error)) {
    return {
      kind: "rejected",
      detail:
        "You declined the signature in your wallet. Nothing was sent and nothing was charged.",
    };
  }
  if (/wallet is on chain|unsupported network/i.test(message)) {
    return { kind: "wrong-network", detail: message };
  }
  return { kind: "error", detail: message };
}

/** Synchronous lock used before React can commit a busy-state render. */
export function claimPaymentAttempt(lock: { current: boolean }): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

/**
 * Presents the exact challenge price, gets explicit confirmation, signs a v2
 * PaymentPayload, then delegates execution to the caller. ToolRunner supplies
 * the execution callback so the original tool arguments/method are preserved.
 */
export default function X402PayButton({
  challenge,
  executePayment,
  isContextCurrent,
  className = "",
}: {
  challenge: X402Challenge;
  executePayment: (paymentHeader: string) => Promise<X402ExecutionResult>;
  isContextCurrent: () => boolean;
  className?: string;
}) {
  const [state, setState] = useState<PayState>({ kind: "idle" });
  const inFlightRef = useRef(false);
  const operationRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
      inFlightRef.current = false;
    };
  }, []);
  const price = formatPaymentAmount(challenge);
  const network = challenge.accepted?.network || challenge.network;
  const payee = challenge.accepted?.payTo || challenge.payTo;
  const resource = challenge.resourceInfo?.url || challenge.resource;
  let chain: number | null = null;
  try {
    chain = challenge.chainId ?? (network ? chainIdFromNetwork(network) : null);
  } catch {
    chain = null;
  }

  async function confirmAndPay() {
    if (!claimPaymentAttempt(inFlightRef)) return;
    const operation = ++operationRef.current;
    const operationAlive = () =>
      mountedRef.current && operationRef.current === operation;
    const remainsCurrent = () => operationAlive() && isContextCurrent();
    if (!remainsCurrent()) {
      inFlightRef.current = false;
      if (mountedRef.current) {
        setState({
          kind: "error",
          detail:
            "The tool or inputs changed. Run the job again to get current payment terms.",
        });
      }
      return;
    }

    setState({ kind: "discovering" });
    try {
      // Refuse malformed or incomplete v2 terms before opening the wallet.
      buildTypedData(challenge, "0x0000000000000000000000000000000000000000");
      const detail = await discoverEIP6963();
      if (!remainsCurrent()) return;
      if (!detail?.provider) {
        setState({ kind: "no-wallet" });
        return;
      }

      // Discovery may be asynchronous. Re-check immediately before the wallet
      // account/signature prompts so stale terms never reach the provider.
      if (!remainsCurrent()) return;
      setState({ kind: "signing", wallet: detail.info?.name ?? "wallet" });
      const signature = await signX402Challenge(detail.provider, challenge);
      // A tool/input change while the wallet prompt was open invalidates this
      // approval. Never replay it against mutable or newly selected inputs.
      if (!remainsCurrent()) return;
      setState({ kind: "paying" });
      const execution = await executePayment(signature.header);
      if (!operationAlive()) return;

      if (execution.status === "reissued") {
        setState({
          kind: "reissued",
          detail:
            execution.detail ||
            "The tool returned PAYMENT_REQUIRED again. The payment was not accepted; do not treat it as settled.",
        });
        return;
      }
      if (execution.status !== "delivered") {
        setState({
          kind: "error",
          detail: execution.detail || "The paid tool did not deliver a result.",
        });
        return;
      }
      setState({
        kind: "delivered",
        settlementResponse: Boolean(execution.paymentResponse),
      });
    } catch (error) {
      if (operationAlive()) setState(classifyPayError(error));
    } finally {
      if (operationRef.current === operation) inFlightRef.current = false;
    }
  }

  function cancelReview() {
    operationRef.current += 1;
    inFlightRef.current = false;
    setState({ kind: "idle" });
  }

  const busy =
    state.kind === "discovering" ||
    state.kind === "signing" ||
    state.kind === "paying";

  return (
    <div className={className} data-testid="x402-pay">
      {state.kind === "reviewing" ? (
        <div
          className="rounded-xl border border-amber-700/25 bg-amber-50 p-3.5"
          data-testid="x402-review"
        >
          <p className="text-xs font-semibold text-amber-950">
            Confirm the exact payment
          </p>
          <dl className="mt-2 grid gap-1 text-[11px] leading-relaxed text-amber-950 sm:grid-cols-[6rem_1fr]">
            <dt className="font-semibold">Amount</dt>
            <dd>{price}</dd>
            <dt className="font-semibold">Network</dt>
            <dd>{network || `chain ${chain ?? "—"}`}</dd>
            <dt className="font-semibold">Recipient</dt>
            <dd className="break-all font-mono">{payee}</dd>
            <dt className="font-semibold">Resource</dt>
            <dd className="break-all">{resource}</dd>
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-900">
            Your wallet will sign these terms. The original MCP job will then be
            retried once with the signed x402 payload. Cancel leaves the job
            unpaid.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void confirmAndPay()}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
              data-testid="x402-confirm"
            >
              Confirm {price}
            </button>
            <button
              type="button"
              onClick={cancelReview}
              className="rounded-lg border border-slate-900/15 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setState({ kind: "reviewing" })}
          disabled={busy}
          data-testid="x402-pay-button"
          className="rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {busy
            ? state.kind === "signing"
              ? "Approve in your wallet…"
              : state.kind === "paying"
                ? "Requesting the paid result…"
                : "Looking for a wallet…"
            : `Review payment · ${price}`}
        </button>
      )}

      <p
        className="mt-2 text-[11px] leading-snug text-slate-500"
        data-testid="x402-terms"
      >
        Exact terms come from the route's x402 v2 challenge. This page supplies
        no price or recipient of its own and never asks for a seed phrase or
        private key.
      </p>

      {state.kind === "no-wallet" ? (
        <p
          className="mt-2 text-[12px] text-amber-700"
          data-testid="x402-no-wallet"
        >
          No EIP-6963 wallet announced itself. Install or unlock a browser
          wallet and try again — this page cannot pay on your behalf.
        </p>
      ) : null}
      {state.kind === "wrong-network" ? (
        <p
          className="mt-2 text-[12px] font-semibold text-amber-700"
          data-testid="x402-wrong-network"
        >
          {state.detail}
        </p>
      ) : null}
      {state.kind === "rejected" ? (
        <p
          className="mt-2 text-[12px] text-amber-700"
          data-testid="x402-rejected"
        >
          {state.detail}
        </p>
      ) : null}
      {state.kind === "reissued" ? (
        <p
          className="mt-2 text-[12px] font-semibold text-amber-700"
          data-testid="x402-reissued"
        >
          {state.detail}
        </p>
      ) : null}
      {state.kind === "error" ? (
        <p className="mt-2 text-[12px] text-amber-700" data-testid="x402-error">
          {state.detail}
        </p>
      ) : null}
      {state.kind === "delivered" ? (
        <p
          className="mt-2 text-[12px] text-emerald-700"
          data-testid="x402-delivered"
        >
          {state.settlementResponse
            ? "Delivered. The server also returned an opaque PAYMENT-RESPONSE receipt value; it has not been independently verified here."
            : "Delivered, but the server returned no PAYMENT-RESPONSE receipt value. Delivery is not proof of settlement."}
        </p>
      ) : null}
    </div>
  );
}
