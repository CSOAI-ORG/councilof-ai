import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";

type JailIndex = {
  axis: string;
  bench: string;
  dataset: string;
  dataset_url: string;
  n: number;
  accuracy: number;
  separation: string;
  board: string;
  honesty: string;
  cards: Array<{ id: string; axis: string; url: string }>;
};

export default function JailFolder() {
  const [idx, setIdx] = useState<JailIndex | null>(null);
  useEffect(() => {
    document.title = "Jail mill — GoldBank-Detector n=71 TIE | councilof.ai";
    setMetaDescription(
      "Jail is already MEASURED. Folder: axis, goldbank, signed cards. TIE is TIE. Not a second jail score. Not XRPL.",
    );
    fetch("/interop/jail-index.json")
      .then((r) => r.json())
      .then(setIdx)
      .catch(() => setIdx(null));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16" data-testid="jail-folder">
      <p className="font-mono text-xs text-emerald-800">mill: jail · already MEASURED · not XRPL · not SWIFT</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Jail folder</h1>
      <p className="mt-3 text-slate-600">
        GoldBank-Detector, n=71, accuracy 0.5915, TIE, dated 2026-08-18. This page lists the
        surfaces. It does not invent a second jail score.
      </p>
      {idx ? (
        <>
          <ul className="mt-6 space-y-2 font-mono text-sm">
            <li>
              Axis:{" "}
              <a className="text-emerald-800 underline" href="/gspc-scoreboard#jail">
                jail
              </a>{" "}
              · {idx.separation} · n={idx.n}
            </li>
            <li>
              Bank:{" "}
              <a className="text-emerald-800 underline" href={idx.dataset_url}>
                {idx.dataset}
              </a>
            </li>
            <li>
              Live row:{" "}
              <a className="text-emerald-800 underline" href="/api/gspc?axis=jail">
                GET /api/gspc?axis=jail
              </a>
            </li>
          </ul>
          <h2 className="mt-8 text-lg font-bold">Signed jail cards in the 335-card chain</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 font-mono text-xs">
            {idx.cards.map((c) => (
              <li key={c.id}>
                <a className="text-emerald-800 underline" href={c.url}>
                  {c.id}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-slate-500">{idx.honesty}</p>
        </>
      ) : (
        <p className="mt-6 font-mono text-sm text-slate-500">Loading /interop/jail-index.json</p>
      )}
    </main>
  );
}
