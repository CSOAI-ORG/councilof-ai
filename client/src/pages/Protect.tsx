import { Link } from "wouter";
import { FileCheck, Fingerprint, Shield } from "lucide-react";

export default function Protect() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-primary/5 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Evidence integrity and identity</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Understand what a signature establishes</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">A cryptographic signature connects specific bytes to a signing key. Identifying a person, detecting a deepfake and monitoring impersonation require additional evidence and a defined method.</p>
        </div>
      </section>
      <div className="container mx-auto max-w-5xl space-y-10 px-4 py-12">
        <section aria-labelledby="checks-heading">
          <h2 id="checks-heading" className="text-2xl font-bold">Keep the checks separate</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <article className="rounded-xl border p-6">
              <FileCheck className="mb-4 h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold">Record integrity</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Check the supplied bytes, digest and signature under the named key. State the key source and any current-status checks separately.</p>
              <Link href="/gspc-verify" className="mt-5 inline-block text-sm font-semibold text-primary underline underline-offset-4">Verify a measurement record →</Link>
            </article>
            <article className="rounded-xl border p-6">
              <Fingerprint className="mb-4 h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold">Identity binding</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A signature alone does not establish who controls the key, a human speaker's identity, consent, likeness or the truth of a statement.</p>
              <Link href="/methodology" className="mt-5 inline-block text-sm font-semibold text-primary underline underline-offset-4">Inspect the method and scope →</Link>
            </article>
            <article className="rounded-xl border p-6">
              <Shield className="mb-4 h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold">Detection and monitoring</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Changing signed text can invalidate its signature. That is an integrity check, not a deepfake-detection test or evidence that a person is being monitored.</p>
              <Link href="/corrections" className="mt-5 inline-block text-sm font-semibold text-primary underline underline-offset-4">Read the public correction record →</Link>
            </article>
          </div>
        </section>
        <section className="rounded-xl border bg-muted/30 p-6 sm:p-8" aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="text-2xl font-bold">CSOAI's published scope</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">CSOAI publishes measurement evidence and verification tools. This page offers no operating personal-identity verification service, worldwide impersonation monitoring, family protection programme or guaranteed deepfake shield.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">To review a specific content-authenticity claim, identify the source, observed result, method, date and limitations. Public verification remains free.</p>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold">
            <Link href="/claim-maintenance" className="text-primary underline underline-offset-4">Inspect claim maintenance</Link>
            <Link href="/contact" className="text-primary underline underline-offset-4">Discuss a specific evidence need</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
