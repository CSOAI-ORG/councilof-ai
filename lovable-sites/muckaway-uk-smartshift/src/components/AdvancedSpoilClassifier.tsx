import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, Brain, FileCheck, Truck, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import spoilTypesImage from "@/assets/spoil-types.jpg";
import { BookingConfirmation } from "./BookingConfirmation";
import { trackEvent } from "@/lib/analytics";
import { AIAnalysisLoadingState } from "./AIAnalysisLoadingState";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useGlobal } from "@/components/GlobalProvider";
import { calculateDisposalCost, getWasteCode, getComplianceDocumentType } from "@/utils/regionalTaxCalculator";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { useImageCompression } from "@/hooks/useImageCompression";

// Region-aware postcode placeholders
const POSTCODE_EXAMPLES: Record<string, string> = {
  'GB': 'e.g. SW1A 1AA',
  'UK': 'e.g. SW1A 1AA',
  'US': 'e.g. 90210',
  'AU': 'e.g. 2000',
  'CA': 'e.g. M5V 3K9',
  'NZ': 'e.g. 6011',
  'DE': 'e.g. 10115',
  'FR': 'e.g. 75001',
  'ES': 'e.g. 28001',
  'IT': 'e.g. 00100',
  'NL': 'e.g. 1012',
  'BR': 'e.g. 01310-100',
  'IN': 'e.g. 110001',
  'SG': 'e.g. 018956',
  'AE': 'e.g. 12345',
  'ZA': 'e.g. 2000',
  'CN': 'e.g. 100000',
};

