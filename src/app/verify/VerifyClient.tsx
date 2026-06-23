"use client";

import { useState } from "react";

const SAMPLE_CERT = "WDG-2026-EUAIA-7A3F9C";

export default function Verify() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"idle" | "valid" | "invalid">("idle");

  const handleVerify = () => {
    const value = input.trim();
    if (!value) {
      setResult("invalid");
      return;
    }
    // Demo verification: accept any non-empty input that looks like a cert ID or DID.
    const looksLikeCert = /^[A-Z0-9_-]+$/i.test(value) || value.startsWith("did:csoai:");
    setResult(looksLikeCert ? "valid" : "invalid");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="mb-4 text-5xl font-black uppercase tracking-tighter text-emerald-400">
          Verification Engine
        </h1>
        <p className="mb-12 text-lg text-slate-400">
          Verify CSOAI Watchdog Certificates and agent identities. Enter a cert ID or DID below.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`e.g. ${SAMPLE_CERT}`}
            className="flex-1 border-none bg-transparent px-6 py-4 font-mono text-white outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-8 py-4 font-bold text-slate-950 transition hover:bg-emerald-600"
          >
            Verify
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-500">
          Try a sample cert ID: <code className="text-emerald-400">{SAMPLE_CERT}</code>
        </p>

        {result === "valid" && (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-left">
            <p className="mb-2 text-sm font-black uppercase tracking-widest text-emerald-400">Valid format</p>
            <p className="text-slate-300">
              This cert ID matches the CSOAI format. Live verification against the attestation registry
              requires a backend integration. If you need to verify a real certificate, email{" "}
              <a className="text-emerald-400 hover:underline" href="mailto:hello@csoai.org">
                hello@csoai.org
              </a>{" "}
              or use the public API when available.
            </p>
          </div>
        )}

        {result === "invalid" && (
          <div className="mt-8 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-left">
            <p className="mb-2 text-sm font-black uppercase tracking-widest text-rose-400">Invalid format</p>
            <p className="text-slate-300">
              The entered value does not look like a CSOAI cert ID or DID. Cert IDs use letters, numbers,
              hyphens and underscores. DIDs start with <code>did:csoai:</code>.
            </p>
          </div>
        )}

        <div className="mt-12 rounded-3xl border border-white/5 bg-slate-900/50 p-8 text-left text-sm leading-relaxed text-slate-500">
          <strong className="mb-2 block text-[10px] uppercase tracking-widest text-white">
            How verification works
          </strong>
          CSOAI Watchdog Certificates are signed with Ed25519 and include a public verify URL. A verifier can
          fetch the certificate payload, check the signature against the published public key, and confirm the
          certificate has not been revoked. This page is a format checker; full cryptographic verification is
          available through the CSOAI API and MCP servers.
        </div>
      </div>
    </div>
  );
}
