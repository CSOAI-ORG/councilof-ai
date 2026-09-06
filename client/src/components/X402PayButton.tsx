import { useState } from "react";
import {
  buildTypedData,
  chainIdFromNetwork,
  discoverEIP6963,
  signX402Challenge,
  type X402Challenge,
} from "@/lib/x402Wallet";

/**
 * X402PayButton — the Pay button that replaces "paste the wallet-signed x402
 * payload" in ToolRunner.
 *
 * PHASE A. Asking a buyer to hand-assemble an EIP-712 signature and paste it
 * into a text box is not a payment flow; it is a way of making the buyer
 * responsible for our wire format. The terms come from the door's own 402 and
 * are never typed here.
 *
 * WHAT IT REFUSES TO DO. It will not sign a challenge it cannot build a correct
 * domain for. buildTypedData throws when the 402 named no asset, no chain, or
 * no token name/version, and that throw is surfaced verbatim — because the
 * alternative is a signature that looks fine, fails at the facilitator, and
 * looks like the buyer's fault.
 *
 * The three error states this must handle, each shown with what to do next:
 *   wrong network      — the wallet is on a different chain than the 402 names
 *   rejected signature — the buyer declined in their wallet (EIP-1193 4001)
 *   402 re-issued      — the door answered 402 again after we sent the header
 */

export type PayState =
  | { kind: "idle" }
  | { kind: "discovering" }
  | { kind: "no-wallet" }
  | { kind: "signing"; wallet: string }
  | { kind: "paying" }
  | { kind: "paid"; body: string }
  | { kind: "wrong-network"; detail: string }
  | { kind: "rejected"; detail: string }
  | { kind: "reissued"; detail: string }
  | { kind: "error"; detail: string };

/** EIP-1193: 4001 is "user rejected request". */
function isUserRejection(e: unknown): boolean {
  const code = (e as { code?: unknown })?.code;
  return code === 4001 || /user (rejected|denied)/i.test(String((e as Error)?.message ?? ""));
}

export function classifyPayError(e: unknown): PayState {
  const msg = String((e as Error)?.message ?? e);
  if (isUserRejection(e)) {
    return {
      kind: "rejected",
      detail: "You declined the signature in your wallet. Nothing was sent and nothing was charged.",
    };
  }
  if (/wallet is on chain|unsupported network/i.test(msg)) {
    return { kind: "wrong-network", detail: msg };
  }
  return { kind: "error", detail: msg };
}

export default function X402PayButton({
  challenge,
  url,
  onPaid,
  className = "",
}: {
  challenge: X402Challenge;
  url: string;
  onPaid?: (body: string) => void;
  className?: string;
}) {
  const [state, setState] = useState<PayState>({ kind: "idle" });

  const free = challenge.amount === "0" || challenge.amount === "0.0";
  let chain: number | null = null;
  try {
    chain = challenge.chainId ?? (challenge.network ? chainIdFromNetwork(challenge.network) : null);
  } catch {
    chain = null;
  }

  async function pay() {
    setState({ kind: "discovering" });
    try {
      const detail = await discoverEIP6963();
      const provider = (detail as unknown as { provider?: unknown })?.provider as
        | { request: (a: { method: string; params: unknown[] }) => Promise<unknown> }
        | undefined;
      if (!provider) {
        setState({ kind: "no-wallet" });
        return;
      }
      // Build first: if the 402 cannot produce a correct domain, fail BEFORE
      // asking the buyer to approve anything.
      buildTypedData(challenge, "0x0000000000000000000000000000000000000000");

      setState({ kind: "signing", wallet: detail?.info?.name ?? "wallet" });
      const sig = await signX402Challenge(provider, challenge);

      setState({ kind: "paying" });
      const res = await fetch(url, { headers: { "PAYMENT-SIGNATURE": sig.header } });
      const body = await res.text();
      if (res.status === 402) {
        setState({
          kind: "reissued",
          detail:
            "The door answered 402 again after the signed header was sent. The payment was not accepted; nothing was settled.",
        });
        return;
      }
      if (!res.ok) {
        setState({ kind: "error", detail: `The door answered HTTP ${res.status}.` });
        return;
      }
      setState({ kind: "paid", body });
      onPaid?.(body);
    } catch (e) {
      setState(classifyPayError(e));
    }
  }

  const busy = state.kind === "discovering" || state.kind === "signing" || state.kind === "paying";

  return (
    <div className={className} data-testid="x402-pay">
      <button
        type="button"
        onClick={() => void pay()}
        disabled={busy}
        data-testid="x402-pay-button"
        className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {busy
          ? state.kind === "signing"
            ? "Approve in your wallet…"
            : state.kind === "paying"
              ? "Sending…"
              : "Looking for a wallet…"
          : free
            ? "Pay (this door is free)"
            : "Pay with your wallet"}
      </button>

      <p className="mt-2 text-[11px] leading-snug text-slate-500" data-testid="x402-terms">
        Terms come from the door's own 402: pay {challenge.amount} to {challenge.payTo} on chain{" "}
        {chain ?? "—"}
        {challenge.extra?.name ? ` in ${challenge.extra.name}` : ""}. Nothing here is typed by this
        page. Pay-as-you-go x402 at the 402.
      </p>

      {state.kind === "no-wallet" ? (
        <p className="mt-2 text-[12px] text-amber-700" data-testid="x402-no-wallet">
          No EIP-6963 wallet announced itself. Install or unlock a browser wallet and try again —
          this page cannot pay on your behalf.
        </p>
      ) : null}
      {state.kind === "wrong-network" ? (
        <p className="mt-2 text-[12px] font-semibold text-amber-700" data-testid="x402-wrong-network">
          {state.detail}
        </p>
      ) : null}
      {state.kind === "rejected" ? (
        <p className="mt-2 text-[12px] text-amber-700" data-testid="x402-rejected">
          {state.detail}
        </p>
      ) : null}
      {state.kind === "reissued" ? (
        <p className="mt-2 text-[12px] font-semibold text-amber-700" data-testid="x402-reissued">
          {state.detail}
        </p>
      ) : null}
      {state.kind === "error" ? (
        <p className="mt-2 text-[12px] text-amber-700" data-testid="x402-error">
          {state.detail}
        </p>
      ) : null}
      {state.kind === "paid" ? (
        <p className="mt-2 text-[12px] text-emerald-700" data-testid="x402-paid">
          Settled. The door answered and the receipt is below.
        </p>
      ) : null}
    </div>
  );
}
