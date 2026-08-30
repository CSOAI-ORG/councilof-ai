#!/usr/bin/env python3
"""One-shot: insert understand ticks into ToolStack and LivingStages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def after(path: Path, needle: str, extra: str) -> None:
    text = path.read_text()
    if extra.strip() in text:
        print(f"already in {path.name}")
        return
    if needle not in text:
        raise SystemExit(f"after-needle missing in {path.name}: {needle[:90]!r}")
    path.write_text(text.replace(needle, needle + extra, 1))
    print(f"after {path.name}")


def before(path: Path, marker: str, extra: str) -> None:
    text = path.read_text()
    if extra.strip() in text:
        print(f"already in {path.name}")
        return
    if marker not in text:
        raise SystemExit(f"before-marker missing in {path.name}: {marker[:90]!r}")
    path.write_text(text.replace(marker, extra + marker, 1))
    print(f"before {path.name}")


stack = ROOT / "client/src/components/home/ToolStack.tsx"
after(
    stack,
    'import type { LobbyTabId } from "@/components/lobby/tabs";\n',
    'import HomeUnderstand from "./HomeUnderstand";\n',
)
after(
    stack,
    "  /** A standing condition or limit on the tool. Shown on the tile, never hidden. */\n  note?: string;\n",
    "  /** Short ticks a stranger can scan. Benefits, never invented counts. */\n  ticks: string[];\n",
)

PAINS = [
    (
        "Otherwise each answer lives on a different page, and nothing you find on one is usable on the next.",
        [
            "Board, verify, get measured and the evidence pack in one window.",
            "No second tab and no second login.",
            "Every pane is a real page you can open today.",
        ],
    ),
    (
        "Otherwise you compare suppliers on scorecards that quietly leave out the tests they did badly on.",
        [
            "A filled cell is a measurement. A dash is honest emptiness.",
            "Counts come from living GET /api/gspc — never typed into the page.",
            "A TIE stays a TIE. It is never dressed up as a win.",
        ],
    ),
    (
        "Otherwise checking somebody's AI claim means trusting the company that made the claim.",
        [
            "Your browser recomputes the hash and checks Ed25519.",
            "Nothing is sent to us. Nothing needs our permission.",
            "Three states only: VALID · INVALID · UNCHECKABLE.",
        ],
    ),
    (
        "Otherwise you hand a buyer a policy document where they asked for evidence.",
        [
            "Frozen, published tests — the target does not move after you sit.",
            "You keep the signed card. Publishing it is your decision.",
            "Slots we could not fill stay empty and are named.",
        ],
    ),
    (
        "GPAI duties have been in force since 2 August 2025, and most providers have only their own paperwork to show for them.",
        [
            "Live rows that exist, the banks they resolve to, and the gaps.",
            "Gaps are named rather than skipped.",
            "Independent evidence — not a conformity mark, and not legal advice.",
        ],
    ),
    (
        "Otherwise the people reading your site still have to take your word for the result.",
        [
            "A badge that goes green only when the bytes are true.",
            "Each reader's browser re-checks the signature.",
            "Built only from what is actually on the board.",
        ],
    ),
    (
        "Otherwise AI exposure is priced off a questionnaire the applicant filled in about itself, and nothing updates between binding and renewal.",
        [
            "Measured, empty and reported figures stay in three separate columns.",
            "Nothing is blended into a single number an underwriter could mistake for a rating.",
            "We measure. We do not price risk.",
        ],
    ),
    (
        "Otherwise the systems that actually run a bond desk or a claims book sit outside every AI measurement anybody publishes.",
        [
            "One row per instrument, each with its own item count.",
            "COBOL copybook and underwriting-rule rows sit beside the public board.",
            "A specialist register is still measurement — never a certificate.",
        ],
    ),
    (
        "Otherwise a harm disappears into a supplier's private support queue and nobody outside it ever learns it happened.",
        [
            "A public form for AI behaviour that looks wrong.",
            "You get a signed acknowledgement of exactly what you filed.",
            "Whatever we act on is measured and signed like everything else here.",
        ],
    ),
]

text = stack.read_text()
for pain, ticks in PAINS:
    block = "    ticks: [\n" + "".join(f'      "{t}",\n' for t in ticks) + "    ],\n"
    needle = f'      "{pain}",\n'
    if block.strip() in text:
        continue
    if needle not in text:
        raise SystemExit(f"pain needle missing: {pain[:70]}")
    text = text.replace(needle, needle + block, 1)
stack.write_text(text)
print("tool ticks inserted")

after(
    stack,
    '          <p className="t-body text-muted-foreground">{tool.pain}</p>\n',
    "          <HomeUnderstand items={tool.ticks} />\n",
)
after(
    stack,
    "          result, and leave empty cells empty. Nine doors, each a real page.\n        </p>\n",
    """        <div className=\"mx-auto mt-8 max-w-3xl rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-5 py-4\">
          <HomeUnderstand
            title=\"Why these nine, and not a catalogue\"
            items={[
              \"Each tile opens a page that exists today. A tool with no destination is not on this band.\",
              \"Empty cells stay empty. We do not invent a figure to fill a gap.\",
              { kind: \"usp\", text: \"We measure. We do not sell a rank, a certificate, or a placement.\" },
            ]}
          />
        </div>

""",
)

living = ROOT / "client/src/components/home/LivingStages.tsx"
before(
    living,
    '        <Cta href="/gspc-verify" label="Verify a card now" secondary={{ href: "/api-docs", label: "Read the API docs" }} />\n',
    """        <div className=\"mt-10 max-w-3xl rounded-2xl border border-emerald-200/70 bg-emerald-50/50 px-5 py-4\">
          <Points
            points={[
              { tag: \"benefit\", text: \"The whole check runs offline — no account and no permission\" },
              { tag: \"benefit\", text: \"Pin our key first. A card checked against the key it ships with only proves it is self-consistent\" },
              { tag: \"usp\", text: \"You recompute the same Ed25519 signature over the same hash chain we published\" },
            ]}
          />
        </div>

""",
)
before(
    living,
    '      <p className=\"measure mt-5 rounded-2xl border border-gray-200 border-l-4 border-l-gray-400 bg-gray-50 p-5 text-[15px] leading-[1.65] text-gray-700\">\n',
    """      <Points
        points={[
          { tag: \"pain\", text: \"Most measurement bodies quietly reword a claim that did not hold\" },
          { tag: \"benefit\", text: \"The ledger is append-only — entries are never edited or deleted\" },
          { tag: \"usp\", text: \"We retracted our own consensus claim (DR-0007) rather than dress it up\" },
        ]}
      />
""",
)
before(
    living,
    "      <p className=\\\"mt-4 text-xs leading-relaxed text-gray-500\\\">\\n        Where a date is genuinely disputed, the feed records the dispute rather than resolving it\\n",
    """      <Points
        points={[
          { tag: \"pain\", text: \"A one-off stamp starts going stale the day the statute moves\" },
          { tag: \"benefit\", text: \"Old cards stay. History is append-only — nothing is overwritten\" },
          { tag: \"benefit\", text: \"A disputed date is recorded as a dispute, not silently resolved\" },
          { tag: \"usp\", text: \"When a provision changes we re-measure and issue a delta card\" },
        ]}
      />
""",
)

print("OK")
