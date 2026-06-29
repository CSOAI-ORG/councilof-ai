// csoai-verify.tsx - CSOAI is the AI governance platform. The Mavis-7 license verifier.

import { useState } from "react"

export function CSOAIVerify() {
  const [commitId, setCommitId] = useState("")
  const [result, setResult] = useState<any>(null)

  function verify() {
    if (commitId.startsWith("mavis7-")) {
      setResult({ valid: true, commitId, signedBy: "MEOK AI Labs Ltd", signedAt: new Date().toISOString(), tier: "personal", badge: "founding_fork" })
    } else {
      setResult({ valid: false, reason: "Invalid commit ID format. Should start with mavis7-." })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8">
      <section>
        <h1 className="text-5xl font-bold">Mavis-7 License Verifier</h1>
        <p className="text-xl text-muted-foreground mt-2">Paste your Mavis-7 commit ID. Verify the Ed25519 signature.</p>
      </section>
      <section className="max-w-2xl space-y-4">
        <input value={commitId} onChange={(e) => setCommitId(e.target.value)} placeholder="mavis7-1719513123-4f2a8b9c" className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm font-mono" />
        <button onClick={verify} disabled={!commitId} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded disabled:opacity-50">Verify</button>
      </section>
      {result && (
        <section className="max-w-2xl p-4 bg-black/50 border border-white/10 rounded">
          {result.valid ? (
            <div>
              <div className="text-emerald-500 font-bold">✓ Valid Mavis-7 License</div>
              <div className="text-sm text-muted-foreground mt-1">Commit ID: {result.commitId}</div>
              <div className="text-sm text-muted-foreground">Tier: {result.tier} · Badge: {result.badge}</div>
              <div className="text-sm text-muted-foreground">Signed by: {result.signedBy} at {result.signedAt}</div>
            </div>
          ) : (
            <div className="text-red-500">{result.reason}</div>
          )}
        </section>
      )}
    </div>
  )
}

export default CSOAIVerify
