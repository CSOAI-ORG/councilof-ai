/**
 * Framework Landing Page Component
 * Reusable template for individual regulatory framework pages
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, BookOpen, Award, Users } from 'lucide-react';
import { Link } from 'wouter';

interface FrameworkLandingPageProps {
  frameworkId: string;
  frameworkName: string;
  region: string;
  description: string;
  deadline: string;
  threats: string[];
  keyRequirements: string[];
  trainingModules: {
    title: string;
    description: string;
    duration: string;
  }[];
  comingSoon?: boolean;
  certificationInfo: {
    examLength: number;
    passingScore: number;
    validity: string;
  };
}

export function FrameworkLandingPage({
  frameworkId,
  frameworkName,
  region,
  description,
  deadline,
  threats,
  keyRequirements,
  trainingModules,
  comingSoon = false,
  certificationInfo,
}: FrameworkLandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Badge className="mb-4 bg-white/20 text-white border-white/30">{region}</Badge>
              <h1 className="text-5xl font-bold mb-4">{frameworkName}</h1>
              <p className="text-xl text-blue-100 max-w-2xl">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-100">
            <Clock className="w-5 h-5" />
            <span>Enforcement deadline: {new Date(deadline).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Threats & Risks Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Threats & Requirements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Threats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Regulatory Threats
                </CardTitle>
                <CardDescription>Non-compliance risks under {frameworkName}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {threats.map((threat, idx) => (
                    <li key={idx} className="flex gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                      <span className="text-sm text-gray-700">{threat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Key Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Key Requirements
                </CardTitle>
                <CardDescription>What you need to know to comply</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {keyRequirements.map((req, idx) => (
                    <li key={idx} className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                      <span className="text-sm text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Training Modules */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Training Modules</h2>
          {comingSoon && (
            <Alert className="mb-8 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Full training modules launching Q2 2026. Early access to practice questions available now.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid md:grid-cols-3 gap-6">
            {trainingModules.map((module, idx) => (
              <Card key={idx} className={comingSoon ? 'opacity-75' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{module.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {module.duration}
                  </div>
                  {!comingSoon && (
                    <Link href={`/training/catalog?framework=${frameworkId}`}>
                      <Button className="w-full" size="sm">
                        Start Module
                      </Button>
                    </Link>
                  )}
                  {comingSoon && (
                    <Button className="w-full" size="sm" disabled>
                      Coming Q2 2026
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Certification Info */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                {frameworkName} Certification
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-2">Exam Length</p>
                <p className="text-3xl font-bold text-emerald-600">{certificationInfo.examLength}</p>
                <p className="text-sm text-gray-600">minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Passing Score</p>
                <p className="text-3xl font-bold text-emerald-600">{certificationInfo.passingScore}%</p>
                <p className="text-sm text-gray-600">required</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Certificate Validity</p>
                <p className="text-3xl font-bold text-emerald-600">{certificationInfo.validity}</p>
                <p className="text-sm text-gray-600">years</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Master {frameworkName}?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of AI safety professionals learning to comply with the world's most important AI regulations.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/training/catalog">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                View Training Catalog
              </Button>
            </Link>
            <Link href="/certification">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn About Certification
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
