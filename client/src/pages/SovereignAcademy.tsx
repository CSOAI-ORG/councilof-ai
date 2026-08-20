import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";
import { Band, Caveat, PageHero, Panel } from "@/components/pagekit/PageKit";

// Council Academy — learning as an immersive journey inside the OS, not a manual.
// The guide walks you path by path (Foundations -> Your Jurisdiction -> Apply
// -> Attest); every module flows straight into the real tool. Learn by living it.
// NB: the fourth path attests TRAINING, never conformity — Council of AI certifies
// nothing, issues no conformity mark, and is not an accreditation body.
//
// Design: the homepage scroll-world language via components/pagekit/PageKit.

type Mod = { name: string; href: string };
type Path = { n: number; title: string; blurb: string; ring: string; chip: string; modules: Mod[] };

const PATHS: Path[] = [
  {
    n: 1,
    title: "Foundations",
    blurb: "Stand on the floor first — identity, policy, attestation. Two hours here saves you a fortnight later.",
    ring: "border-amber-300",
    chip: "bg-amber-100 text-amber-800",
    modules: [
      { name: "Layer 0 — the 8 trust controls", href: "/layer0" },
      { name: "The 52-Article Charter", href: "/charter" },
      { name: "SOAI-PDCA methodology", href: "/soai-pdca" },
    ],
  },
  {
    n: 2,
    title: "Your jurisdiction",
    blurb: "Learn the law and frameworks that actually bind you — wherever you are, and whatever you ship.",
    ring: "border-emerald-300",
    chip: "bg-emerald-100 text-emerald-800",
    modules: [
      { name: "EU AI Act", href: "/eu-ai-act" },
      { name: "NIST AI RMF", href: "/nist-ai-rmf" },
      { name: "ISO/IEC 42001", href: "/iso-42001" },
      { name: "TC260 (China)", href: "/tc260" },
    ],
  },
  {
    n: 3,
    title: "Apply",
    blurb: "Turn what you know into governance you can hand to someone — map it, assess it, generate it.",
    ring: "border-blue-300",
    chip: "bg-blue-100 text-blue-800",
    modules: [
      { name: "Framework crosswalks", href: "/crosswalks" },
      { name: "Readiness assessment (free)", href: "/readiness-assessment" },
      { name: "Policy generator", href: "/policy-generator" },
    ],
  },
  {
    n: 4,
    title: "Attest",
    blurb: "Finish a course and get a signed training record. It attests that you did the training — nothing else. We certify nothing.",
    ring: "border-violet-300",
    chip: "bg-violet-100 text-violet-800",
    modules: [
      { name: "Training records — how they work", href: "/training" },
      { name: "Verify a training record", href: "/verify-certificate" },
      { name: "Full course catalogue", href: "/courses" },
    ],
  },
];

export default function SovereignAcademy() {
  useEffect(() => {
    document.title = "Council Academy — learn the statute and the method | CSOAI";
    setMetaDescription("Council Academy: free training on the EU AI Act, NIST AI RMF, ISO/IEC 42001 and the measurement method. Course completion produces a signed training record — it attests training, not conformity.");
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        kicker="Council Academy · learn by living it"
        title={<>Learn the law by doing the work.</>}
        lede={
          <>
            No manuals, no slide decks, no exam-cram. Four paths take you from the trust floor to the
            statute that binds you and into the real tools — and every module hands off to the thing
            it just taught you. All of it free.
          </>
        }
        image={{ src: "/images/literacy_training_arena.jpg", alt: "A training arena where people learn to work alongside AI systems under supervision" }}
        points={[
          { tag: "pain", text: "AI-literacy training is usually a slide deck and a quiz that leaves you no better able to do the work." },
          { tag: "benefit", text: "Every module ends in the live tool, so you finish holding the artefact you were taught to produce." },
          { tag: "usp", text: "The completion record is Ed25519-signed and independently checkable — and it says exactly what it means." },
        ]}
        actions={[
          { href: "/courses", label: "Browse the courses" },
          { href: "/readiness-assessment", label: "Free readiness check", tone: "ghost" },
        ]}
        footnote={
          <>
            Council of AI is a measurement body. It certifies nothing, accredits nobody, and issues no
            conformity mark. A completion record attests training, and training only.
          </>
        }
      />

      <Band
        tone="tint"
        kicker="The four paths"
        title={<>Foundations, jurisdiction, application, attestation.</>}
        lede={
          <>
            Take them in order the first time. After that, jump wherever the work is — nothing here
            locks behind a prerequisite.
          </>
        }
      >
        <div className="space-y-6">
          {PATHS.map((p, idx) => (
            <div key={p.n} className="relative">
              {idx < PATHS.length - 1 && (
                <div className="absolute left-[27px] top-16 hidden h-[calc(100%-1rem)] w-px bg-gray-200 sm:block" />
              )}
              <div className="flex flex-col gap-5 sm:flex-row">
                <div
                  className={
                    "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-white text-lg font-black text-gray-700 " +
                    p.ring
                  }
                >
                  {p.n}
                </div>
                <Panel className="flex-1">
                  <h3 className="text-2xl font-black tracking-tight text-gray-900">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{p.blurb}</p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {p.modules.map((m) => (
                      <a
                        key={m.name}
                        href={m.href}
                        className="group flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                      >
                        <span className="text-sm font-semibold text-gray-800">{m.name}</span>
                        <span className={"ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold " + p.chip}>
                          Begin →
                        </span>
                      </a>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          ))}
        </div>
      </Band>

      <Band width="prose" kicker="Before you start" title={<>What a completion record does and does not say.</>}>
        <div className="space-y-6">
          <Caveat title="Training, not conformity">
            <p>
              Finishing a course produces a signed record that says one thing:{" "}
              <strong>this person completed this training on this date</strong>. It is
              Ed25519-signed against the published signer so anyone can check it without asking us.
            </p>
            <p>
              It is <strong>not</strong> a certification, an accreditation, a licence, or any kind of
              statement that a person or a system complies with the EU AI Act or any other regime.
              Council of AI is not a certification body, not an accreditation body and not a notified
              body — see{" "}
              <a href="/accreditation" className="font-semibold underline">
                what a course attests
              </a>
              .
            </p>
          </Caveat>
          <Panel>
            <p className="text-[15px] leading-relaxed text-gray-600">
              You never have to read a manual to find anything here. Open the{" "}
              <strong className="text-gray-900">Council assistant</strong> on any page and say{" "}
              <em>&ldquo;teach me about the EU AI Act&rdquo;</em> or{" "}
              <em>&ldquo;start my training record&rdquo;</em> — it takes you straight there. Learning
              and doing are the same motion.
            </p>
          </Panel>
        </div>
      </Band>
    </div>
  );
}
