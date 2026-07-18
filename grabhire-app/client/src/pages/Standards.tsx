import { Download, FileText, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Standards() {
  const frameworks = [
    {
      id: "eu-ai-act",
      name: "EU AI Act",
      fullName: "European Union Artificial Intelligence Act",
      version: "v1.0",
      status: "Published",
      date: "2024-03-13",
      description: "Comprehensive regulatory framework for AI systems in the European Union, establishing risk-based requirements and compliance obligations.",
      coverage: ["Risk Classification", "Transparency Requirements", "Data Governance", "Human Oversight", "Conformity Assessment"],
      pdfUrl: "/docs/eu-ai-act-implementation-guide.pdf",
      externalUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021PC0206",
    },
    {
      id: "nist-ai-rmf",
      name: "NIST AI RMF",
      fullName: "NIST Artificial Intelligence Risk Management Framework",
      version: "v1.0",
      status: "Published",
      date: "2023-01-26",
      description: "Voluntary framework from the U.S. National Institute of Standards and Technology for managing AI risks across the lifecycle.",
      coverage: ["Govern", "Map", "Measure", "Manage", "Risk Assessment", "Trustworthy AI"],
      pdfUrl: "/docs/nist-ai-rmf-guide.pdf",
      externalUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    },
    {
      id: "iso-42001",
      name: "ISO/IEC 42001",
      fullName: "ISO/IEC 42001:2023 - AI Management System",
      version: "v1.0",
      status: "Published",
      date: "2023-12-18",
      description: "International standard specifying requirements for establishing, implementing, maintaining, and continually improving an AI management system.",
      coverage: ["AI Policy", "Risk Management", "Data Quality", "AI Lifecycle", "Continuous Improvement"],
      pdfUrl: "/docs/iso-42001-implementation.pdf",
      externalUrl: "https://www.iso.org/standard/81230.html",
    },
    {
      id: "tc260-western",
      name: "COAI Framework",
      fullName: "Council of AI - Western AI Safety Governance Framework",
      version: "v1.0",
      status: "Active Development",
      date: "2025-01-15",
      description: "Western equivalent to China's TC260, establishing comprehensive AI safety governance through Byzantine consensus and public watchdog oversight.",
      coverage: ["33-Agent Council", "Watchdog System", "PDCA Cycles", "Compliance Scoring", "Public Transparency"],
      pdfUrl: "/docs/coai-framework-v1.pdf",
      externalUrl: null,
    },
  ];

  const additionalStandards = [
    { name: "OECD AI Principles", status: "Reference", url: "https://oecd.ai/en/ai-principles" },
    { name: "IEEE 7000 Series", status: "Reference", url: "https://standards.ieee.org/industry-connections/ec/autonomous-systems.html" },
    { name: "UK AI Regulation", status: "Monitoring", url: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach" },
    { name: "Singapore Model AI Governance", status: "Reference", url: "https://www.pdpc.gov.sg/help-and-resources/2020/01/model-ai-governance-framework" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="container">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">Standards & Frameworks</Badge>
            <h1 className="text-4xl font-bold mb-4">AI Governance Standards</h1>
            <p className="text-xl text-blue-100">
              Comprehensive implementation guides for global AI safety and compliance frameworks.
              COAI provides Western-adapted standards equivalent to China's TC260, ensuring your AI systems
              meet international regulatory requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        {/* Primary Frameworks */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Primary Frameworks</h2>
          <div className="grid gap-6">
            {frameworks.map((framework) => (
              <Card key={framework.id} className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{framework.name}</h3>
                      <Badge variant={framework.status === "Published" ? "default" : "secondary"}>
                        {framework.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{framework.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      Version {framework.version} • Published {framework.date}
                    </p>
                  </div>
                  <FileText className="h-12 w-12 text-primary" />
                </div>

                <p className="text-foreground/80 mb-6">{framework.description}</p>

                {/* Coverage Areas */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">COVERAGE AREAS</h4>
                  <div className="flex flex-wrap gap-2">
                    {framework.coverage.map((area) => (
                      <Badge key={area} variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Implementation Guide
                  </Button>
                  {framework.externalUrl && (
                    <Button variant="outline" className="flex items-center gap-2" asChild>
                      <a href={framework.externalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Official Source
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Standards */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Additional Standards & References</h2>
          <Card className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {additionalStandards.map((standard) => (
                <div key={standard.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{standard.name}</p>
                    <p className="text-sm text-muted-foreground">{standard.status}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={standard.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Comparison Matrix */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Framework Comparison Matrix</h2>
          <Card className="p-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Feature</th>
                  <th className="text-center p-3 font-semibold">EU AI Act</th>
                  <th className="text-center p-3 font-semibold">NIST AI RMF</th>
                  <th className="text-center p-3 font-semibold">ISO/IEC 42001</th>
                  <th className="text-center p-3 font-semibold">COAI Framework</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Legal Binding</td>
                  <td className="text-center p-3">✅ Mandatory (EU)</td>
                  <td className="text-center p-3">❌ Voluntary</td>
                  <td className="text-center p-3">✅ Certification</td>
                  <td className="text-center p-3">✅ Self-Regulation</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Risk Classification</td>
                  <td className="text-center p-3">✅ 4 Levels</td>
                  <td className="text-center p-3">✅ Continuous</td>
                  <td className="text-center p-3">✅ Context-Based</td>
                  <td className="text-center p-3">✅ Multi-Framework</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Public Oversight</td>
                  <td className="text-center p-3">❌ Government Only</td>
                  <td className="text-center p-3">❌ No Mechanism</td>
                  <td className="text-center p-3">❌ Auditor Only</td>
                  <td className="text-center p-3">✅ Watchdog System</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Continuous Improvement</td>
                  <td className="text-center p-3">⚠️ Periodic Review</td>
                  <td className="text-center p-3">✅ Lifecycle Focus</td>
                  <td className="text-center p-3">✅ PDCA Built-in</td>
                  <td className="text-center p-3">✅ PDCA Cycles</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Transparency</td>
                  <td className="text-center p-3">✅ Required</td>
                  <td className="text-center p-3">✅ Recommended</td>
                  <td className="text-center p-3">⚠️ Internal</td>
                  <td className="text-center p-3">✅ Public Dashboard</td>
                </tr>
                <tr>
                  <td className="p-3">Decentralized Governance</td>
                  <td className="text-center p-3">❌ Centralized</td>
                  <td className="text-center p-3">❌ No Governance</td>
                  <td className="text-center p-3">❌ Org-Level Only</td>
                  <td className="text-center p-3">✅ 33-Agent Council</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        {/* CTA */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-3">Need Implementation Support?</h3>
            <p className="text-muted-foreground mb-6">
              Our team provides expert guidance on implementing these frameworks for your AI systems.
            </p>
            <div className="flex gap-3 justify-center">
              <Button size="lg">Schedule Consultation</Button>
              <Button size="lg" variant="outline">Download All Guides</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
