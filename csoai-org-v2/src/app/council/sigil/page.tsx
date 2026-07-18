import type { Metadata } from "next";
import SigilClient from "./SigilClient";

export const metadata: Metadata = {
  title: "SIGIL Encoder",
  description:
    "Encode and decode CSOAI SIGIL attestations — the compact, deterministic notation for Byzantine council decisions.",
  openGraph: {
    title: "CSOAI SIGIL Encoder",
    description: "Compact cryptographic attestation notation for council decisions.",
  },
  alternates: { canonical: "/council/sigil" },
};

export default function SigilPage() {
  return <SigilClient />;
}
