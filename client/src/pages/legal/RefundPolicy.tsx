import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { CreditCard, Mail, Shield } from "lucide-react";

const sections = [
  {
    title: "Scope",
    body:
      "This policy covers paid purchases of CSOAI Ltd services: measurement booking (RAS Booking Desk) and assessment packs. " +
      "Free services — measurement verification (/gspc-verify, /root.json, /api/proof?sha=, /api/verify, /api/receipts/verify) and the public measurement board — are never charged and are outside this policy. " +
      "Per-call machine access is pay-as-you-go at the 402 (x402, settled at call time); it is not subscription billing and is non-refundable once an artifact has been issued.",
  },
  {
    title: "14-day statutory withdrawal (UK & EU consumers)",
    body:
      "If you are a UK or EU consumer, you have the right to withdraw from a purchase within 14 days of the charge, without giving a reason. " +
      "Write to nicholas@csoai.org with your order number. If the service has already been fully performed at your express request during the withdrawal period, we may deduct a proportionate amount for what was delivered.",
  },
  {
    title: "Measurement bookings (RAS)",
    body:
      "A measurement booking reserves an assessment slot. Cancel more than 72 hours before the scheduled run: full refund. " +
      "Cancel inside 72 hours: 50% refund (the slot is held and cannot be resold). No-shows are not refundable, but the booking may be rescheduled once at no charge. " +
      "If we cancel or cannot perform, you receive a full refund — always.",
  },
  {
    title: "Assessment packs",
    body:
      "Packs (EU AI Act Assessment Pack, Finance / COBOL Bridge Pack, Growth Pack, Article 50 Transparency Kit) are digital deliverables. " +
      "If a pack has not been started, request a full refund within 14 days. Once work has begun, refunds are pro-rated against completed stages. " +
      "Every pack carries the same register as the platform: measurement and evidence only — never a certificate, grade, or pass/fail verdict — and if you believe the deliverable does not match what was agreed, contact us before requesting a chargeback; we will make it right or refund.",
  },
  {
    title: "How refunds are issued",
    body:
      "Refunds go to the original payment method via the checkout provider of record, typically within 5–10 business days. " +
      "Email nicholas@csoai.org first — most issues resolve without a formal refund. We never take money from anything we rank, and no refund, discount, or payment changes a measurement outcome. Public measurements stay public; corrections are published, not hidden.",
  },
];

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Refund Policy</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            CSOAI Ltd sells measurement bookings and assessment packs. Verification is free, forever.
            This policy explains when and how payments are refunded.
          </p>
          <p className="text-sm text-muted-foreground mt-4">Last updated: 3 November 2026</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid gap-6">
          {sections.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {s.title === "How refunds are issued" ? (
                    <CreditCard className="h-5 w-5" />
                  ) : s.title.startsWith("14-day") ? (
                    <Shield className="h-5 w-5" />
                  ) : null}
                  {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground whitespace-pre-line">{s.body}</CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Refund requests and questions:{" "}
              <a className="underline" href="mailto:nicholas@csoai.org">
                nicholas@csoai.org
              </a>
              . See also our{" "}
              <Link className="underline" href="/terms-of-service">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link className="underline" href="/privacy-policy">
                Privacy Policy
              </Link>
              .
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
