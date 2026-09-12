import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /owasp-agentic — the public OWASP ASI01–ASI10 → Council of AI controls
 * mapping. Content is taken from the owner-approved crosswalk
 * (docs/owasp-agentic-crosswalk.md, filed 2026-09-01). Internal shorthand in
 * that document is rendered here in plain public copy with the meaning kept.
 *
 * NON-NEGOTIABLES (from the source doc, kept verbatim in spirit):
 *  - Informative crosswalk only. Not an OWASP product. Not endorsed by OWASP.
 *  - ASI ids are NOT GSPC axes. Mapping a risk to a control does not mean the
 *    control fully covers the risk.
 *  - No board count is typed on this page.
 */

const SOURCE_URL =
  "https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/";

interface MappingRow {
  asi: string;
  risk: string;
  controls: string;
  surface: string;
}

const MAPPING: MappingRow[] = [
  {
    asi: "ASI01",
    risk: "Agent Goal Hijack",
    controls:
      "Least-privilege tools (only declared capabilities, no undeclared agency) · signed measurement cards only · a statistical tie is reported as a tie, never as an invented win that redirects scope",
    surface: "art5-safeguard, affect and jail axes on the public board (cite, not grade)",
  },
  {
    asi: "ASI02",
    risk: "Tool Misuse & Exploitation",
    controls:
      "Least-privilege tools · halt on any unsigned leaf — an unsigned artifact is never promoted",
    surface: "conformance axis (tool-use bench) · the MCP door",
  },
  {
    asi: "ASI03",
    risk: "Identity & Privilege Abuse",
    controls:
      "Signing keys never live on workstations or laptops · halt closed if the board signing key is absent · inter-agent messages must verify",
    surface: "did:web:csoai.org at /.well-known/did.json · the agent card",
  },
  {
    asi: "ASI04",
    risk: "Agentic Supply Chain Vulnerabilities",
    controls:
      "Signed cards only · the public root is immutable — unsigned leaves do not rewrite history · halt on unsigned leaf",
    surface: "frozen question banks on Hugging Face · methodology DOI · per-page site attestation",
  },
  {
    asi: "ASI05",
    risk: "Unexpected Code Execution",
    controls:
      "Jail containment is measured as a floor, not assumed · least-privilege tools",
    surface: "jail axis — measured, leader statistically tied (a tie is not a win)",
  },
  {
    asi: "ASI06",
    risk: "Memory & Context Poisoning",
    controls:
      "Signed cards only · halt when the signed tree and the published tree diverge · when living facts move, re-measure — never freeze a stale claim",
    surface: "ingest gate on new evidence · live GET endpoints over frozen tables",
  },
  {
    asi: "ASI07",
    risk: "Insecure Inter-Agent Communication",
    controls: "Signed inter-agent messages · least-privilege tools",
    surface: "the published agent card and discovery manifests",
  },
  {
    asi: "ASI08",
    risk: "Cascading Failures",
    controls:
      "Halt on tree divergence · halt on unsigned leaf · no cascade of unearned wins — a tie stays a tie",
    surface: "swarm axis · orchestration results reported as measurements, not engines",
  },
  {
    asi: "ASI09",
    risk: "Human-Agent Trust Exploitation",
    controls:
      "Never certify · empty slots stay empty and are published as empty · a tie is a tie",
    surface: "the scoreboard's honesty rules · verification is free for everyone, forever",
  },
  {
    asi: "ASI10",
    risk: "Rogue Agents",
    controls:
      "Operational keys stay off workstations · halt closed on missing key · drift triggers re-measurement and re-attestation · signed cards only",
    surface: "the corrections ledger records every caught divergence, including ours",
  },
];

export default function OwaspAgentic() {
  useEffect(() => {
    document.title =
      "OWASP Agentic Top 10 — the public measured mapping | Council of AI";
    setMetaDescription(
      "OWASP Top 10 for Agentic Applications (ASI01–ASI10) mapped to published Council of AI measurement controls. Informative crosswalk: not an OWASP product, not endorsed by OWASP, ASI ids are not GSPC axes.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Standards mapping · published 2026-09-12
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900">
          OWASP Agentic Top 10, mapped to controls we actually run.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          The{" "}
          <a className="text-emerald-700 underline" href={SOURCE_URL}>
            OWASP Top 10 for Agentic Applications (2026)
          </a>{" "}
          names ten agentic risks, ASI01–ASI10. This page maps each one to the measurement
          controls this estate operates in production — the same controls applied to our own
          signed cards, roots and keys. To our knowledge this is the first public commercial
          mapping of the ASI list; if an earlier one exists, tell us and we will cite it in{" "}
          <a className="text-emerald-700 underline" href="/api/corrections">
            the corrections ledger
          </a>
          .
        </p>

        <section className="mt-8 rounded-xl border border-amber-500/30 bg-amber-50 p-5">
          <h2 className="text-base font-extrabold text-gray-900">What this page is not</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-gray-700">
            <li>Not an OWASP product, and not endorsed by OWASP. Cite OWASP for the risks; cite us only for our own controls.</li>
            <li>ASI ids are <strong>not</strong> GSPC axes and are not on our board. Mapping a risk to a control does not mean the control fully covers the risk.</li>
            <li>This is an informative crosswalk — a measurement of our own practice, never a certification of anyone.</li>
          </ul>
        </section>

        <div className="mt-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-[15px] leading-relaxed">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">ASI</th>
                <th className="px-4 py-3">Risk (OWASP title)</th>
                <th className="px-4 py-3">Our controls / halts</th>
                <th className="px-4 py-3">Related public surface</th>
              </tr>
            </thead>
            <tbody>
              {MAPPING.map((row) => (
                <tr key={row.asi} className="border-b border-gray-100 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-bold text-emerald-700">
                    {row.asi}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{row.risk}</td>
                  <td className="px-4 py-3 text-gray-600">{row.controls}</td>
                  <td className="px-4 py-3 text-gray-600">{row.surface}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-10 text-sm text-gray-500">
          Measurement, not certification.{" "}
          <Link href="/doctrine" className="text-emerald-700 underline">
            Doctrine &amp; refusals
          </Link>
          {" · "}
          <Link href="/honesty" className="text-emerald-700 underline">
            Honesty gate
          </Link>
          {" · "}
          <Link href="/board" className="text-emerald-700 underline">
            The measurement board
          </Link>
        </p>
      </div>
    </div>
  );
}
