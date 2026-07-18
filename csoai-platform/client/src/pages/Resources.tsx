import { Download, FileText, Video, BookOpen, CheckSquare, FileSpreadsheet, Presentation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Resources() {
  const guides = [
    {
      title: "AI System Registration Guide",
      description: "Step-by-step instructions for registering your AI systems and initiating compliance assessments.",
      type: "PDF",
      pages: 24,
      updated: "2025-01-20",
      category: "Getting Started",
    },
    {
      title: "PDCA Cycle Implementation Playbook",
      description: "Comprehensive guide to implementing Plan-Do-Check-Act cycles for continuous AI governance improvement.",
      type: "PDF",
      pages: 42,
      updated: "2025-01-18",
      category: "Methodology",
    },
    {
      title: "Watchdog Analyst Certification Manual",
      description: "Complete training materials for becoming a certified AI safety watchdog analyst.",
      type: "PDF",
      pages: 68,
      updated: "2025-01-15",
      category: "Training",
    },
    {
      title: "33-Agent Council Technical Specification",
      description: "Detailed documentation of the Byzantine consensus voting mechanism and agent architecture.",
      type: "PDF",
      pages: 35,
      updated: "2025-01-22",
      category: "Technical",
    },
  ];

  const templates = [
    {
      title: "Compliance Assessment Checklist",
      description: "Comprehensive checklist covering EU AI Act, NIST AI RMF, and ISO/IEC 42001 requirements.",
      type: "Excel",
      format: ".xlsx",
    },
    {
      title: "Risk Assessment Matrix",
      description: "Pre-built matrix for evaluating AI system risks across multiple frameworks.",
      type: "Excel",
      format: ".xlsx",
    },
    {
      title: "PDCA Cycle Worksheet",
      description: "Structured template for documenting Plan-Do-Check-Act improvement cycles.",
      type: "Word",
      format: ".docx",
    },
    {
      title: "Incident Report Template",
      description: "Standardized format for submitting watchdog reports on AI safety incidents.",
      type: "Word",
      format: ".docx",
    },
    {
      title: "Compliance Scorecard Template",
      description: "Visual dashboard template for tracking compliance scores across frameworks.",
      type: "PowerPoint",
      format: ".pptx",
    },
    {
      title: "Council Session Report Template",
      description: "Template for documenting 33-agent council voting sessions and decisions.",
      type: "Word",
      format: ".docx",
    },
  ];

  const videos = [
    {
      title: "COAI Platform Overview",
      duration: "12:34",
      views: "2.4K",
      thumbnail: "/api/placeholder/400/225",
    },
    {
      title: "How to Register Your First AI System",
      duration: "8:15",
      views: "1.8K",
      thumbnail: "/api/placeholder/400/225",
    },
    {
      title: "Understanding the 33-Agent Council",
      duration: "15:42",
      views: "3.1K",
      thumbnail: "/api/placeholder/400/225",
    },
    {
      title: "PDCA Cycles for AI Governance",
      duration: "18:20",
      views: "1.5K",
      thumbnail: "/api/placeholder/400/225",
    },
    {
      title: "Becoming a Watchdog Analyst",
      duration: "22:10",
      views: "892",
      thumbnail: "/api/placeholder/400/225",
    },
    {
      title: "API Integration Tutorial",
      duration: "14:55",
      views: "1.2K",
      thumbnail: "/api/placeholder/400/225",
    },
  ];

  const bestPractices = [
    {
      title: "Multi-Framework Compliance Strategy",
      description: "How to efficiently comply with EU AI Act, NIST AI RMF, and ISO/IEC 42001 simultaneously.",
      readTime: "8 min",
    },
    {
      title: "Building an AI Safety Culture",
      description: "Organizational best practices for embedding AI governance into company culture.",
      readTime: "12 min",
    },
    {
      title: "Effective PDCA Cycle Management",
      description: "Proven strategies for running successful continuous improvement cycles.",
      readTime: "10 min",
    },
    {
      title: "Responding to Watchdog Reports",
      description: "Best practices for handling public AI safety incident reports professionally.",
      readTime: "6 min",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-900 to-green-700 text-white py-16">
        <div className="container">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">Resources Library</Badge>
            <h1 className="text-4xl font-bold mb-4">Implementation Resources</h1>
            <p className="text-xl text-green-100">
              Comprehensive guides, templates, and tools to help you implement AI governance frameworks
              and achieve compliance. All resources are free to download and use.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        <Tabs defaultValue="guides" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="guides">Implementation Guides</TabsTrigger>
            <TabsTrigger value="templates">Templates & Tools</TabsTrigger>
            <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
            <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
          </TabsList>

          {/* Implementation Guides */}
          <TabsContent value="guides">
            <div className="grid md:grid-cols-2 gap-6">
              {guides.map((guide, idx) => (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{guide.title}</h3>
                        <Badge variant="outline">{guide.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{guide.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span>{guide.pages} pages • {guide.type}</span>
                        <span>Updated {guide.updated}</span>
                      </div>
                      <Button className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Templates & Tools */}
          <TabsContent value="templates">
            <div className="grid md:grid-cols-3 gap-6">
              {templates.map((template, idx) => (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 bg-primary/10 rounded-lg mb-4">
                      {template.type === "Excel" && <FileSpreadsheet className="h-8 w-8 text-green-600" />}
                      {template.type === "Word" && <FileText className="h-8 w-8 text-blue-600" />}
                      {template.type === "PowerPoint" && <Presentation className="h-8 w-8 text-orange-600" />}
                    </div>
                    <h3 className="font-semibold mb-2">{template.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                    <Badge variant="secondary" className="mb-4">{template.format}</Badge>
                    <Button className="w-full" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Video Tutorials */}
          <TabsContent value="videos">
            <div className="grid md:grid-cols-3 gap-6">
              {videos.map((video, idx) => (
                <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative aspect-video bg-muted flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{video.title}</h3>
                    <p className="text-xs text-muted-foreground">{video.views} views</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Best Practices */}
          <TabsContent value="best-practices">
            <div className="grid gap-6">
              {bestPractices.map((practice, idx) => (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{practice.title}</h3>
                        <Badge variant="outline">{practice.readTime} read</Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{practice.description}</p>
                      <Button variant="link" className="p-0">
                        Read Article →
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-3">Can't Find What You Need?</h3>
            <p className="text-muted-foreground mb-6">
              Request custom resources or suggest new templates for the community.
            </p>
            <div className="flex gap-3 justify-center">
              <Button size="lg">Request Resource</Button>
              <Button size="lg" variant="outline">Contact Support</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
