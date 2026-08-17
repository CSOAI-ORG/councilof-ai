import { useEffect } from "react";
import { Link } from "wouter";
import { Shield, CheckCircle, RefreshCw, Ban, Eye, FileCheck } from "lucide-react";

/**
 * /about — Council of AI measurement body overview.
 * No jobs mill. No certification shop. Measurement, signing, re-attestation.
 */

export default function About() {
  useEffect(() => {
    document.title = "About Council of AI — independent AI behaviour measurement | CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            About · independent measurement body
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            Council of AI
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-emerald-100/90 leading-relaxed">
            <a href="/founder" className="font-semibold text-emerald-300 hover:text-emerald-200 transition-colors">Nicholas Templeman</a> founded Council of AI, an independent measurement body. It measures, signs, and re-attests AI behaviour. It never certifies or sells ratings. Verify stays free.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {/* WHAT WE DO */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">What we do</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-5">
              <Shield className="h-6 w-6 text-emerald-400 mb-3" />
              <h3 className="text-[15px] font-bold text-emerald-50">Measure</h3>
              <p className="mt-2 text-[13px] text-emerald-100/70 leading-relaxed">
                We run AI systems against frozen, published instruments. Every test is deterministic — no model judges another.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-5">
              <FileCheck className="h-6 w-6 text-emerald-400 mb-3" />
              <h3 className="text-[15px] font-bold text-emerald-50">Sign</h3>
              <p className="mt-2 text-[13px] text-emerald-100/70 leading-relaxed">
                The result is a ~3KB card, Ed25519-signed and timestamp-anchored. Anyone can verify it without asking us.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-5">
              <RefreshCw className="h-6 w-6 text-emerald-400 mb-3" />
              <h3 className="text-[15px] font-bold text-emerald-50">Re-attest</h3>
              <p className="mt-2 text-[13px] text-emerald-100/70 leading-relaxed">
                AI changes. Regulation changes. We measure again and issue a delta card chained to the old one. History is append-only.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT WE DO NOT DO */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">What we do not do</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <Ban className="h-6 w-6 text-red-400 mb-3" />
              <h3 className="text-[15px] font-bold text-red-200">No certification</h3>
              <p className="mt-2 text-[13px] text-red-100/70 leading-relaxed">
                We do not certify AI systems. A measurement card shows what the AI did — it is not a badge of approval.
              </p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <Ban className="h-6 w-6 text-red-400 mb-3" />
              <h3 className="text-[15px] font-bold text-red-200">No remediation</h3>
              <p className="mt-2 text-[13px] text-red-100/70 leading-relaxed">
                We do not fix, tune, or improve the systems we measure. We are the referee, not a player.
              </p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <Ban className="h-6 w-6 text-red-400 mb-3" />
              <h3 className="text-[15px] font-bold text-red-200">No rating sales</h3>
              <p className="mt-2 text-[13px] text-red-100/70 leading-relaxed">
                We do not sell favourable ratings. The measurement is what it is. We take no money from anything we rank.
              </p>
            </div>
          </div>
        </section>

        {/* VERIFY */}
        <section className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <div className="flex items-start gap-4">
            <Eye className="h-8 w-8 text-emerald-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-emerald-50">Verify stays free</h2>
              <p className="mt-2 text-[14px] text-emerald-100/80 leading-relaxed">
                Anyone can recompute the hash chain in their browser. No account. No fee. The signing key is public. Verification runs on your machine, not ours.
              </p>
              <p className="mt-4">
                <Link href="/gspc-verify" className="text-emerald-300 hover:text-emerald-200 transition-colors font-medium">
                  Verify a card now →
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* COMPANY */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">Company</h2>
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-[#05140d] p-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div>
                <dt className="text-emerald-100/50">Legal entity</dt>
                <dd className="mt-1 text-emerald-50 font-medium">CSOAI Ltd</dd>
              </div>
              <div>
                <dt className="text-emerald-100/50">Companies House</dt>
                <dd className="mt-1 text-emerald-50 font-medium">UK 16939677</dd>
              </div>
              <div>
                <dt className="text-emerald-100/50">Incorporated</dt>
                <dd className="mt-1 text-emerald-50 font-medium">England & Wales</dd>
              </div>
              <div>
                <dt className="text-emerald-100/50">Founder</dt>
                <dd className="mt-1">
                  <Link href="/founder" className="text-emerald-300 hover:text-emerald-200 transition-colors font-medium">
                    Nicholas Templeman →
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* LINKS */}
        <div className="flex flex-wrap gap-4 pb-4 text-[13px]">
          <Link href="/founder" className="text-emerald-300 hover:text-emerald-200 transition-colors">
            About the founder →
          </Link>
          <Link href="/gspc-arena" className="text-emerald-300 hover:text-emerald-200 transition-colors">
            Watch the arena →
          </Link>
          <Link href="/methodology" className="text-emerald-300 hover:text-emerald-200 transition-colors">
            Read the methodology →
          </Link>
          <Link href="/benchmarks" className="text-emerald-300 hover:text-emerald-200 transition-colors">
            View benchmarks →
          </Link>
        </div>
      </div>
    </div>
  );
}
