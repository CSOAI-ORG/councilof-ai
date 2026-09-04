import { useEffect } from "react";
/**
 * 33-Seat Council Detail Page
 * Comprehensive explanation of the designed multi-agent review system
 */

import { Shield, Users, Vote, CheckCircle2, AlertTriangle, Lock, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function CouncilDetail() {
  useEffect(() => { document.title = "CouncilDetail | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
              Multi-Agent Council
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              The 33-seat council — a design, not a live system
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A proposed multi-agent review architecture with human oversight. Its thresholds are design parameters; live independence and fault tolerance are not established.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="border-emerald-200">
              <CardHeader>
                <Shield className="h-10 w-10 text-emerald-600 mb-2" />
                <CardTitle>Designed supermajority</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  The 23-of-33 threshold is a design parameter. It does not prove independent voters, capture resistance or fault tolerance.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader>
                <Lock className="h-10 w-10 text-emerald-600 mb-2" />
                <CardTitle>Transparent & Auditable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Design target: each vote would be Ed25519-signed and SHA-256 hash-chained so its record can be checked offline.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader>
                <Zap className="h-10 w-10 text-emerald-600 mb-2" />
                <CardTitle>Target: rapid review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  The architecture aims to make scoped reviews fast, but no live decision-time claim is made.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How the Council Works</h2>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Analyst Submits Report</h3>
                <p className="text-gray-600 text-lg">
                  A certified Watchdog Analyst reviews an AI system and submits a compliance report with their recommendation (Compliant, Conditionally Compliant, or Non-Compliant). The report includes detailed findings, evidence, and remediation steps.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Target: independently operated review legs</h3>
                <p className="text-gray-600 text-lg">
                  The proposed workflow sends a scoped claim and its evidence to independently operated model/provider legs and retains raw responses. That 33-seat workflow is not live today; the latest three-leg experiment measured <strong>rho=1 and n_eff=1</strong>. See the{" "}
                  <a href="/interop/council-independence.json" className="text-emerald-700 underline">source record</a>.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">3</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Council Vote</h3>
                <p className="text-gray-600 text-lg">
                  The proposed vote would require at least <strong>23 of 33 seats</strong> to agree (⅔ + 1 supermajority). Effective independence must be measured, not assumed.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">4</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Decision & Escalation</h3>
                <p className="text-gray-600 text-lg">
                  Under the design, a report that reaches the threshold would be published; otherwise it would be escalated for human review. Proposed vote records would be Ed25519-signed and SHA-256 hash-chained for offline verification against the published signer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why the Council */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Why test this design?</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-2" />
                <CardTitle>Prevents Single Points of Failure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  The design requires a 23-of-33 supermajority so no single seat decides an outcome. That threshold does not establish that the seats are independent.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <AlertTriangle className="h-8 w-8 text-emerald-600 mb-2" />
                <CardTitle>Detects Malicious Behavior</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  The design would flag persistent outlier votes for human investigation while retaining legitimate dissent. It has not demonstrated resistance to malicious or correlated legs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-emerald-600 mb-2" />
                <CardTitle>Balances AI Speed with Human Wisdom</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  The intended workflow uses automated review for repeatable checks and sends significant disagreement to accountable human reviewers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Vote className="h-8 w-8 text-emerald-600 mb-2" />
                <CardTitle>Creates Transparent Accountability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  The target vote record is Ed25519-signed and SHA-256 hash-chained with its seat ID. Independent external time-anchoring is planned, not yet live; the proposed chain would prove record integrity, not the wall-clock time of signing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Technical Specifications</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Design Parameters</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Total Agents</span>
                  <Badge variant="secondary">33</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Required for Consensus</span>
                  <Badge variant="secondary">23 (⅔ + 1)</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Supermajority margin</span>
                  <Badge variant="secondary">up to 10 dissent</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Operational status</span>
                  <Badge variant="secondary">Design only</Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-4">Vote Options</h3>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="font-bold text-emerald-900">Agree</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    The analyst's report is accurate, evidence is sufficient, and the recommendation is appropriate for the identified risks.
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-bold text-red-900">Disagree</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    The report contains errors, missing evidence, or the recommendation does not match the severity of identified risks.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900">Abstain</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Insufficient information to make a determination. Requires additional documentation or clarification from the analyst.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Explore the Council design
          </h2>
          <p className="text-xl mb-8 text-emerald-50">
            Review the proposed workflow, then inspect the measurements that currently constrain its claims.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/training">
              <Button size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-gray-100">
                Explore Training
              </Button>
            </Link>
            <Link href="/council">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-emerald-500">
                Read Current Status
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
