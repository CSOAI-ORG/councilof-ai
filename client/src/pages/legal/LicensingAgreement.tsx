import { motion } from "framer-motion";
import { Shield, FileCheck, Layers, CreditCard, ClipboardCheck, AlertTriangle, Clock, Scale, Eye, Building2, CheckCircle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const licenseTiers = [
  {
    tier: "Tier 1",
    risk: "Minimal",
    examples: "Spam filters, basic recommendation",
    frequency: "Annual self-assessment",
    color: "bg-green-500",
    baseFee: "Included",
    perSystem: "£500"
  },
  {
    tier: "Tier 2",
    risk: "Limited",
    examples: "Customer service bots, content moderation",
    frequency: "Annual + random audits",
    color: "bg-blue-500",
    baseFee: "Included",
    perSystem: "£2,000"
  },
  {
    tier: "Tier 3",
    risk: "High",
    examples: "Healthcare AI, financial decisions, hiring",
    frequency: "Quarterly review",
    color: "bg-orange-500",
    baseFee: "Included",
    perSystem: "£10,000"
  },
  {
    tier: "Tier 4",
    risk: "Critical",
    examples: "Autonomous vehicles, infrastructure, weapons",
    frequency: "Continuous monitoring",
    color: "bg-red-500",
    baseFee: "Included",
    perSystem: "£25,000+"
  }
];

const insuranceRequirements = [
  { tier: "Tier 1", coverage: "Recommended only", color: "text-green-600" },
  { tier: "Tier 2", coverage: "£1M Professional Indemnity", color: "text-blue-600" },
  { tier: "Tier 3", coverage: "£5M Professional Indemnity + £5M Public Liability", color: "text-orange-600" },
  { tier: "Tier 4", coverage: "£10M+ (custom requirements)", color: "text-red-600" }
];

const incidentTimelines = [
  { severity: "Critical", time: "1 hour", color: "bg-red-500" },
  { severity: "High-risk", time: "24 hours", color: "bg-orange-500" },
  { severity: "Medium-risk", time: "7 days", color: "bg-yellow-500" },
  { severity: "Low-risk", time: "30 days", color: "bg-green-500" }
];

export default function LicensingAgreement() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-blue-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <FileCheck className="h-3 w-3 mr-1" />
              Legal Document
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI Safety Licensing Agreement
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Council Safety of Artificial Intelligence (CSOAI)
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Version 1.0</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Effective: January 2026</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Section 2: Definitions */}
          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Key Definitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { term: "AI System", definition: "Any artificial intelligence system submitted for CSOAI licensing" },
                    { term: "License", definition: "Authorization to operate AI systems under CSOAI governance" },
                    { term: "License Tier", definition: "Classification based on AI system risk level (Articles 6-9 of Charter)" },
                    { term: "Council", definition: "CSOAI's automated monitoring infrastructure" },
                    { term: "Charter", definition: "The CSOAI 52-article Partnership Charter" }
                  ].map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted">
                      <p className="font-semibold text-sm">{item.term}</p>
                      <p className="text-sm text-muted-foreground">{item.definition}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* TRUNCATED_FOR_SIZE_CHECK */}
        </div>
      </div>
    </div>
  );
}