export const AdvancedSpoilClassifier = () => {
  const [formData, setFormData] = useState({
    postcode: "",
    materialType: "",
    volume: "",
    contamination: "",
    photos: [] as File[]
  });

  const [quote, setQuote] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { region } = useGlobalSettings();
  const { formatCurrency } = useGlobal();
  const { compressAndConvertToBase64, isCompressing } = useImageCompression({
    maxSizeMB: 0.1, // 100KB for 2G networks
    maxWidthOrHeight: 1024,
  });

  // Get region-appropriate postcode placeholder - default to UK
  const postcodePlaceholder = useMemo(() => {
    const countryCode = region?.countryCode?.toUpperCase() || 'GB';
    return POSTCODE_EXAMPLES[countryCode] || POSTCODE_EXAMPLES['GB'];
  }, [region?.countryCode]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 3) {
      toast({
        title: "Too many photos",
        description: "Please upload maximum 3 photos",
        variant: "destructive"
      });
      return;
    }
    setFormData({...formData, photos: files});
    
    if (files.length > 0) {
      setIsAnalyzing(true);
      
      try {
        // Compress and convert first image to base64 for 2G optimization
        const file = files[0];
        const base64Image = await compressAndConvertToBase64(file);
        
        if (!base64Image) {
          throw new Error('Failed to compress image');
        }
        
        try {
          const { data, error } = await supabase.functions.invoke('ai-spoil-classifier', {
            body: { image: base64Image }
          });

          if (error) {
            // Handle rate limit errors
            if (error.message?.includes('429') || error.message?.includes('402')) {
              toast({
                title: "Rate Limited",
                description: "Too many requests. Please try again in a moment.",
                variant: "destructive"
              });
              setIsAnalyzing(false);
              return;
            }
            throw error;
          }

          if (data) {
            setAiAnalysis({
              detectedMaterial: data.material_type,
              confidenceLevel: Math.round(data.confidence * 100),
              estimatedVolume: data.estimated_volume_m3,
              contaminationRisk: data.contamination_risk,
              recommendations: data.recommendations || []
            });
            
            toast({
              title: "AI Analysis Complete",
              description: `Material identified as ${data.material_type} with ${Math.round(data.confidence * 100)}% confidence`,
            });
          }
        } catch (error) {
          console.error('AI analysis error:', error);
          toast({
            title: "AI Analysis Failed",
            description: "Using manual classification mode",
            variant: "destructive"
          });
        } finally {
          setIsAnalyzing(false);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        setIsAnalyzing(false);
        toast({
          title: "Error",
          description: "Failed to process image",
          variant: "destructive"
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.postcode || !formData.materialType || !formData.volume || !formData.contamination) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Enhanced calculation with AI recommendations and regional tax rates
    const baseRate = 25;
    const volumeToUse = aiAnalysis?.estimatedVolume || parseFloat(formData.volume);
    const materialMultiplier = {
      'soil': 1.6,
      'clay': 1.8,
      'chalk': 1.4,
      'hardcore': 2.2,
      'mixed': 1.9,
      'topsoil': 1.3
    }[formData.materialType] || 1.8;
    
    const estimatedTonnage = volumeToUse * materialMultiplier;
    const contaminationLevel = aiAnalysis?.contaminationRisk === 'high' ? 'hazardous' : formData.contamination;
    
    // Get region-specific tax rates and calculations
    const countryCode = region?.countryCode || 'GB';
    const disposalResult = calculateDisposalCost(estimatedTonnage, contaminationLevel, countryCode);
    const landfillTax = disposalResult.taxRate;
    const disposalCost = disposalResult.cost;
    const haulageRate = estimatedTonnage * baseRate;
    const totalCost = haulageRate + disposalCost;

    // Get region-appropriate waste code and compliance document
    const isHazardous = contaminationLevel === "hazardous";
    const ewcCode = getWasteCode(countryCode, isHazardous);
    const complianceDoc = getComplianceDocumentType(countryCode, isHazardous);

    const quoteData = {
      postcode: formData.postcode,
      material: formData.materialType,
      materialType: formData.materialType,
      volume: volumeToUse,
      estimatedTonnage: estimatedTonnage.toFixed(1),
      haulage: haulageRate,
      haulageRate: haulageRate.toFixed(2),
      disposal: disposalCost,
      disposalCost: disposalCost.toFixed(2),
      landfillTax: landfillTax,
      total: totalCost,
      totalCost: totalCost.toFixed(2),
      ewcCode: ewcCode,
      complianceLevel: complianceDoc,
      regionName: disposalResult.regionName,
      currency: disposalResult.currency,
      aiEnhanced: !!aiAnalysis,
      confidenceLevel: aiAnalysis?.confidenceLevel || null
    };

    setQuote(quoteData);
    
    // Track quote creation
    trackEvent("quote_created", {
      flow: "advanced_ai_classifier",
      material_type: formData.materialType,
      volume_m3: parseFloat(volumeToUse.toString()),
      contamination: formData.contamination,
      estimated_tonnage: parseFloat(estimatedTonnage.toFixed(1)),
      haulage_cost: parseFloat(haulageRate.toFixed(2)),
      disposal_cost: parseFloat(disposalCost.toFixed(2)),
      landfill_tax_per_tonne: landfillTax,
      total_cost: parseFloat(totalCost.toFixed(2)),
      ewc_code: ewcCode,
      compliance_level: quoteData.complianceLevel,
      ai_analysis_used: !!aiAnalysis,
      ai_confidence: aiAnalysis?.confidenceLevel,
      ai_detected_material: aiAnalysis?.detectedMaterial,
      photos_uploaded: formData.photos.length,
      user_authenticated: true,
      postcode: formData.postcode,
    });
  };

  const handleBookJob = async () => {
    if (!quote) return;

    setIsBooking(true);
    
    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Save quote to sessionStorage for after login
        sessionStorage.setItem('pendingQuote', JSON.stringify({ quote, formData }));
        toast({
          title: "Login Required",
          description: "Please sign in to complete your booking",
        });
        navigate("/auth?redirect=/");
        return;
      }

      // Try to get existing customer record
      let customerId: string | null = null;
      
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Auto-create customer record for authenticated user
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({ 
            user_id: user.id, 
            email: user.email,
            contact_name: user.user_metadata?.full_name || null
          })
          .select('id')
          .single();
        
        if (customerError) {
          console.error("Error creating customer:", customerError);
          // Continue without customer_id - job can still be created
        } else {
          customerId = newCustomer?.id || null;
        }
      }

      // Create the job (customer_id is optional)
      const { data: job, error } = await supabase.from("jobs").insert([{
        user_id: user.id,
        customer_id: customerId,
        material_type: formData.materialType,
        contamination_level: formData.contamination,
        estimated_volume: quote.volume,
        estimated_tonnage: parseFloat(quote.estimatedTonnage),
        volume_tonnes: parseFloat(quote.estimatedTonnage),
        site_address: formData.postcode,
        ewc_code: quote.ewcCode,
        quote_amount: quote.total,
        haulage_cost: quote.haulage,
        disposal_cost: quote.disposal,
        landfill_tax_amount: quote.disposal,
        status: "pending",
        notes: aiAnalysis ? `AI Analysis: ${aiAnalysis.recommendations?.join(', ') || 'N/A'}` : null
      }]).select('id').single();

      if (error) {
        console.error("Error creating job:", error);
        toast({
          title: "Error",
          description: "Failed to book job. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Track booking creation
      trackEvent("booking_created", {
        flow: "advanced_ai_classifier",
        estimated_tonnage: parseFloat(quote.estimatedTonnage),
        total_amount: parseFloat(quote.totalCost),
        material_type: formData.materialType,
        volume_m3: parseFloat(formData.volume),
        contamination: formData.contamination,
        ai_analysis_used: !!aiAnalysis,
        job_id: job.id,
        postcode: formData.postcode,
      });
      
      setJobId(job.id);
      setShowBookingConfirmation(true);
      toast({
        title: "Booking Confirmed",
        description: "Your job has been successfully booked!",
      });
    } catch (error) {
      console.error("Error booking job:", error);
      toast({
        title: "Error",
        description: "An error occurred while booking",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (showBookingConfirmation && quote) {
    return (
      <section id="ai-classifier" className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-2xl">
          <BookingConfirmation quote={quote} jobId={jobId || undefined} />
        </div>
      </section>
    );
  }

  return (
    <section id="ai-classifier" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            <Brain className="w-4 h-4 mr-2" />
            AI-Powered Classification
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Advanced Spoil Classifier & Quote Engine
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload photos for AI analysis, get instant spoil classification, and receive compliant quotes with automated regulatory guidance
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Camera className="w-5 h-5" />
                AI Spoil Analysis
              </CardTitle>
              <CardDescription>
                Upload photos and enter site details for instant AI-powered classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload Section */}
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload spoil photos (max 3)
                    </p>
                    <Button type="button" variant="outline" size="sm">
                      Choose Photos
                    </Button>
                  </label>
                  {formData.photos.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-foreground">
                        {formData.photos.length} photo(s) uploaded
                      </p>
                    </div>
                  )}
                </div>

                {/* AI Analysis Results - Enhanced Loading */}
                <AIAnalysisLoadingState isAnalyzing={isAnalyzing} />

                {aiAnalysis && (
                  <Card className="bg-accent/5 border-accent/20">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI Analysis Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Prominent Confidence Display */}
                      <div className="p-3 bg-background/50 rounded-lg">
                        <span className="text-xs text-muted-foreground block mb-1">AI Confidence</span>
                        <ConfidenceIndicator 
                          confidence={aiAnalysis.confidenceLevel} 
                          size="md"
                          showLabel={true}
                          showBar={true}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Material:</span>
                          <div className="font-semibold">{aiAnalysis.detectedMaterial}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Volume:</span>
                          <div className="font-semibold">{aiAnalysis.estimatedVolume}m³</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Risk Level:</span>
                          <div className="font-semibold capitalize">{aiAnalysis.contaminationRisk}</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Recommendations:</span>
                        <ul className="text-sm mt-1 space-y-1">
                          {aiAnalysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-accent">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <Label htmlFor="postcode">Site Postcode</Label>
                  <Input
                    id="postcode"
                    placeholder={postcodePlaceholder}
                    value={formData.postcode}
                    onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                    className="bg-input border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="material">Material Type</Label>
                  <Select 
                    value={formData.materialType} 
                    onValueChange={(value) => setFormData({...formData, materialType: value})}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={aiAnalysis ? `AI suggests: ${aiAnalysis.detectedMaterial}` : "Select material type"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soil">Clean Soil</SelectItem>
                      <SelectItem value="clay">Clay</SelectItem>
                      <SelectItem value="hardcore">Hardcore/Rubble</SelectItem>
                      <SelectItem value="chalk">Chalk</SelectItem>
                      <SelectItem value="mixed">Mixed Spoil</SelectItem>
                      <SelectItem value="topsoil">Topsoil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="volume">Estimated Volume (m³)</Label>
                  <Input
                    id="volume"
                    type="number"
                    placeholder={aiAnalysis ? `AI estimate: ${aiAnalysis.estimatedVolume}m³` : "e.g. 50"}
                    value={formData.volume}
                    onChange={(e) => setFormData({...formData, volume: e.target.value})}
                    className="bg-input border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="contamination">Contamination Risk</Label>
                  <Select 
                    value={formData.contamination} 
                    onValueChange={(value) => setFormData({...formData, contamination: value})}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={aiAnalysis ? `AI assessment: ${aiAnalysis.contaminationRisk} risk` : "Select contamination level"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inert">Inert/Clean</SelectItem>
                      <SelectItem value="standard">Standard Risk</SelectItem>
                      <SelectItem value="hazardous">Potentially Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" variant="action" className="w-full" size="lg">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Generate AI Quote
                </Button>
              </form>
            </CardContent>
          </Card>

          {quote && (
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-accent flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Your Quote Breakdown
                  {quote.aiEnhanced && (
                    <Badge className="bg-accent/10 text-accent text-xs">
                      AI Enhanced
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Compliant pricing with full regulatory breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Material</Label>
                    <div className="text-lg font-semibold">{quote.materialType}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Est. Tonnage</Label>
                    <div className="text-lg font-semibold">{quote.estimatedTonnage}t</div>
                  </div>
                  {quote.confidenceLevel && (
                    <div className="col-span-2">
                      <Label className="text-sm text-muted-foreground">AI Confidence</Label>
                      <div className="text-lg font-semibold text-accent">{quote.confidenceLevel}%</div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Haulage Rate</span>
                    <span>{formatCurrency(parseFloat(quote.haulageRate))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disposal Cost</span>
                    <span>{formatCurrency(parseFloat(quote.disposalCost))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Landfill Tax Rate</span>
                    <span>{formatCurrency(quote.landfillTax)}/t</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total Cost</span>
                      <span className="text-accent">{formatCurrency(parseFloat(quote.totalCost))}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Badge className="bg-primary/10 text-primary">
                    EWC Code: {quote.ewcCode}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {quote.complianceLevel}
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  className="w-full" 
                  size="lg" 
                  onClick={handleBookJob}
                  disabled={isBooking}
                >
                  {isBooking ? (
                    "Processing..."
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Book This Job
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};
