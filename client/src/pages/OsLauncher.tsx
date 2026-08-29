import { useEffect } from "react";
import { Link } from "wouter";
import {
  BOARD_PANE,
  DOOR_TO_LOBBY,
  DOORS,
  doorFromSearch,
  osLeaveForSearch,
  LOBBY_TO_DOOR,
} from "@/components/os/doors";

export {
  BOARD_PANE,
  DOOR_TO_LOBBY,
  DOORS,
  doorFromSearch,
  osLeaveForSearch,
  LOBBY_TO_DOOR,
};
export type { DoorId } from "@/components/os/doors";

const PAGES: { name: string; href: string; what: string }[] = [
  { name: "Board", href: "/gspc-scoreboard", what: "What’s actually measured. Empty stays empty." },
  { name: "Verify", href: "/gspc-verify", what: "Paste a card. Nothing is sent." },
  { name: "Assess", href: "/assess", what: "Get measured. Free. The card is yours." },
  { name: "Evidence", href: "/methodology", what: "How we grade. No model in the verdict." },
  { name: "Embed", href: "/embed", what: "Self-verifying badge. Measurement, not a mark." },
];

/** /os is a directory of real pages. Not AG-UI. No iframe of /. */
export default function OsLauncher() {
  useEffect(() => {
    document.title = "Tools | councilof.ai";
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16" data-testid="os-directory">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Tools</h1>
      <p className="mt-3 text-slate-600">
        Real pages. Not an agent theatre. Plugin users: see{" "}
        <Link href="/tools" className="font-medium text-emerald-800 hover:underline">
          /tools
        </Link>
        .
      </p>
      <ul className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {PAGES.map((p) => (
          <li key={p.href}>
            <a href={p.href} className="block px-5 py-4 hover:bg-slate-50">
              <div className="font-semibold text-slate-900">{p.name}</div>
              <div className="text-sm text-slate-600">{p.what}</div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
