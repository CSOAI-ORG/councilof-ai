import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { CheckCircle, BookOpen, Award, Users, Zap, Globe } from "lucide-react";
export default function CEASAITraining() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-white via-emerald-50 to-emerald-100 py-24">
          <div className="container max-w-4xl space-y-4">
            <Skeleton className="h-8 w-32 bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  const modules = [
    {
      title: "AI Safety Fundamentals",
      duration: "1.5 hours",
      topics: ["What is AI Safety?", "Risk Assessment", "Compliance Overview"],
      icon: BookOpen
    },
    {
      title: "EU AI Act Deep Dive",
      duration: "2 hours",
      topics: ["High-Risk AI Categories", "Conformity Assessment", "CE Marking"],
      icon: Globe
    },
    {
      title: "NIST AI RMF",
      duration: "1.5 hours",
      topics: ["Govern Phase", "Map Phase", "Measure & Manage Phases"],
      icon: Award
    },
    {
      title: "Incident Analysis",
      duration: "1 hour",
      topics: ["Real-World Cases", "Root Cause Analysis", "Remediation"],
      icon: Zap
    }
  ];

  const benefits = [
    "Industry-recognized measurement credential",
    "Global job opportunities",
    "Competitive compensation",
    "100% remote work",
    "Flexible schedule",
    "Continuous learning"
  ];

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-white via-emerald-50 to-emerald-100 py-24">
          <div className="container max-w-4xl">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              Measurement credential program
            </Badge>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              AI Safety Analyst Training
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Comprehensive training program aligned with CSOAI measurement standards. Learn from industry experts and earn a measurement credential to monitor AI systems for compliance and safety.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Start Free Training
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-4xl py-20">
          {/* What You'll Learn */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              What You'll Learn
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {modules.map((module, idx) => {
                const Icon = module.icon;
                return (
                  <Card key={idx} className="p-6 border border-gray-200 hover:border-emerald-600 transition-colors">
                    <div className="flex items-start gap-4 mb-4">
                      <Icon className="h-8 w-8 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{module.duration}</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {module.topics.map((topic, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-700">
                          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Training Structure */}
          <div className="mb-20 bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Training Structure</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="text-emerald-600 font-bold min-w-fit">Module 1</div>
                <div>
                  <p className="font-semibold text-gray-900">Foundations (1.5 hours)</p>
                  <p className="text-gray-600">Learn AI safety basics, risk frameworks, and compliance overview</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-emerald-600 font-bold min-w-fit">Module 2</div>
                <div>
                  <p className="font-semibold text-gray-900">EU AI Act (2 hours)</p>
                  <p className="text-gray-600">Deep dive into EU AI Act requirements, risk categories, and compliance</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-emerald-600 font-bold min-w-fit">Module 3</div>
                <div>
                  <p className="font-semibold text-gray-900">NIST AI RMF (1.5 hours)</p>
                  <p className="text-gray-600">NIST AI Risk Management Framework phases and implementation</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-emerald-600 font-bold min-w-fit">Module 4</div>
                <div>
                  <p className="font-semibold text-gray-900">Case Studies (1 hour)</p>
                  <p className="text-gray-600">Real-world incident analysis and remediation strategies</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-emerald-600 font-bold min-w-fit">Exam</div>
                <div>
                  <p className="font-semibold text-gray-900">Measurement assessment (90 minutes)</p>
                  <p className="text-gray-600">50 questions, 70% to pass, unlimited retakes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Why choose this training? */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Why Choose This Training?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certification Value */}
          <div className="mb-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your measurement credential</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <Award className="h-8 w-8 text-emerald-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Industry Recognized</h3>
                <p className="text-gray-600">Built on published frameworks (EU AI Act, NIST AI RMF, ISO 42001)</p>
              </div>
              
              <div>
                <Globe className="h-8 w-8 text-emerald-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Global Opportunities</h3>
                <p className="text-gray-600">Work with companies across all industries and regions</p>
              </div>
              
              <div>
                <Users className="h-8 w-8 text-emerald-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Community</h3>
                <p className="text-gray-600">Join AI Safety Analysts worldwide</p>
              </div>
            </div>
          </div>

          {/* Career Path */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Your Career Path</h2>
            
            <div className="space-y-4">
              <Card className="p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">Entry Level (0-6 months)</h3>
                <p className="text-gray-600">Basic compliance assessments • Supervised reviews</p>
              </Card>
              
              <Card className="p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">Intermediate (6-18 months)</h3>
                <p className="text-gray-600">Complex assessments • Incident analysis • Mentoring</p>
              </Card>
              
              <Card className="p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">Advanced (18+ months)</h3>
                <p className="text-gray-600">Specialist roles • Leadership • Training others</p>
              </Card>
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Common Questions</h2>
            
            <div className="space-y-4">
              <Card className="p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">How long until I can start earning?</h3>
                <p className="text-gray-600">Most students complete training and assessment in 1 day and start earning within 1-2 weeks after earning the credential.</p>
              </Card>
              
              <Card className="p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">Is this training aligned with EU AI Act requirements?</h3>
                <p className="text-gray-600">Yes, our training is specifically designed to meet CSOAI measurement standards and EU AI Act compliance requirements.</p>
              </Card>
              
              <Card className="p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">Can I get a refund if I'm not satisfied?</h3>
                <p className="text-gray-600">The training is free, so there's no refund needed. If you don't pass the exam, you can retake it unlimited times at no cost.</p>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to earn your measurement credential?</h2>
            <p className="text-lg mb-8 text-emerald-50">
              Start your free training today. No credit card required.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                Start Training Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
