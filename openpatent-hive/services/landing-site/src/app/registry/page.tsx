/**
 * openpatent.ai — Public Invention Registry
 * The hive patents its own work: real tamper-evident invention disclosures.
 * Ported from the static openpatent-ai-deploy landing (real OPATENT records,
 * SIGIL hash-chained, un-backdatable). Not filed patents — the evidence a filing rests on.
 */
import type { Metadata } from "next";
import { Header, Footer } from "../components/chrome";

export const metadata: Metadata = {
  title: "Invention Registry — openpatent.ai | the hive that patents its own work",
  description:
    "openpatent.ai — the hive that patents its own work. AI-powered invention documentation with EU AI Act and AI governance attestation support — MEOK AI Labs. Tamper-evident invention registry, SIGIL hash-chained, proofof.ai / csoai.org verifiable.",
};

type OpatentRecord = {
  id: string;
  title: string;
  conceived: string;
  lane: string;
  kind: string;
  fingerprint: string;
  sigil: string;
  claims: string[];
};

// Real OPATENT records from the hive's tamper-evident ledger (chain intact · 177 records).
const RECORDS: OpatentRecord[] = [
  {
    id: "OPATENT-5526A1C43E98",
    title: "Operating-as-patenting: hive work auto-recorded as tamper-evident invention disclosure",
    conceived: "2026-06-16T13:28:35Z",
    lane: "meok hive",
    kind: "patent-claim",
    fingerprint: "fa102d1e55985544c65477cda0014922ae662aaa2016cce1…",
    sigil: "f1cdea0a31b180c2",
    claims: [
      "auto-capture of agent outputs as invention disclosures",
      "SIGIL hash-chain conception-date anchor",
      "BFT novelty pre-screen + proofof.ai attestation",
    ],
  },
  {
    id: "OPATENT-6904358F5A6F",
    title: "Regulation-grounded, verifier-gated compliance generation with factual citation check",
    conceived: "2026-06-16T13:28:35Z",
    lane: "meok hive",
    kind: "patent-claim",
    fingerprint: "20c63c641933b57209685a96bb301c5e51fdec13264a45ce…",
    sigil: "1047e72fd0a04fdd",
    claims: [
      "pre-generation regulation grounding",
      "factual citation_correct truth gate",
      "verifier-gated best-of-N over grounded generation",
    ],
  },
  {
    id: "OPATENT-F8B757EDF6A0",
    title: "BFT-governed mixture-of-experts answer selection with safety veto",
    conceived: "2026-06-16T13:28:35Z",
    lane: "meok hive",
    kind: "patent-claim",
    fingerprint: "565cfaa1451912059eae6343a2aec527792c6ad1a1a94b0a…",
    sigil: "34beca62d8efe345",
    claims: [
      "safety-veto + quality-vote council",
      "BFT quorum over agent lenses",
      "per-decision hash-chained audit",
    ],
  },
  {
    id: "OPATENT-2CE727979EEA",
    title: "Hive/caste architecture: one engine parameterised by per-domain config",
    conceived: "2026-06-16T13:28:35Z",
    lane: "meok hive",
    kind: "patent-claim",
    fingerprint: "0660845adcbae00f7184660726aa9a14a4f76764f671c72c…",
    sigil: "1d83dd84e57fdc5f",
    claims: [
      "config-parameterised shared agent engine",
      "King-to-Queen-to-hive routing",
      "honeycomb cross-hive memory",
    ],
  },
  {
    id: "OPATENT-72433701D46C",
    title: "Pheromone-evaporative swarm memory for multi-agent systems",
    conceived: "2026-06-16T13:28:35Z",
    lane: "meok hive",
    kind: "patent-claim",
    fingerprint: "b80824427312faa551b7f26d8c6557bdf9f85afbd7148526…",
    sigil: "ed6d1f573605c962",
    claims: [
      "type-keyed evaporative TTL memory",
      "pheromone signal classes with distinct half-lives",
      "self-pruning swarm state",
    ],
  },
  {
    id: "OPATENT-048A3CCB60B9",
    title: "Provably self-improving agent loop on verifiable domains",
    conceived: "2026-06-16T08:49:09Z",
    lane: "meok hive",
    kind: "method",
    fingerprint: "4c964e50e752d20e1634a3ee85724b35f75c485fe8151a85…",
    sigil: "bbb10e060621ef7f",
    claims: [
      "external-verifier gate (not self-judge)",
      "held-out plateau stopping rule",
      "ensemble selection with effective-sample accounting",
    ],
  },
  {
    id: "OPATENT-D112BCF91F7F",
    title: "Hive that patents its own work via hash-chained attestation",
    conceived: "2026-06-16T08:49:09Z",
    lane: "meok hive",
    kind: "method",
    fingerprint: "2aebeb13fb5280f53d952fb088f69c1a1f6d7cd3464e69f9…",
    sigil: "feda0a95a0a96061",
    claims: [
      "auto-capture of agent outputs as invention disclosures",
      "SIGIL hash-chain conception-date anchor",
      "BFT council patentability pre-screen",
    ],
  },
  {
    id: "OPATENT-2E4934EC2183",
    title: "Regulation-grounded verifier-gated compliance generation",
    conceived: "2026-06-16T08:49:09Z",
    lane: "meok hive",
    kind: "method",
    fingerprint: "d77de2628d09ee30b4cf789dd26ca94b2d525127e9a9768f…",
    sigil: "70e7adc81fd02ef6",
    claims: [
      "regulation-KB grounding injected pre-generation",
      "factual citation_correct truth gate",
      "verifier-gated best-of-N selection",
    ],
  },
  {
    id: "OPATENT-6BA4398F50F2",
    title: "Verified self-improving compliance hive",
    conceived: "2026-06-16T08:19:50Z",
    lane: "meok hive",
    kind: "invention",
    fingerprint: "61d9939e1d2fda7a06d629e192f2adfe160be483e191bb5b…",
    sigil: "0a9de8b51714cb23",
    claims: [
      "regulation-grounded generation + verifier-gated best-of-N",
      "factual citation_correct truth gate (catches wrong article numbers)",
      "SIGIL hash-chained audit anchor per answer",
      "auto-capture of hive outputs into a tamper-evident IP ledger",
    ],
  },
];

