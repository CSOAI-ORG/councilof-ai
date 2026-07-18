"use client";
import { useState } from "react";

export default function VerifyDemo() {
  const [hash, setHash] = useState("d5e714244f819eca0389a4285d9dd15b6b77df57");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setOut("Verifying...");
    try {
      const r = await fetch(`/api/v1/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_hash: hash }),
      });
      const j = await r.json();
      setOut(JSON.stringify(j, null, 2));
    } catch (e: any) {
      setOut(`Error: ${e?.message || "network"}`);
    }
    setBusy(false);
  }

  return (
    <div className="verify-demo">
      <label style={{ display: "block", color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>
        Try it — paste a SHA-3/512 hash
      </label>
      <input
        type="text"
        value={hash}
        onChange={(e) => setHash(e.target.value)}
        placeholder="d5e714244f819eca0389a4285d9dd15b6b77df57..."
      />
      <div className="actions">
        <button className="btn btn-primary" onClick={run} disabled={busy}>
          {busy ? "Verifying..." : "Verify →"}
        </button>
        <a
          className="btn btn-secondary"
          href={`https://verify.openpatent.ai/${hash.slice(0, 16)}`}
          target="_blank"
          rel="noopener"
        >
          Open verify page
        </a>
      </div>
      {out && <pre className="out">{out}</pre>}
    </div>
  );
}
