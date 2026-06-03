import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { useUsageMetering } from '@/hooks/useUsageMetering';
import { UsageWarningBanner } from '@/components/UsageWarningBanner';
import { 
  Upload, 
  Camera, 
  Brain, 
  Eye, 
  Zap, 
  FileCheck2,
  AlertTriangle,
  MapPin,
  Clock,
  TrendingUp,
  Loader2,
  CheckCircle,
  Lock
} from 'lucide-react';

interface ImageAnalysis {
  imageId: string;
  imageName: string;
  detectedMaterial: string;
  confidenceLevel: number;
  estimatedVolume: number;
  contaminationRisk: string;
  ewcCode: string;
  landfillTaxCategory: string;
  visualAnalysis: string;
  riskAssessment: string;
  recommendations: string[];
  processingTime: number;
}

interface BatchAnalysisResult {
  totalImages: number;
  averageConfidence: number;
  dominantMaterial: string;
  totalEstimatedVolume: number;
  highestRisk: string;
  overallRecommendations: string[];
  analyses: ImageAnalysis[];
}

export const RevolutionaryImageAnalyzer = () => {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [batchResult, setBatchResult] = useState<BatchAnalysisResult | null>(null);
  const [selectedImageAnalysis, setSelectedImageAnalysis] = useState<ImageAnalysis | null>(null);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [completedImageIndices, setCompletedImageIndices] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canAccessFeature, requiresUpgrade } = useSubscriptionGate();
  const { trackUsage, checkCanUseFeature, usage } = useUsageMetering();
  const hasAccess = canAccessFeature('advanced_image_analysis');
  const needsUpgrade = requiresUpgrade('advanced_image_analysis');

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 10) {
      toast({
        title: "Too Many Images",
        description: "Maximum 10 images allowed for batch processing",
        variant: "destructive"
      });
      return;
    }

    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Some files were skipped. Only images under 10MB are allowed.",
        variant: "destructive"
      });
    }

    setUploadedImages(validFiles);
    
    if (validFiles.length > 0) {
      toast({
        title: `${validFiles.length} Images Ready`,
        description: "Click 'Analyze with Revolutionary AI' to process with advanced vision models",
      });
    }
  }, [toast]);

  const processBatchImages = async () => {
    if (uploadedImages.length === 0) return;

    // Check if batch would exceed limits
    if (usage && usage.ai_requests.limit !== -1) {
      const remaining = usage.ai_requests.limit - usage.ai_requests.current;
      if (uploadedImages.length > remaining) {
        toast({
          title: "Insufficient AI Requests",
          description: `You have ${remaining} requests remaining but are trying to process ${uploadedImages.length} images. Please upgrade your plan.`,
          variant: "destructive"
        });
        return;
      }
    }

    // Check general usage access
    if (!checkCanUseFeature('ai_request')) {
      toast({
        title: "Usage Limit Reached",
        description: "You've used all your AI requests this month. Upgrade for more.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setCurrentProcessingIndex(-1);
    setCompletedImageIndices(new Set());
    
    try {
      const analyses: ImageAnalysis[] = [];
      
      for (let i = 0; i < uploadedImages.length; i++) {
        const file = uploadedImages[i];
        const startTime = Date.now();
        
        // Set current processing image BEFORE processing
        setCurrentProcessingIndex(i);
        
        // Update progress
        setProcessingProgress((i / uploadedImages.length) * 100);
        
        // Convert to base64
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Call enhanced AI analysis
        const { data, error } = await supabase.functions.invoke('ai-spoil-classifier', {
          body: { 
            image: base64Image,
            enhancedMode: true,
            includeRiskAssessment: true,
            includeVisualMapping: true
          }
        });

        if (error) {
          console.error(`Error analyzing image ${i + 1}:`, error);
          continue;
        }

        const processingTime = Date.now() - startTime;

        const analysis: ImageAnalysis = {
          imageId: `img_${i}_${Date.now()}`,
          imageName: file.name,
          detectedMaterial: data.material_type,
          confidenceLevel: Math.round(data.confidence * 100),
          estimatedVolume: data.estimated_volume_m3,
          contaminationRisk: data.contamination_risk,
          ewcCode: data.ewc_code,
          landfillTaxCategory: data.landfill_tax_category,
          visualAnalysis: data.description,
          riskAssessment: data.risk_assessment || "Standard risk profile for this material type",
          recommendations: data.recommendations || [],
          processingTime
        };

        analyses.push(analysis);
        
        // Track usage after successful analysis
        await trackUsage('ai_request');
        
        // Mark this image as completed AFTER processing
        setCompletedImageIndices(prev => new Set([...prev, i]));
      }

      // Reset processing index after completion
      setCurrentProcessingIndex(-1);

      // Calculate batch results
      const batchResult: BatchAnalysisResult = {
        totalImages: analyses.length,
        averageConfidence: Math.round(
          analyses.reduce((sum, a) => sum + a.confidenceLevel, 0) / analyses.length
        ),
        dominantMaterial: getMostCommonMaterial(analyses),
        totalEstimatedVolume: analyses.reduce((sum, a) => sum + a.estimatedVolume, 0),
        highestRisk: getHighestRisk(analyses),
        overallRecommendations: getOverallRecommendations(analyses),
        analyses
      };

      setBatchResult(batchResult);
      setProcessingProgress(100);

      toast({
        title: "🚀 Revolutionary Analysis Complete!",
        description: `Processed ${analyses.length} images with ${batchResult.averageConfidence}% average confidence`,
      });

    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to process images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getMostCommonMaterial = (analyses: ImageAnalysis[]): string => {
    const materialCounts = analyses.reduce((acc, analysis) => {
      acc[analysis.detectedMaterial] = (acc[analysis.detectedMaterial] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(materialCounts).reduce((a, b) => 
      materialCounts[a[0]] > materialCounts[b[0]] ? a : b
    )[0];
  };

  const getHighestRisk = (analyses: ImageAnalysis[]): string => {
    const riskLevels = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
    return analyses.reduce((highest, analysis) => {
      return (riskLevels[analysis.contaminationRisk as keyof typeof riskLevels] || 0) > 
             (riskLevels[highest as keyof typeof riskLevels] || 0) 
        ? analysis.contaminationRisk 
        : highest;
    }, 'none');
  };

  const getOverallRecommendations = (analyses: ImageAnalysis[]): string[] => {
    const allRecommendations = analyses.flatMap(a => a.recommendations);
    const uniqueRecommendations = Array.from(new Set(allRecommendations));
    return uniqueRecommendations.slice(0, 5); // Top 5 unique recommendations
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      <UsageWarningBanner featureType="ai_request" />
      
      {/* Header */}
      <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-accent" />
            Revolutionary AI Image Analyzer
            {needsUpgrade && (
              <Badge variant="outline" className="text-accent border-accent">
                <Lock className="h-3 w-3 mr-1" />
                Professional
              </Badge>
            )}
            <Badge variant="secondary" className="ml-auto">
              <Zap className="h-3 w-3 mr-1" />
              Powered by Google Gemini 2.5 Pro
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Upgrade Prompt for Non-Subscribers */}
      {needsUpgrade && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6 text-center">
            <Lock className="h-10 w-10 mx-auto text-accent mb-3" />
            <h3 className="font-semibold text-lg mb-2">Upgrade to Professional</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Multi-image batch analysis with contamination risk assessment is available on Professional and Enterprise plans.
            </p>
            <Button 
              onClick={() => navigate('/subscribe')}
              className="bg-accent hover:bg-accent/90"
            >
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Interface - Only show if user has access */}
      {hasAccess && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Multi-Image Upload (Up to 10 images)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-accent/30 rounded-lg p-8 text-center hover:border-accent/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Camera className="h-12 w-12 mx-auto text-accent/60 mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop images here or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Upload multiple spoil images for batch AI analysis (JPG, PNG, WEBP - Max 10MB each)
              </p>
            </div>
            
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {uploadedImages.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className={`w-full h-20 object-cover rounded-lg border transition-opacity ${
                          isProcessing && currentProcessingIndex === index ? 'opacity-50' : ''
                        }`}
                      />
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      
                      {/* Processing spinner overlay */}
                      {isProcessing && currentProcessingIndex === index && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin text-accent" />
                        </div>
                      )}
                      
                      {/* Completed checkmark overlay */}
                      {completedImageIndices.has(index) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={processBatchImages}
                  disabled={isProcessing}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  size="lg"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  {isProcessing ? 'Processing with Revolutionary AI...' : 'Analyze with Revolutionary AI'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Analysis Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(processingProgress)}%
                </span>
              </div>
              <Progress value={processingProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Processing images with advanced computer vision and contamination detection...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Results */}
      {batchResult && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <FileCheck2 className="h-5 w-5" />
                Batch Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{batchResult.totalImages}</div>
                  <div className="text-sm text-green-600">Images Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{batchResult.averageConfidence}%</div>
                  <div className="text-sm text-green-600">Avg. Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{batchResult.totalEstimatedVolume.toFixed(1)}m³</div>
                  <div className="text-sm text-green-600">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-green-600">Dominant Material</div>
                  <Badge className="mt-1">{batchResult.dominantMaterial}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-green-800">Overall Risk Assessment</h4>
                <Badge 
                  variant="outline" 
                  className={getRiskColor(batchResult.highestRisk)}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {batchResult.highestRisk.toUpperCase()} RISK
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-green-800">Key Recommendations</h4>
                <ul className="space-y-1">
                  {batchResult.overallRecommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Individual Results */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Image Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {batchResult.analyses.map((analysis, index) => (
                  <div
                    key={analysis.imageId}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedImageAnalysis(analysis)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <h4 className="font-medium">{analysis.imageName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.detectedMaterial} • {analysis.confidenceLevel}% confidence
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getRiskColor(analysis.contaminationRisk)}>
                          {analysis.contaminationRisk}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {analysis.processingTime}ms
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analysis Modal/Card */}
      {selectedImageAnalysis && (
        <Card className="border-2 border-accent">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detailed Analysis: {selectedImageAnalysis.imageName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImageAnalysis(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">Material Classification</h5>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {selectedImageAnalysis.detectedMaterial}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Confidence: {selectedImageAnalysis.confidenceLevel}%
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-2">EWC Code</h5>
                <Badge variant="outline" className="font-mono">
                  {selectedImageAnalysis.ewcCode}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedImageAnalysis.landfillTaxCategory} waste category
                </p>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Visual Analysis</h5>
              <p className="text-sm text-muted-foreground">
                {selectedImageAnalysis.visualAnalysis}
              </p>
            </div>

            <div>
              <h5 className="font-medium mb-2">Risk Assessment</h5>
              <p className="text-sm text-muted-foreground">
                {selectedImageAnalysis.riskAssessment}
              </p>
            </div>

            <div>
              <h5 className="font-medium mb-2">Recommendations</h5>
              <ul className="space-y-1">
                {selectedImageAnalysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};