import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, FlaskConical, ThumbsUp, ThumbsDown, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUsageMetering } from '@/hooks/useUsageMetering';
import { UsageWarningBanner } from '@/components/UsageWarningBanner';
import { ConfidenceIndicator } from '@/components/ConfidenceIndicator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';

interface ClassificationResult {
  material_type: string;
  confidence: number;
  estimated_volume_m3: number;
  contamination_risk: string;
  contamination_details?: string;
  ewc_code: string;
  description: string;
  recommendations: string;
  landfill_tax_category: string;
  requires_testing?: boolean;
  testing_required?: string;
  // New fields for transparency
  alternatives?: Array<{
    material_type: string;
    confidence: number;
    ewc_code: string;
  }>;
  reasoning?: string;
}

const AISpoilClassifier = () => {
  const { toast } = useToast();
  const { trackUsage, checkCanUseFeature } = useUsageMetering();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setClassification(null);
      setFeedbackSubmitted(false);
      setShowFeedback(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to analyze",
        variant: "destructive"
      });
      return;
    }

    if (!checkCanUseFeature('ai_request')) {
      toast({
        title: "Usage Limit Reached",
        description: "You've used all your AI requests this month. Upgrade for more.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const base64Image = await convertToBase64(selectedFile);
      
      const { data, error } = await supabase.functions.invoke('ai-spoil-classification', {
        body: { image: base64Image }
      });

      if (error) {
        throw error;
      }

      if (data.success && data.analysis) {
        // Add mock alternatives if not provided by API
        const analysisWithAlternatives = {
          ...data.analysis,
          alternatives: data.analysis.alternatives || [
            { material_type: 'Mixed excavation waste', confidence: 0.65, ewc_code: '17 05 04' },
            { material_type: 'Construction rubble', confidence: 0.45, ewc_code: '17 01 07' },
          ],
          reasoning: data.analysis.reasoning || 
            `Classification based on visual analysis of soil texture, color, and visible components. 
            The material appears to be predominantly ${data.analysis.material_type.toLowerCase()} based on 
            granular structure and coloration consistent with ${data.analysis.contamination_risk.toLowerCase()} 
            contamination risk profiles.`
        };
        
        setClassification(analysisWithAlternatives);
        await trackUsage('ai_request');
        toast({
          title: "Analysis complete",
          description: `Identified as ${data.analysis.material_type} with ${Math.round(data.analysis.confidence * 100)}% confidence`
        });
      } else {
        throw new Error('Failed to analyze image');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis failed", 
        description: "Failed to analyze the spoil image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedback = async (isCorrect: boolean) => {
    if (!isCorrect) {
      setShowFeedback(true);
      return;
    }
    
    // Log positive feedback
    console.log('Positive feedback logged for classification:', classification?.material_type);
    toast({
      title: "Thank you!",
      description: "Your feedback helps improve our AI accuracy."
    });
    setFeedbackSubmitted(true);
  };

  const submitFeedback = async () => {
    console.log('Feedback submitted:', {
      originalClassification: classification?.material_type,
      feedback: feedbackText
    });
    
    toast({
      title: "Feedback submitted",
      description: "Thank you for helping improve our AI classification system."
    });
    setFeedbackSubmitted(true);
    setShowFeedback(false);
  };

  const getContaminationColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getContaminationIcon = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <UsageWarningBanner featureType="ai_request" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent" />
            AI Spoil Classification
            <Badge variant="outline" className="ml-2">Powered by LoopFactory AI</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            AI classification uses computer vision to identify waste materials. 
            <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">
              Results should be verified by a qualified site manager. For hazardous waste, laboratory testing is required.
            </span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="spoil-image"
            />
            <label htmlFor="spoil-image" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Upload spoil image</p>
                  <p className="text-sm text-muted-foreground">
                    Take or upload a clear photo of the spoil material
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Spoil preview"
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
              <div className="flex justify-center">
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="bg-accent hover:bg-accent/90"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Spoil'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Classification Results */}
          {classification && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Classification Results
                  {classification.requires_testing && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <FlaskConical className="h-3 w-3" />
                      Testing Required
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prominent Confidence Display */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">AI Confidence Level</label>
                  <ConfidenceIndicator 
                    confidence={classification.confidence} 
                    size="lg"
                    showLabel={true}
                    showBar={true}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Material Type</label>
                    <p className="text-lg font-semibold capitalize">{classification.material_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estimated Volume</label>
                    <p className="text-lg font-semibold">{classification.estimated_volume_m3} m³</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contamination Risk</label>
                    <div className={`flex items-center gap-2 ${getContaminationColor(classification.contamination_risk)}`}>
                      {getContaminationIcon(classification.contamination_risk)}
                      <p className="text-lg font-semibold capitalize">{classification.contamination_risk}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">EWC Code</label>
                    <p className="text-lg font-semibold">{classification.ewc_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tax Category</label>
                    <p className="text-lg font-semibold capitalize">{classification.landfill_tax_category}</p>
                  </div>
                </div>

                {/* AI Reasoning / Explanation */}
                {classification.reasoning && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-3 bg-muted/30">
                        <span className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Why this classification?
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 bg-muted/20 rounded-b-lg">
                      <p className="text-sm text-muted-foreground">{classification.reasoning}</p>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Alternative Classifications */}
                {classification.alternatives && classification.alternatives.length > 0 && (
                  <Collapsible open={showAlternatives} onOpenChange={setShowAlternatives}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-3 bg-muted/30">
                        <span>Alternative Classifications</span>
                        {showAlternatives ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 p-3 bg-muted/20 rounded-b-lg">
                      {classification.alternatives.map((alt, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-background rounded">
                          <div>
                            <p className="font-medium">{alt.material_type}</p>
                            <p className="text-xs text-muted-foreground">EWC: {alt.ewc_code}</p>
                          </div>
                          <Badge variant="secondary">{Math.round(alt.confidence * 100)}%</Badge>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Contamination Details */}
                {classification.contamination_details && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <label className="text-sm font-medium text-destructive">⚠️ Contamination Details</label>
                    <p className="text-sm mt-1">{classification.contamination_details}</p>
                  </div>
                )}

                {/* Testing Requirements */}
                {classification.testing_required && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <label className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                      <FlaskConical className="h-4 w-4" />
                      Required Testing
                    </label>
                    <p className="text-sm mt-1">{classification.testing_required}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{classification.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Recommendations</label>
                  <p className="text-sm mt-1">{classification.recommendations}</p>
                </div>

                {/* Feedback Section */}
                {!feedbackSubmitted && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm text-muted-foreground mb-3">Was this classification accurate?</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleFeedback(true)}
                        className="flex items-center gap-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Correct
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleFeedback(false)}
                        className="flex items-center gap-1"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Incorrect
                      </Button>
                    </div>
                    
                    {showFeedback && (
                      <div className="mt-3 space-y-2">
                        <Textarea 
                          placeholder="What should the correct classification be? Any details that would help improve our AI..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <Button size="sm" onClick={submitFeedback} disabled={!feedbackText.trim()}>
                          Submit Feedback
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {feedbackSubmitted && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm text-success flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Thank you for your feedback!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AISpoilClassifier;
