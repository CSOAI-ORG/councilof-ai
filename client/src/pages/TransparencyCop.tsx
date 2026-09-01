import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { useBoardCount } from "@/lib/boardCount";

/**
 * /transparency-cop — live vs planned for the EU Transparency Code of Practice.
 * Role: marking / provenance / detection TOOL. Not GPAI. C2PA = CR-012 planned.
 * 2-of-3 stamp path = UNCHECKABLE until TUI 1 ceremony. Owner mails Brussels only if this page is true.
 */

export default function TransparencyCop() {
  const board = useBoardCount();

  useEffect(() => {
    document.title = "Transparency Code — detection/verify tool, C2PA planned | Council of AI";
    setMetaDescription(
      "CSOAI Ltd is a free EU-market detection and provenance tool (Ed25519 cards, /gspc-verify). We are not a GPAI model lab. C2PA is planned (CR-012), not shipped. Split-key stamp is UNCHECKABLE until ceremony.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          EU Transparency Code of Practice — what is live
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900">
          Detection and verify. Not a model lab.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          CSOAI Ltd places a <strong>measurement provenance and verification tool</strong> on the
          EU market free of charge:{" "}
          <Link href="/gspc-verify" className="text-emerald-700 underline">
            /gspc-verify
          </Link>
          . Three states: VALID, INVALID, UNCHECKABLE. We do not sign the GPAI Code. We do not
          sign Section 2 (news / deepfakes). Board{" "}
          {board.live ? <strong className="text-gray-900">{board.public_count}</strong> : "from GET /api/gspc"}
          . Empty cells stay empty.
        </p>

        <section className="mt-10 rounded-xl border border-emerald-600/20 bg-white p-5">
          <h2 className="text-base font-extrabold text-gray-900">Live</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] text-gray-600">
            <li>Ed25519 measurement cards (did:web:csoai.org#card-attestation-1)</li>
            <li>Browser verify at /gspc-verify</li>
            <li>HTTP MCP https://councilof.ai/mcp — seven tools (published npm 0.1.0 is four; source 0.1.1 wires seven)</li>
            <li>
              C2PA / CAI conformance: <strong>not live</strong> (claims register CR-012 planned)
            </li>
          </ul>
        </section>

        <section className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="text-base font-extrabold text-amber-950">Planned — do not tick as shipped</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] text-amber-950">
            <li>C2PA manifests (CR-012). HMAC text is not C2PA.</li>
            <li>
              Split-key 2-of-3 (`#board-attestation-2`): <strong>STAMP=UNCHECKABLE</strong> until
              ceremony. Do not print SIGNED for that path.
            </li>
            <li>Machine-readable marks on generative media we do not emit — we are not that provider.</li>
          </ul>
        </section>

        <p className="mt-8 text-sm text-gray-500">
          <Link href="/doctrine" className="text-emerald-700 underline">
            Doctrine
          </Link>
          {" · "}
          <Link href="/claims-register" className="text-emerald-700 underline">
            CR-012
          </Link>
          . Owner signs the Commission form only if this page is true.
        </p>
      </div>
    </div>
  );
}
