// v2.0 — 2026-08-28. Supersedes the January 2026 "AI Safety Licensing Agreement"
// which described a certification scheme CSOAI does not operate.
// Owner ruling 2026-08-26: no public unit prices. Bands and "on enquiry" only.
// Canon: measurement, never certification · nobody ranked pays · verification free forever.
import { motion } from "framer-motion";
import {
  FileCheck,
  Layers,
  Shield,
  Scale,
  Clock,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const SKUS = [
  {
    name: "Council Verify",
    who: "Anyone",
    term: "Perpetual",
    fee: "Free forever",
    covers:
      "Browser-side recomputation of a signed card. No account. Nothing is sent to us. The grade is never sold.",
  },
  {
    name: "Council OS",
    who: "Anyone",
    term: "Perpetual",
    fee: "Free to use",
    covers:
      "The workspace at /os — board, verifier, assess, evidence panes. Paid only when a feed, a corpus, or a re-attest loop is required.",
  },
  {
    name: "Council Ledger",
    who: "Insurers, procurement, deployers, GPAI evidence buyers",
    term: "Annual or per-request",
    fee: "On enquiry",
    covers:
      "Signed evidence feed and evidence packs (GPAI, CRA, insurer rail). A measurement of a named system the buyer requested — never a purchased public rank.",
  },
  {
    name: "Council Data",
    who: "Researchers, AI teams, auditors",
    term: "Per dataset / per term",
    fee: "On enquiry",
    covers:
      "Licensed signed measurement corpus (traces, preference pairs, safety incidents). The buyer licenses data. The buyer can never license, purchase, or influence a score.",
  },
];

const DATA_TIERS = [
  {
    tier: "Open access",
    audience: "Public — signed sample + verify tooling",
    term: "Perpetual",
    fee: "Free",
    note: "Signed sample dataset + verify_dataset.py. Anyone can check provenance without asking us.",
  },
  {
    tier: "Research",
    audience: "Academics / independent researchers",
    term: "Quarterly",
    fee: "On enquiry",
    note: "Longitudinal axis signal. Measurement data only — never a certification.",
  },
  {
    tier: "Enterprise",
    audience: "AI teams (data licensees, not ranked parties)",
    term: "Annual",
    fee: "On enquiry",
    note: "Signed GSPC axis corpus. Buyer is a data licensee. Entry to the board is not for sale.",
  },
  {
    tier: "Regulator / auditor",
    audience: "Regulators and auditors",
    term: "Case-by-case",
    fee: "Custom — often no fee",
    note: "Signed evidence package + verify path. Evidence, not a conformity mark. Regulators access the public rail free.",
  },
];

export default function LicensingAgreement() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <FileCheck className="h-3 w-3 mr-1" />
              Standing terms — evidence and data
            </Badge>
            <h1 className="text-4xl md:text-4xl font-bold mb-6">
              Measurement licence
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              CSOAI Ltd (Council of AI) — UK Companies House 16939677
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Version 2.0</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Effective: 28 August 2026</span>
            </div>
            <p className="mt-6 max-w-2xl mx-auto text-sm leading-relaxed text-muted-foreground">
              This page replaces the January 2026 draft titled “AI Safety Licensing
              Agreement”, which described certification marks and a licence to operate
              AI systems. CSOAI does not certify, does not issue conformity marks, and
              does not authorise anyone to operate an AI system. A deal is not binding
              until Nick countersigns a licence manifest.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          <motion.section {...fadeInUp}>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-600" />
                  Register (verbatim)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed">
                <p>
                  This is a measurement credential. It is not a certification,
                  endorsement, or conformity mark, and must not be presented as one.
                </p>
                <p className="text-muted-foreground">
                  We measure. We sign. We re-attest. Verification is free forever.
                  Nobody ranked pays. Humans never pay to verify or to report.
                  Regulators use the public rail at no charge. A vendor may license
                  <strong> data</strong>; a vendor can never buy a <strong>score</strong>.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  1. What is licensed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  CSOAI licenses <strong>signed measurement evidence</strong> and{" "}
                  <strong>measurement-derived data</strong>. The negotiable object is a
                  licence manifest identifying the dataset or feed, the scope, the term,
                  and the fee. These standing terms are what that manifest references.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Council Ledger — signed receipts and evidence packs for a named system or a recurring feed.</li>
                  <li>Council Data — Q/A rows, preference pairs, safety incidents, each with provenance back to a measurement card.</li>
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  2. What is never licensed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>A certification, conformity mark, or authorisation to operate an AI system.</li>
                  <li>A public rank, grade, or league table — those are not for sale.</li>
                  <li>The signing key. Keys stay in the signing node.</li>
                  <li>The right to present a measurement as a notified-body decision under the EU AI Act or any other statute.</li>
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  3. The four SKUs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-3 font-semibold">SKU</th>
                        <th className="text-left py-3 px-3 font-semibold">Who</th>
                        <th className="text-left py-3 px-3 font-semibold">Term</th>
                        <th className="text-left py-3 px-3 font-semibold">Fee</th>
                        <th className="text-left py-3 px-3 font-semibold">Covers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SKUS.map((s) => (
                        <tr key={s.name} className="border-b align-top">
                          <td className="py-3 px-3 font-medium">{s.name}</td>
                          <td className="py-3 px-3 text-muted-foreground">{s.who}</td>
                          <td className="py-3 px-3 text-muted-foreground">{s.term}</td>
                          <td className="py-3 px-3 font-medium">{s.fee}</td>
                          <td className="py-3 px-3 text-muted-foreground">{s.covers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Binding figures live on the countersigned manifest, not on this page.
                  Stripe Checkout links from earlier catalogues do not sell access to the
                  rail and a grade is never sold. Until live-flip, paid SKUs are on enquiry.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  4. Council Data — corpus tiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-3 font-semibold">Tier</th>
                        <th className="text-left py-3 px-3 font-semibold">Audience</th>
                        <th className="text-left py-3 px-3 font-semibold">Term</th>
                        <th className="text-left py-3 px-3 font-semibold">Fee</th>
                        <th className="text-left py-3 px-3 font-semibold">What it covers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DATA_TIERS.map((t) => (
                        <tr key={t.tier} className="border-b align-top">
                          <td className="py-3 px-3 font-medium">{t.tier}</td>
                          <td className="py-3 px-3 text-muted-foreground">{t.audience}</td>
                          <td className="py-3 px-3 text-muted-foreground">{t.term}</td>
                          <td className="py-3 px-3 font-medium">{t.fee}</td>
                          <td className="py-3 px-3 text-muted-foreground">{t.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  5. Permitted use
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Hand a signed evidence pack to an insurer, buyer, board, or competent authority.</li>
                  <li>Internal evaluation, research, and training on licensed Council Data.</li>
                  <li>Cite CSOAI Ltd (Council of AI) + dataset or card content_id.</li>
                  <li>Embed the free verify badge, which goes green only when the bytes are true.</li>
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  6. Prohibited use
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Presenting a measurement as a certification, accreditation, or conformity assessment.</li>
                  <li>Paying, or being paid, to alter a public rank.</li>
                  <li>Republishing licensed data as a standalone dataset without a separate licence.</li>
                  <li>Displaying any certified-by-Council mark. No such mark is issued; we do not certify.</li>
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section {...fadeInUp}>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    7. Term
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Verify and Council OS: perpetual, free. Ledger and Data: as the
                    countersigned manifest. 60 days’ notice to non-renew a paid term.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    8. Firewall
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The commercial team does not set scores. The measurement analysts do
                    not take money from ranked entities. Capture of either side kills the
                    asset.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scale className="h-5 w-5 text-primary" />
                    9. Governing law
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Laws of England and Wales. Mediation, then arbitration in London.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section {...fadeInUp}>
            <Card className="bg-gradient-to-br from-emerald-500/5 to-primary/10 border-emerald-500/20">
              <CardContent className="pt-6 text-center">
                <FileCheck className="h-12 w-12 text-emerald-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Licence a feed or a corpus</h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Tell us which SKU. We send a manifest. Nothing is a certificate.
                  Verification stays free.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/contact">
                    <Button size="lg">Talk to us</Button>
                  </Link>
                  <Link href="/gspc-verify">
                    <Button variant="outline" size="lg">
                      Verify a card — free
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button variant="outline" size="lg">
                      The four SKUs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>© 2026 CSOAI Ltd. Measurement, not certification.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
