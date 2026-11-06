/**
 * disclosureLab.tsx — LOCAL-ONLY visual harness for the three SeparationDisclosure builds.
 * Never imported by the app; the /about mount ships only the "live" variant. The board read
 * uses the shared hook, whose localhost preview falls back to the live origin (councilof.ai),
 * so the lab shows REAL board data, not fixtures.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import SeparationDisclosure from "@/components/about/SeparationDisclosure";
import "@/styles/index.css";

function Lab() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "2rem 1rem 4rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.4rem", marginBottom: "0.25rem" }}>SeparationDisclosure — variant lab</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Three builds side by side. The live variant reads the shared board feed (localhost → live origin fallback).
      </p>
      <SeparationDisclosure variant="live" defaultOpen />
      <SeparationDisclosure variant="static" defaultOpen />
      <SeparationDisclosure variant="explorer" defaultOpen />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Lab />
  </React.StrictMode>,
);
