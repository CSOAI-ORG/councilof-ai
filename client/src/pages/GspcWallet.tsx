import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { discoverEIP6963, type EIP1193Provider } from "@/lib/x402Wallet";

type Board = { totals?: { lid?: string; public_count?: string } };
type Root = { card_count?: number; signer?: string; merkle_root?: string };
type Corrections = { entries?: unknown[]; corrections?: unknown[] } | unknown[];

const shorten = (v: string) => v.length > 18 ? `${v.slice(0, 8)}…${v.slice(-6)}` : v;
const correctionCount = (v: Corrections | null): number | null => {
  if (Array.isArray(v)) return v.length;
  if (v && typeof v === "object") {
    const o = v as { entries?: unknown[]; corrections?: unknown[] };
    if (Array.isArray(o.entries)) return o.entries.length;
    if (Array.isArray(o.corrections)) return o.corrections.length;
  }
  return null;
};

export default function GspcWallet() {
  const [board, setBoard] = useState<Board | null>(null);
  const [root, setRoot] = useState<Root | null>(null);
  const [corrections, setCorrections] = useState<number | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chain, setChain] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [message, setMessage] = useState("Connect a wallet to inspect actions under the GSPC evidence boundary.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    const read = async <T,>(url: string): Promise<T | null> => {
      try {
        const r = await fetch(url, { signal: c.signal, headers: { accept: "application/json" } });
        return r.ok ? (await r.json()) as T : null;
      } catch { return null; }
    };
    void Promise.all([
      read<Board>("/api/gspc"),
      read<Root>("/root.json"),
      read<Corrections>("/api/corrections"),
    ]).then(([b, r, x]) => {
      setBoard(b);
      setRoot(r);
      setCorrections(correctionCount(x));
    });
    return () => c.abort();
  }, []);

  async function connect() {
    if (busy) return;
    setBusy(true);
    setMessage("Looking for an EIP-6963 wallet…");
    try {
      const detail = await discoverEIP6963(5000);
      if (!detail?.provider) {
        setMessage("No browser wallet announced itself. Unlock MetaMask and try again.");
        return;
      }
      const provider: EIP1193Provider = detail.provider;
      const accounts = await provider.request({ method: "eth_requestAccounts", params: [] }) as string[];
      const chainId = await provider.request({ method: "eth_chainId", params: [] }) as string;
      setWallet(detail.info?.name || "EIP-6963 wallet");
      setAccount(accounts[0] || null);
      setChain(chainId || null);
      setMessage("Connected. Wallet consent is not a GSPC measurement, settlement receipt, or signing authority.");
    } catch (error) {
      const code = (error as { code?: unknown })?.code;
      setMessage(code === 4001
        ? "Connection declined. Nothing was signed or charged."
        : `Wallet connection failed: ${String((error as Error)?.message || error)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>GSPC · Venturi Wallet Guard | Council of AI</title>
        <meta name="description" content="Connect MetaMask to GSPC Venturi: inspect wallet actions before signing while keeping wallet, settlement and measurement authority separate." />
        <link rel="canonical" href="https://councilof.ai/wallet/" />
      </Helmet>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="flex items-center gap-4">
          <img src="/csoai-icon.svg" alt="Council of AI" className="h-14 w-14 rounded-2xl border border-emerald-400/30 bg-white p-2" />
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">GSPC · Venturi · Layer O</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">Inspect before you sign.</h1>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          One wallet edge for the same GSPC evidence system. MetaMask authorizes the wallet action; Layer O keeps the action boundary; Venturi observes the result; GSPC records only what was actually measured.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Live GSPC</p>
            <p className="mt-3 text-lg font-semibold">{board?.totals?.lid || "Reading live board…"}</p>
            <p className="mt-2 font-mono text-xs text-slate-400">{board?.totals?.public_count || "No cached count substituted."}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Current root</p>
            <p className="mt-3 text-3xl font-black tabular-nums">{typeof root?.card_count === "number" ? root.card_count : "—"}</p>
            <p className="mt-2 text-xs text-slate-400">cards reported by the current public root</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Corrections</p>
            <p className="mt-3 text-3xl font-black tabular-nums">{corrections ?? "—"}</p>
            <p className="mt-2 text-xs text-slate-400">append-only public correction records</p>
          </article>
        </div>

        <section className="mt-8 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 sm:p-8" aria-labelledby="wallet-heading">
          <h2 id="wallet-heading" className="text-2xl font-black">MetaMask connection</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            The request asks only for public account access. It never asks for a seed phrase or private key and it does not make MetaMask a GSPC signer.
          </p>
          <button type="button" onClick={() => void connect()} disabled={busy}
            className="mt-5 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
            data-testid="gspc-wallet-connect">
            {busy ? "Connecting…" : account ? "Reconnect MetaMask" : "Connect MetaMask"}
          </button>
          <p className="mt-4 text-sm text-slate-300" role="status">{message}</p>
          {account ? (
            <dl className="mt-5 grid gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="font-semibold text-slate-400">Wallet</dt><dd>{wallet}</dd>
              <dt className="font-semibold text-slate-400">Account</dt><dd className="font-mono">{shorten(account)}</dd>
              <dt className="font-semibold text-slate-400">Chain</dt><dd className="font-mono">{chain}</dd>
              <dt className="font-semibold text-slate-400">Authority</dt><dd>wallet authorization only · not board signing authority</dd>
            </dl>
          ) : null}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Link href="/pay" className="rounded-2xl border border-slate-700 bg-slate-900 p-5 hover:border-emerald-400">
            <p className="font-bold">Open the x402 payment guard →</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Read live 402 terms, inspect amount/network/payTo, approve in the wallet, then keep delivery distinct from settlement.</p>
          </Link>
          <Link href="/gspc-verify" className="rounded-2xl border border-slate-700 bg-slate-900 p-5 hover:border-emerald-400">
            <p className="font-bold">Verify GSPC evidence →</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Verification remains free. VALID, INVALID and UNCHECKABLE stay separate.</p>
          </Link>
        </section>

        <div className="mt-8 rounded-2xl border border-slate-800 p-5 text-sm leading-6 text-slate-400">
          <strong className="text-slate-200">Evidence boundary:</strong> connecting a wallet proves only that the wallet returned the selected public account. A wallet signature is not a GSPC measurement. HTTP delivery is not proof of facilitator settlement. Settlement is not proof of independent demand. Board signing keys never enter the browser wallet.
        </div>
      </section>
    </main>
  );
}
