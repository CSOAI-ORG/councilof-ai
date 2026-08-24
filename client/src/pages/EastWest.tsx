/**
 * /east-west — one signed measurement, four regimes mapped.
 * Mapping is not a determination. Scores are never sold. Regulators free forever.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";
import { openLobby } from "@/lib/lobbyLink";
import { verifyHashedEnvelope } from "@/lib/eastWestCrypto";
import {
  mintLedgerRow,
  loadLocalLedger,
  publishedLedger,
  type LedgerRow,
} from "@/lib/eastWestLedger";
import {
  CARD_BODY,
  CHINA_ROWS,
  CLOCKS,
  CLAIMS,
  CROSSWALK_BODY,
  DETERMINATION_BANNER,
  DESKS,
  EAST_WEST_PITCH,
  EU_ROWS,
  freezeEastWest,
  GRAMMAR,
  ILLINOIS_ROWS,
  METHODOLOGY,
  OWNER_BLOCKS,
  PACK_NOT,
  PACKS,
  PRESS_DRAFTS,
  PRICING_DOCTRINE,
  BUYER_SCREEN,
  LICENSE_TERMS,
  ONE_PAGERS,
  X402_FALLBACK,
  COMMERCE_FIREWALL,
  UK_ROWS,
  US_HONESTY,
  type CrosswalkCell,
  type FrozenEastWest,
} from "@/data/eastWest";

const NAV = [
  ["", "Flagship"],
  ["crosswalk", "Crosswalk"],
  ["verify", "Verify"],
  ["packs", "Packs"],
  ["challenge", "Challenge"],
  ["desks", "Desks"],
  ["ledger", "Ledger"],
  ["pricing", "Pricing"],
  ["buyers", "Buyer screen"],
  ["license", "License"],
  ["briefs", "One-pagers"],
  ["pay", "Pay rail"],
  ["method", "Method"],
  ["not", "What this is not"],
  ["press", "Press drafts"],
] as const;

function Banner() {
  return (
    <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
      {DETERMINATION_BANNER}
    </p>
  );
}

function Table({ rows, caption }: { rows: CrosswalkCell[]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-emerald-500/20">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-emerald-500/10 text-[11px] uppercase tracking-wide text-emerald-300/80">
          <tr>
            <th className="px-3 py-2">Provision</th>
            <th className="px-3 py-2">Axes</th>
            <th className="px-3 py-2">Citation</th>
            <th className="px-3 py-2">Mapping</th>
            <th className="px-3 py-2">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-emerald-500/10 align-top">
              <td className="px-3 py-2 font-medium text-emerald-50">{r.provision}</td>
              <td className="px-3 py-2 font-mono text-[12px] text-emerald-200/80">{r.axis}</td>
              <td className="px-3 py-2">
                <a className="text-emerald-300 underline" href={r.sourceUrl} target="_blank" rel="noreferrer">
                  {r.citation}
                </a>
                {r.effective ? <div className="text-[11px] text-amber-200/80">effective {r.effective}</div> : null}
              </td>
              <td className="px-3 py-2 font-mono text-[12px] uppercase text-emerald-300">{r.mapping}</td>
              <td className="px-3 py-2 text-emerald-100/70">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EastWest() {
  const [location] = useLocation();
  const section = (location.startsWith("/challenge") ? "/east-west/challenge" : location).split("/")[2] ?? "";
  const deskId = location.match(/^\/east-west\/desks\/([^/]+)/)?.[1];
  const current = deskId ? "desks" : section;

  const [frozen, setFrozen] = useState<FrozenEastWest | null>(null);
  const [paste, setPaste] = useState("");
  const [verdict, setVerdict] = useState<{
    ok: boolean;
    lines: { label: string; ok: boolean | null; detail: string }[];
  } | null>(null);
  const [localRows, setLocalRows] = useState<LedgerRow[]>([]);
  const [challengeText, setChallengeText] = useState("");
  const [challengeReceipt, setChallengeReceipt] = useState<LedgerRow | null>(null);
  const published = useMemo(() => publishedLedger(), []);

  useEffect(() => {
    document.title = "East-West — one signed measurement, four regimes mapped | CSOAI";
    freezeEastWest().then(setFrozen);
    setLocalRows(loadLocalLedger());
  }, []);

  useEffect(() => {
    if (frozen && !paste) setPaste(JSON.stringify(frozen.card, null, 2));
  }, [frozen, paste]);

  const runVerify = async (raw: string) => {
    if (!frozen) return;
    try {
      const obj = JSON.parse(raw);
      const v = await verifyHashedEnvelope(obj, { expectedCrosswalkHash: frozen.crosswalkHash });
      setVerdict(v);
      if (v.ok) {
        await mintLedgerRow({
          type: "verify-events",
          partyClass: "stranger",
          subject: String(obj.id ?? "card"),
          artifactHash: frozen.card.contentHash,
          outcome: "VALID",
        });
        setLocalRows(loadLocalLedger());
      }
    } catch {
      setVerdict({ ok: false, lines: [{ label: "Parse", ok: false, detail: "Not valid JSON." }] });
    }
  };

  const downloadPack = async (id: string) => {
    if (!frozen) return;
    const pack = {
      kind: "csoai.east-west-pack/0.1",
      format: id,
      banner: DETERMINATION_BANNER,
      not: PACK_NOT,
      card: frozen.card,
      crosswalk: frozen.crosswalk,
      method: METHODOLOGY,
    };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `east-west-${id}-pack.json`;
    a.click();
    URL.revokeObjectURL(url);
    await mintLedgerRow({
      type: "evidence-pack-fetch",
      partyClass: "stranger",
      subject: id,
      artifactHash: frozen.crosswalkHash,
      outcome: "LOCAL_DOWNLOAD",
    });
    setLocalRows(loadLocalLedger());
  };

  const submitChallenge = async () => {
    if (!challengeText.trim() || !frozen) return;
    const row = await mintLedgerRow({
      type: "challenge-resolution",
      partyClass: "measured-subject",
      subject: frozen.card.id,
      artifactHash: frozen.card.contentHash,
      outcome: `RECEIVED: ${challengeText.trim().slice(0, 240)}`,
    });
    setChallengeReceipt(row);
    setLocalRows(loadLocalLedger());
    setChallengeText("");
  };

  return (
    <CouncilOsPageShell title="East-West" subtitle={EAST_WEST_PITCH} className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          Cross-jurisdiction measurement · {GRAMMAR.product} · {GRAMMAR.count}
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          One signed measurement.{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
            Every regime it touches, mapped.
          </span>
        </h1>
        <p className="max-w-3xl text-lg text-emerald-100/80">{EAST_WEST_PITCH}</p>

        <nav className="flex flex-wrap gap-2" aria-label="East-West">
          {NAV.map(([id, label]) => {
            const href = id ? `/east-west/${id}` : "/east-west";
            const on = current === id;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  on
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-50"
                    : "border-emerald-500/20 text-emerald-200/70 hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {!section && (
          <div className="space-y-8">
            <Banner />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
                <div className="text-[11px] uppercase tracking-wide text-emerald-300/70">Grammar</div>
                <div className="mt-1 text-lg font-bold">{GRAMMAR.count}</div>
                <p className="mt-2 text-sm text-emerald-100/70">Jail is UNMEASURED on this credential.</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
                <div className="text-[11px] uppercase tracking-wide text-emerald-300/70">Card</div>
                <div className="mt-1 font-mono text-sm">{frozen?.card.id ?? "freezing…"}</div>
                <p className="mt-2 text-sm text-emerald-100/70">Signature: UNSIGNED. Hash trail is stranger-checkable.</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
                <div className="text-[11px] uppercase tracking-wide text-emerald-300/70">Value Ledger</div>
                <div className="mt-1 text-lg font-bold">0 published rows</div>
                <p className="mt-2 text-sm text-emerald-100/70">Empty is honesty. No traction claim without a row.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/east-west/verify" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b]">
                Verify the card
              </Link>
              <Link href="/east-west/packs" className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-semibold">
                Evidence packs
              </Link>
              <Link href="/east-west/desks" className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-semibold">
                Regulator desks — free forever
              </Link>
              <Link href="/east-west/briefs" className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-semibold">
                Buyer one-pagers
              </Link>
              <Link href="/east-west/pay" className="rounded-xl border border-amber-400/40 px-4 py-2 text-sm font-semibold">
                Pay rail — OWNER-BLOCKED
              </Link>
              <button
                type="button"
                className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-100"
                onClick={() => openLobby({ pane: "east-west", task: "east-west" })}
              >
                Open in Council OS
              </button>
            </div>
            <section>
              <h2 className="text-xl font-bold">Clocks</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {CLOCKS.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <span className="font-mono text-amber-200">{c.date}</span>
                    <Link href={c.href} className="text-emerald-100 hover:underline">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold">Claim → artifact</h2>
              <ul className="mt-3 space-y-2 text-sm text-emerald-100/80">
                {CLAIMS.map((c) => (
                  <li key={c.id}>
                    <span className="font-semibold text-emerald-50">{c.text}</span>
                    <span className="text-emerald-100/50"> — {c.artifact}</span>
                  </li>
                ))}
              </ul>
            </section>
            <ul className="grid gap-2 text-sm text-emerald-100/70 sm:grid-cols-2">
              <li>Pricing: {OWNER_BLOCKS.pricing}</li>
              <li>DID: {OWNER_BLOCKS.did}</li>
              <li>Domains: {OWNER_BLOCKS.domains}</li>
              <li>Sale: {OWNER_BLOCKS.sale}</li>
            </ul>
          </div>
        )}

        {section === "crosswalk" && (
          <div className="space-y-8">
            <Banner />
            <p className="text-sm text-emerald-100/70">
              Canon {CROSSWALK_BODY.version}, frozen {CROSSWALK_BODY.frozenAt}. Hash{" "}
              <code className="font-mono text-emerald-300">{frozen?.crosswalkHash.slice(0, 16) ?? "…"}…</code>
            </p>
            <h2 className="text-xl font-bold">EU AI Act</h2>
            <Table rows={EU_ROWS} caption="EU AI Act mapping" />
            <h2 className="text-xl font-bold">UK</h2>
            <Table rows={UK_ROWS} caption="UK principles mapping" />
            <h2 className="text-xl font-bold">Illinois SB 315</h2>
            <Table rows={ILLINOIS_ROWS} caption="Illinois SB 315 mapping" />
            <h2 className="text-xl font-bold">China GB/T</h2>
            <Table rows={CHINA_ROWS} caption="China GB/T mapping" />
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4">
              <h3 className="font-bold text-amber-100">{US_HONESTY.heading}</h3>
              <p className="mt-2 text-sm text-amber-100/80">{US_HONESTY.note}</p>
              <p className="mt-1 font-mono text-xs">sufficiency: {US_HONESTY.sufficiency}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {US_HONESTY.subRows.map((s) => (
                  <li key={s.id}>
                    <span className="font-semibold">{s.name}</span>
                    {"clock" in s && s.clock ? <span className="ml-2 font-mono text-amber-200">{s.clock}</span> : null}
                    <div className="text-emerald-100/70">{s.note}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {section === "verify" && (
          <div className="space-y-4">
            <Banner />
            <p className="text-sm text-emerald-100/70">
              Paste any East-West card. Verification is local — hash, kind, crosswalk binding, grammar. No account.
            </p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              className="h-64 w-full rounded-2xl border border-emerald-500/20 bg-black/40 p-4 font-mono text-xs"
              aria-label="Measurement card JSON"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b]"
                onClick={() => runVerify(paste)}
              >
                Verify locally
              </button>
              <Link href="/gspc-verify" className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm">
                Also on /gspc-verify
              </Link>
            </div>
            {verdict && (
              <div className={`rounded-2xl border p-4 ${verdict.ok ? "border-emerald-400/40" : "border-red-400/40"}`}>
                <div className="font-bold">{verdict.ok ? "VALID" : "INVALID — fail closed"}</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {verdict.lines.map((l) => (
                    <li key={l.label}>
                      <span className={l.ok === false ? "text-red-300" : "text-emerald-200"}>{l.label}:</span> {l.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {section === "packs" && (
          <div className="space-y-6">
            <Banner />
            <ul className="grid gap-4 md:grid-cols-3">
              {PACKS.map((p) => (
                <li key={p.id} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
                  <h2 className="text-lg font-bold">{p.title}</h2>
                  <p className="mt-1 text-xs uppercase tracking-wide text-emerald-300/70">{p.audience}</p>
                  <p className="mt-3 text-sm text-emerald-100/75">{p.summary}</p>
                  <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-emerald-100/70">
                    {p.contents.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="mt-4 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b]"
                    onClick={() => downloadPack(p.id)}
                  >
                    Download sample JSON
                  </button>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-emerald-500/20 p-4 text-sm">
              <h3 className="font-bold">What this pack is not</h3>
              <ul className="mt-2 list-disc pl-5 text-emerald-100/75">
                {PACK_NOT.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {section === "challenge" && (
          <div className="space-y-4">
            <Banner />
            <p className="text-sm text-emerald-100/80">
              Measured-subject redress. Submit a challenge to the published card or a crosswalk row. You get a
              hash-chained receipt. This is not a statutory appeals channel.
            </p>
            <textarea
              value={challengeText}
              onChange={(e) => setChallengeText(e.target.value)}
              className="h-32 w-full rounded-2xl border border-emerald-500/20 bg-black/40 p-4 text-sm"
              placeholder="What is wrong, and which cell or card id?"
              aria-label="Challenge text"
            />
            <button
              type="button"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b]"
              onClick={submitChallenge}
            >
              Submit challenge
            </button>
            {challengeReceipt && (
              <pre className="overflow-x-auto rounded-2xl border border-emerald-500/20 bg-black/40 p-4 text-xs">
                {JSON.stringify(challengeReceipt, null, 2)}
              </pre>
            )}
          </div>
        )}

        {(section === "desks" || deskId) && (
          <div className="space-y-6">
            <Banner />
            <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm">
              Signed streams are free forever to regulators — no account, no procurement, no fee, ever.
            </p>
            {deskId === "us" ? (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5">
                <h2 className="text-lg font-bold">{US_HONESTY.heading}</h2>
                <p className="mt-2 text-sm">{US_HONESTY.note}</p>
                <p className="mt-1 font-mono text-xs">sufficiency: {US_HONESTY.sufficiency}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {US_HONESTY.subRows.map((s) => (
                    <li key={s.id}>
                      <span className="font-semibold">{s.name}</span>
                      {"clock" in s && s.clock ? (
                        <span className="ml-2 font-mono text-amber-200">{s.clock}</span>
                      ) : null}
                      <div className="text-emerald-100/70">{s.note}</div>
                    </li>
                  ))}
                </ul>
                <Link href="/east-west/crosswalk" className="mt-4 inline-block text-sm text-emerald-300 underline">
                  Open the full crosswalk
                </Link>
              </div>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {DESKS.filter((d) => !deskId || d.id === deskId).map((d) => (
                  <li key={d.id} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
                    <h2 className="text-lg font-bold">{d.name}</h2>
                    <p className="mt-1 text-sm text-emerald-100/70">{d.authority}</p>
                    <p className="mt-3 text-sm">{d.stream}</p>
                    <p className="mt-1 text-xs text-emerald-300/70">
                      Verify the stream in {d.verifyMinutes} minutes, no account.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={d.href} className="text-sm text-emerald-300 underline">
                        Open desk
                      </Link>
                      <Link href={d.atlas} className="text-sm text-emerald-300 underline">
                        Regulator Atlas
                      </Link>
                      <Link href="/east-west/verify" className="text-sm text-emerald-300 underline">
                        Verify now
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {section === "ledger" && (
          <div className="space-y-4">
            <Banner />
            <p className="text-sm text-emerald-100/80">{published.note}</p>
            <div className="rounded-2xl border border-emerald-500/20 p-4">
              <div className="text-lg font-bold">Published rows: {published.publishedCount}</div>
              <p className="mt-1 text-sm text-emerald-100/70">Event types: {published.eventTypes.join(", ")}</p>
            </div>
            <h3 className="font-bold">Local browser receipts (not published traction)</h3>
            {localRows.length === 0 ? (
              <p className="text-sm text-emerald-100/60">
                None yet. Verify a card or fetch a pack to mint a local receipt.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {localRows.map((r) => (
                  <li key={r.id} className="rounded-xl border border-emerald-500/15 p-3 font-mono text-xs">
                    {r.type} · {r.at} · {r.subject} · {r.signature.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}


        {section === "buyers" && (
          <div className="space-y-4">
            <Banner />
            <p className="text-sm text-emerald-100/80">Every commercial deal is screened. Regulators are never billed. Ranked entities: no money in either direction.</p>
            <ul className="space-y-3">
              {BUYER_SCREEN.map((s) => (
                <li key={s.id} className="rounded-2xl border border-emerald-500/20 p-4">
                  <div className="font-bold">{s.ask}</div>
                  <p className="mt-1 text-sm text-emerald-200">Pass: {s.pass}</p>
                  <p className="text-sm text-amber-200/80">Fail: {s.fail}</p>
                </li>
              ))}
            </ul>
            <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-100/70">
              {COMMERCE_FIREWALL.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {section === "license" && (
          <div className="space-y-4 text-sm text-emerald-100/80">
            <Banner />
            <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">{LICENSE_TERMS.status}</p>
            <p className="font-semibold">{LICENSE_TERMS.weAlways}</p>
            <h3 className="font-bold">Licensee may</h3>
            <ul className="list-disc pl-5 space-y-1">
              {LICENSE_TERMS.licenseeMay.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <h3 className="font-bold">Licensee may not</h3>
            <ul className="list-disc pl-5 space-y-1">
              {LICENSE_TERMS.licenseeMayNot.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}

        {section === "briefs" && (
          <div className="space-y-6">
            <Banner />
            <p className="text-sm text-emerald-100/70">ClaimGuard-gated one-pagers. Every number must resolve to a signed artifact. Owner-approved copy only — these are live as samples, not as sent outreach.</p>
            <ul className="grid gap-4 md:grid-cols-3">
              {ONE_PAGERS.map((b) => (
                <li key={b.id} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
                  <h2 className="text-lg font-bold">{b.audience}</h2>
                  <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-emerald-100/75">
                    {b.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm font-semibold text-emerald-200">{b.close}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {section === "pay" && (
          <div className="space-y-4 text-sm text-emerald-100/80">
            <Banner />
            <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">{X402_FALLBACK.status} — {X402_FALLBACK.primary}</p>
            <p>{X402_FALLBACK.fallback}</p>
            <p>{X402_FALLBACK.demo}</p>
            <p className="font-mono text-xs text-amber-200">No amount is invented. No payment is accepted. A 402-shaped JSON is the honest demo.</p>
            <Link href="/api/east-west/pay/demo" className="text-emerald-300 underline">
              GET /api/east-west/pay/demo
            </Link>
          </div>
        )}

        {section === "pricing" && (
          <div className="space-y-4">
            <Banner />
            <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm">
              {PRICING_DOCTRINE.line}
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-emerald-100/80">
              <li>Packs: {PRICING_DOCTRINE.packs}</li>
              <li>Tooling: {PRICING_DOCTRINE.tooling}</li>
              <li>Scores: {PRICING_DOCTRINE.scores}</li>
              <li>Regulators: {PRICING_DOCTRINE.regulators}</li>
              <li>Ranked entities: {PRICING_DOCTRINE.ranked}</li>
              <li>{PRICING_DOCTRINE.x402}</li>
            </ul>
            <Link href="/payg" className="text-emerald-300 underline">
              /payg still reads: pricing pending a published ruling
            </Link>
          </div>
        )}

        {section === "method" && (
          <div className="space-y-4 text-sm text-emerald-100/80">
            <Banner />
            <p>{METHODOLOGY.inclusion}</p>
            <p>{METHODOLOGY.labeling}</p>
            <p>{METHODOLOGY.versioning}</p>
            <ol className="list-decimal space-y-1 pl-5">
              {METHODOLOGY.sourceTiers.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
        )}

        {section === "not" && (
          <div className="space-y-3 text-sm text-emerald-100/80">
            <Banner />
            {PACK_NOT.map((n) => (
              <p key={n}>{n}.</p>
            ))}
            <p>Scores are never sold. Ranked entities: no money in either direction.</p>
            <p>We conform to our own method. We are never “certified” by ourselves.</p>
          </div>
        )}

        {section === "press" && (
          <div className="space-y-4">
            <Banner />
            <p className="text-sm text-emerald-100/70">{OWNER_BLOCKS.press}</p>
            <ul className="space-y-3">
              {PRESS_DRAFTS.map((d) => (
                <li key={d.id} className="rounded-2xl border border-emerald-500/20 p-4">
                  <div className="font-bold">
                    {"title" in d && d.title ? d.title : "outlet" in d ? d.outlet : d.id}
                  </div>
                  {"beat" in d && d.beat ? <div className="text-sm text-emerald-100/70">{d.beat}</div> : null}
                  {"claim" in d && d.claim ? <div className="mt-1 text-sm">{d.claim}</div> : null}
                  <div className="mt-2 font-mono text-xs text-amber-200">{d.status}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[12px] text-emerald-100/45">
          Sample subject is a self-measurement of the published GSPC snapshot ({CARD_BODY.subject.name}). Schema{" "}
          {CARD_BODY.schema}.
        </p>
      </div>
    </CouncilOsPageShell>
  );
}
