import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MunderDuel from "./components/MunderDuel";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="min-h-screen bg-slate-950 px-3 py-6 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Coliseum links" className="flex flex-wrap gap-5 text-sm text-emerald-300">
          <a href="https://councilof.ai/dashboard?tab=space" className="underline">Open this game in Council OS</a>
          <a href="https://councilof.ai/board/" className="underline">Public GSPC board</a>
          <a href="https://api.meok.ai/gspc/board" className="underline">Existing public board feed</a>
          <a href="https://github.com/CSOAI-ORG/councilof-ai" className="underline">Canonical source and MIT licence</a>
        </nav>
        <MunderDuel />
        <footer className="mt-5 text-xs text-slate-400">
          Generated from the same Council OS build. GSPC measurements remain separate from local game points.
        </footer>
      </div>
    </main>
  </StrictMode>,
);
