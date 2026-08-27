import { useEffect } from "react";

// SocialOS — the AI character as the user's unified social presence. One inbox
// across 50+ platforms, cross-post engine, AI content generator, and social
// governance (DSA / GDPR / C2PA) woven into compliance. The second missing key
// for ONE OS, alongside the Legacy Bridge. Sovereign speaks; the world hears.

type Plat = { name: string; reach: string; tone: string };
type Civ = { name: string; region: string; platform: string; note: string };

const P0: Plat[] = [
  { name: "Telegram", reach: "800M · free · bots + mini-apps", tone: "bg-sky-50 text-sky-700" },
  { name: "Discord", reach: "200M · free · apps + activities", tone: "bg-indigo-50 text-indigo-700" },
  { name: "WhatsApp Business", reach: "2B · free tier · chat + txns", tone: "bg-emerald-50 text-emerald-700" },
  { name: "YouTube", reach: "2.7B · free · 10K quota", tone: "bg-red-50 text-red-700" },
];
const P1: Plat[] = [
  { name: "Bluesky · AT Protocol", reach: "40M · free · portable id", tone: "bg-sky-50 text-sky-700" },
  { name: "Mastodon · ActivityPub", reach: "10M · free · federated", tone: "bg-purple-50 text-purple-700" },
  { name: "Instagram Graph", reach: "2B · free", tone: "bg-pink-50 text-pink-700" },
  { name: "Reddit", reach: "70M · free", tone: "bg-orange-50 text-orange-700" },
  { name: "LinkedIn", reach: "1B · free", tone: "bg-blue-50 text-blue-700" },
  { name: "Facebook Graph", reach: "3B · free", tone: "bg-blue-50 text-blue-700" },
];

const PROTOCOLS = [
  { name: "ActivityPub", body: "W3C federated standard — Mastodon, PeerTube, Pixelfed. No single owner." },
  { name: "AT Protocol", body: "Bluesky's decentralized layer — algorithm choice, portable identity." },
  { name: "Nostr", body: "Simple, censorship-resistant social with lightning payments." },
  { name: "Farcaster", body: "Crypto-native social — on-chain identity, Web3 native." },
  { name: "Matrix", body: "End-to-end encrypted, federated messaging." },
  { name: "XMPP", body: "The original federated messaging — battle-tested, still running." },
];

const CIVS: Civ[] = [
  { name: "Sino-Nova", region: "China", platform: "WeChat · Weibo · Douyin", note: "1.38B WeChat · Mini-Programs 450M DAU" },
  { name: "Brasilia", region: "LATAM", platform: "WhatsApp dominant", note: "420M · Business API critical" },
  { name: "Indo-Sphere", region: "India", platform: "WhatsApp + Instagram", note: "487M · UPI payment rails" },
  { name: "Nubia Prime", region: "Africa", platform: "WhatsApp + M-Pesa", note: "500M+ · mobile money" },
  { name: "Khaleej", region: "Middle East", platform: "Snapchat + Telegram", note: "83% Snapchat in Saudi" },
  { name: "Rus-Kazakh", region: "Russia / CIS", platform: "VK + Telegram", note: "92M VK · Mini Apps 45M MAU" },
  { name: "ASEAN-IX", region: "SE Asia", platform: "LINE · Zalo · WhatsApp", note: "178M LINE ecosystem" },
  { name: "Pan-America", region: "US", platform: "Everything", note: "Multi-platform required" },
];

const GOV = [
  "Cross-platform compliance monitoring — DSA & GDPR",
  "AI-generated content labeling — C2PA provenance standard",
  "Cross-platform identity verification — did:csoai",
  "Disinformation & coordinated-inauthentic-behavior detection",
  "Content moderation woven across every connected platform",
];

export default function SocialOS() {
  useEffect(() => { document.title = "Social OS — the AI character as your social presence · CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">ONE OS · the social layer · second missing key</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Social OS</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-50/90">Your Council assistant AI character <em>is</em> your social presence. One unified inbox across 50+ platforms, a cross-post engine, an AI content generator — and social governance (DSA, GDPR, C2PA) woven into compliance. You speak once; the world hears, on every network the user cares about.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/enter" className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-300">Enter the OS →</a>
            <a href="/legacy" className="rounded-xl border border-emerald-300/40 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">See the Legacy Bridge →</a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-xl font-bold text-gray-900">Priority reach — connect first</h2>
        <p className="mt-1 text-sm text-gray-500">Free, high-reach, low-complexity platforms the Council assistant wires in first.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {P0.map((p) => (
            <div key={p.name} className="rounded-2xl border border-gray-200 p-5">
              <span className={"inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold " + p.tone}>P0</span>
              <div className="mt-3 font-bold text-gray-900">{p.name}</div>
              <p className="mt-1 text-xs text-gray-500 leading-snug">{p.reach}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {P1.map((p) => (
            <div key={p.name} className="rounded-2xl border border-gray-200 p-4">
              <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
              <p className="mt-1 text-xs text-gray-500 leading-snug">{p.reach}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Decentralized protocols — no gatekeepers</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOCOLS.map((p) => (
            <div key={p.name} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="font-bold text-emerald-900">{p.name}</div>
              <p className="mt-1 text-sm text-emerald-800/80 leading-snug">{p.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Social by civilization</h2>
        <p className="mt-1 text-sm text-gray-500">The Council assistant meets each region where it already lives. Don't compete with super-apps — become a service inside them.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CIVS.map((c) => (
            <div key={c.name} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{c.name}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">{c.region}</div>
              <div className="mt-2 text-sm font-semibold text-emerald-700">{c.platform}</div>
              <p className="mt-1 text-xs text-gray-500 leading-snug">{c.note}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Social + governance</h2>
        <div className="mt-4 rounded-2xl border border-gray-200 p-6">
          <ul className="grid gap-3 sm:grid-cols-2">
            {GOV.map((g) => (
              <li key={g} className="flex items-start gap-2 text-sm text-gray-700"><span className="mt-0.5 text-emerald-500">✦</span>{g}</li>
            ))}
          </ul>
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">How it flows</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-gray-700">You · "Council, post this"</span>
          <span className="text-emerald-500 font-bold">→</span>
          <span className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800">Social OS · per-platform tailor + C2PA label + policy gate</span>
          <span className="text-emerald-500 font-bold">→</span>
          <span className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-gray-700">50+ platforms · one inbox back</span>
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          The Legacy Bridge connects every system the enterprise depends on. The Social OS connects every audience the user cares about. The AI character is the bridge between them — translating intent into action, governed end to end. Live posting and the unified inbox switch on with the Layer 0 gateway.
        </div>
      </section>
    </div>
  );
}