const MUT = "#5b6478";
const AC = "#2563eb";

export default function RegistryPage() {
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <Header />

      {/* Hero */}
      <header
        style={{
          background: "linear-gradient(135deg,#0b1020,#1e293b)",
          color: "#fff",
          padding: "3rem 1.5rem 2.5rem",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ color: "#93c5fd", fontWeight: 600, letterSpacing: ".04em" }}>
            openpatent.ai · MEOK AI Labs
          </div>
          <h1 style={{ margin: ".2rem 0", fontSize: "2rem" }}>
            The hive patents its own work — as it works.
          </h1>
          <p style={{ color: "#cbd5e1", maxWidth: "60ch", lineHeight: 1.5 }}>
            Every artifact MEOK&apos;s agent hive produces is captured as a tamper-evident
            invention disclosure: a content fingerprint, a hash-chained cryptographic receipt
            (un-backdatable), and an optional publicly-verifiable proofof.ai / csoai.org certificate.
            Defensible priority &amp; prior-art evidence — conception date and exact content, provable.
          </p>
          <div
            style={{
              display: "inline-block",
              background: "#064e3b",
              color: "#6ee7b7",
              padding: ".3rem .7rem",
              borderRadius: ".5rem",
              fontSize: ".85rem",
              marginTop: "1rem",
            }}
          >
            ✅ chain intact · 177 records
          </div>
        </div>
      </header>

      {/* Records */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "0 1.5rem 2rem", background: "#f7f8fb" }}>
        <p style={{ color: MUT, fontSize: ".9rem", marginTop: "1.5rem", lineHeight: 1.5 }}>
          Each entry&apos;s SIGIL receipt is chained to the previous one — the record cannot be altered
          or back-dated without breaking the chain. This is an inventor&apos;s-notebook standard, automated.{" "}
          <b>Not a filed patent</b> — the evidence a filing rests on.
        </p>

        {RECORDS.map((r) => (
          <div
            key={r.id}
            style={{
              background: "#fff",
              border: "1px solid #e5e9f0",
              borderRadius: ".8rem",
              padding: "1.2rem 1.4rem",
              margin: "1rem 0",
              boxShadow: "0 1px 3px rgba(0,0,0,.04)",
              color: "#0b1020",
            }}
          >
            <div style={{ fontFamily: "ui-monospace,monospace", color: AC, fontWeight: 700, fontSize: ".85rem" }}>
              {r.id}
            </div>
            <h3 style={{ margin: ".3rem 0 .5rem" }}>{r.title}</h3>
            <div style={{ color: MUT, fontSize: ".85rem" }}>
              conceived <b>{r.conceived}</b> · {r.lane} · {r.kind}
            </div>
            <div style={{ fontSize: ".78rem", color: MUT, margin: ".3rem 0" }}>
              fingerprint sha256: <code style={{ background: "#eef2f7", padding: ".05rem .3rem", borderRadius: ".3rem" }}>{r.fingerprint}</code>
            </div>
            <div style={{ fontSize: ".78rem", color: MUT, margin: ".3rem 0" }}>
              SIGIL receipt: <code style={{ background: "#eef2f7", padding: ".05rem .3rem", borderRadius: ".3rem" }}>{r.sigil}</code> ← chained, un-backdatable
            </div>
            <ul style={{ margin: ".6rem 0 .4rem 1.1rem", fontSize: ".9rem" }}>
              {r.claims.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <div style={{ fontSize: ".82rem", marginTop: ".5rem", color: MUT }}>
              SIGIL-anchored (free proof)
            </div>
          </div>
        ))}

        <p style={{ color: MUT, fontSize: ".8rem", padding: "1.5rem 0 0", textAlign: "center" }}>
          openpatent.ai — powered by MEOK ONE · SIGIL hash-chain · proofof.ai · csoai.org
          <br />
          Tamper-evident invention registry. © 2026 MEOK AI Labs.
        </p>
      </main>

      <Footer />
    </div>
  );
}
