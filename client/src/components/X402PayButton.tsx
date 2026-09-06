/**
 * X402PayButton — the paste box becomes a button.
 *
 * The tool runner's `x_payment` field asks the operator to "Paste the wallet-signed x402
 * payload". That asks a person to be a wallet: fetch the 402, build EIP-712 typed data by
 * hand, sign it elsewhere, base64 it, paste it. So the metered doors were unreachable in
 * practice even though the rail settles.
 *
 * This signs the door's own challenge with the browser wallet and writes the resulting
 * X-PAYMENT value into the field. The paste box stays — a payload obtained another way is
 * still valid input, and removing that would be a regression for anyone scripting it.
 *
 * It never holds a key and never picks an amount: every term is read from the server's 402.
 */
import { useCallback, useState } from "react";
import {
  buildTypedData,
  chooseAccept,
  discoverWallets,
  encodePaymentHeader,
  type DiscoveredWallet,
  type X402Challenge,
} from "@/lib/x402Wallet";

type Phase = "idle" | "finding" | "signing" | "done" | "error";

export default function X402PayButton({
  resourceUrl,
  onSigned,
}: {
  /** The metered door this payload will be presented to. Terms come from ITS 402. */
  resourceUrl: string;
  onSigned: (header: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [detail, setDetail] = useState<string>("");
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);

  const sign = useCallback(
    async (wallet: DiscoveredWallet) => {
      setPhase("signing");
      setDetail(`${wallet.info.name} — reading the door's terms`);
      try {
        const res = await fetch(resourceUrl, { headers: { accept: "application/json" } });
        if (res.status !== 402) {
          setPhase("error");
          setDetail(
            `${resourceUrl} answered ${res.status}, not 402 — there is nothing to pay for here.`,
          );
          return;
        }
        const challenge = (await res.json()) as X402Challenge;
        const accept = chooseAccept(challenge);

        const accounts = (await wallet.provider.request({
          method: "eth_requestAccounts",
        })) as string[];
        const from = accounts?.[0];
        if (!from) throw new Error("wallet returned no account");

        const { typedData, authorization, chainId } = buildTypedData(accept, from);

        const current = (await wallet.provider.request({ method: "eth_chainId" })) as string;
        if (current && parseInt(current, 16) !== chainId) {
          setPhase("error");
          setDetail(
            `Wallet is on chain ${parseInt(current, 16)}; this door settles on ${chainId}. Switch network and try again — signing on the wrong chain produces a signature the token will reject.`,
          );
          return;
        }

        const amount = accept.amount ?? accept.maxAmountRequired ?? "0";
        setDetail(
          amount === "0"
            ? `${wallet.info.name} — approve the authorization (amount 0, no funds move)`
            : `${wallet.info.name} — approve ${amount} ${accept.extra?.symbol ?? ""} to ${accept.payTo.slice(0, 10)}…`,
        );

        const signature = (await wallet.provider.request({
          method: "eth_signTypedData_v4",
          params: [from, JSON.stringify(typedData)],
        })) as string;

        onSigned(encodePaymentHeader(accept, authorization, signature));
        setPhase("done");
        setDetail(`Signed by ${from.slice(0, 6)}…${from.slice(-4)} — payload written to the field.`);
      } catch (cause) {
        setPhase("error");
        const message = (cause as Error)?.message ?? String(cause);
        setDetail(/user rejected|denied/i.test(message) ? "Signature declined in the wallet." : message);
      }
    },
    [resourceUrl, onSigned],
  );

  const start = useCallback(async () => {
    setPhase("finding");
    setDetail("");
    const found = await discoverWallets();
    if (found.length === 0) {
      setPhase("error");
      setDetail(
        "No EIP-6963 wallet announced itself. Install a browser wallet, or paste a payload signed elsewhere.",
      );
      return;
    }
    if (found.length === 1) return sign(found[0]);
    setWallets(found);
    setPhase("idle");
  }, [sign]);

  return (
    <div className="mt-2">
      {wallets.length > 1 && phase === "idle" ? (
        <div className="flex flex-wrap gap-2">
          {wallets.map((w) => (
            <button
              key={w.info.uuid}
              type="button"
              onClick={() => sign(w)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-900/15 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:border-emerald-700"
            >
              {w.info.icon ? <img src={w.info.icon} alt="" className="h-4 w-4" /> : null}
              Pay with {w.info.name}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={phase === "finding" || phase === "signing"}
          className="inline-flex items-center rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {phase === "finding"
            ? "Looking for a wallet…"
            : phase === "signing"
              ? "Waiting for your wallet…"
              : phase === "done"
                ? "Sign again"
                : "Pay with wallet"}
        </button>
      )}
      {detail ? (
        <p
          className={`mt-1.5 text-xs ${phase === "error" ? "text-rose-700" : "text-slate-600"}`}
          role={phase === "error" ? "alert" : "status"}
        >
          {detail}
        </p>
      ) : null}
      <p className="mt-1 text-[11px] text-slate-500">
        Terms come from the door's own 402 — amount, asset, recipient and deadline are never
        typed here. Your key never leaves the wallet.
      </p>
    </div>
  );
}
