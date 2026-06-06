import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkflowIntegration } from '@/components/WorkflowIntegration';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Calculator, FileCheck, Truck } from 'lucide-react';

export const QuoteToJobWorkflow = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-primary">
              AI-Powered Quote to Job Workflow
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the complete automated workflow from AI classification to job completion. 
              Our revolutionary system connects every step seamlessly.
            </p>
          </div>

          {/* Workflow Steps */}
          <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-primary/5">
            <CardHeader>
              <CardTitle className="text-center">Complete Workflow Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Calculator className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">1. AI Classification</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload images for instant AI analysis and material classification
                  </p>
                </div>
                
                <div className="hidden md:flex items-center justify-center">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>

                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <FileCheck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">2. Auto Quote Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatic pricing based on AI analysis with real-time calculations
                  </p>
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>

                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Truck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">3. Job Creation</h3>
                  <p className="text-sm text-muted-foreground">
                    One-click conversion to confirmed job with scheduling
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Workflow */}
          <WorkflowIntegration />

          {/* Features Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🤖 AI-Powered Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced computer vision analyzes your spoil images with 95%+ accuracy, 
                  automatically detecting material types, contamination levels, and volume estimates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚡ Real-Time Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dynamic pricing engine calculates costs instantly based on material type, 
                  volume, contamination level, and current market rates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔄 Seamless Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Complete end-to-end workflow from initial quote to job completion, 
                  with automated notifications and progress tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteToJobWorkflow;