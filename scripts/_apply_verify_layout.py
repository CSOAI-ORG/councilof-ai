#!/usr/bin/env python3
from pathlib import Path

p = Path("client/src/components/home/LivingStages.tsx")
text = p.read_text()
start = '        <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">'
end = '        <div className="mt-10 max-w-3xl rounded-2xl border border-emerald-200/70'
i = text.find(start)
j = text.find(end)
if i < 0 or j < 0 or j <= i:
    raise SystemExit(f"verify block markers not found i={i} j={j}")
new = '''        <div className="mt-12 space-y-8">
          <ol className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            {VERIFY_STEPS.map((s) => (
              <li
                key={s.n}
                className="flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 sm:p-6"
              >
                <span className="font-mono text-2xl font-black tabular-nums text-emerald-500">{s.n}</span>
                <div>
                  <h3 className="text-lg font-extrabold leading-snug text-gray-900">{s.h}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-gray-600 sm:text-[15px]">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Landscape under the three cards — unused on the rest of home. */}
          <VideoEmbed
            src="/videos/proving-ground.mp4"
            poster="/videos/proving-ground.jpg"
            title="The Proving Ground — how we test containment"
            caption="The arena, not the signing bench. Containment is tested here; the card you check in the three steps is the signed result. Not a certificate."
            className="max-w-none"
          />
        </div>

'''
p.write_text(text[:i] + new + text[j:])
print("patched verify layout")
