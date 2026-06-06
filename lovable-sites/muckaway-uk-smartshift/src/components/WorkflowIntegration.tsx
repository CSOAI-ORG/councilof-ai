import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/components/GlobalProvider';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bot, Calculator, FileText } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { TermsAcceptanceModal } from '@/components/TermsAcceptanceModal';
import { LEGAL_VERSIONS } from '@/config/legalConfig';

interface ClassificationResult {
  material_type: string;
  confidence: number;
  estimated_volume_m3: number;
  contamination_risk: string;
  ewc_code: string;
  description: string;
  recommendations: string;
  landfill_tax_category: string;
}

interface QuoteData {
  spoilType: string;
  estimatedVolume: number;
  contaminationLevel: string;
  siteAddress: string;
  clientName: string;
  clientEmail: string;
  urgency: string;
}

export const WorkflowIntegration: React.FC = () => {
  const [quoteData, setQuoteData] = useState<QuoteData>({
    spoilType: '',
    estimatedVolume: 0,
    contaminationLevel: 'none',
    siteAddress: '',
    clientName: '',
    clientEmail: '',
    urgency: 'standard',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<any>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { formatCurrency } = useGlobal();
  const { t } = useTranslation();

  // Check for existing terms acceptance on mount
  useEffect(() => {
    const stored = localStorage.getItem('terms-accepted');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === LEGAL_VERSIONS.terms.version) {
          setTermsAccepted(true);
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, []);

  const applyAIClassification = (classification: ClassificationResult) => {
    setQuoteData(prev => ({
      ...prev,
      spoilType: classification.material_type,
      estimatedVolume: classification.estimated_volume_m3,
      contaminationLevel: classification.contamination_risk.toLowerCase(),
    }));

    toast({
      title: "AI Classification Applied",
      description: `Updated quote with ${classification.material_type} classification`,
    });
  };

  const calculateQuote = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate quotes",
        variant: "destructive",
      });
      return;
    }

    if (!quoteData.spoilType || !quoteData.estimatedVolume || !quoteData.siteAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Calculate pricing based on material type and volume
      const basePricePerTonne = calculateBasePricing(quoteData.spoilType, quoteData.contaminationLevel);
      const estimatedTonnage = quoteData.estimatedVolume * 1.8; // Convert m³ to tonnes (approximate)
      
      const haulageCost = estimatedTonnage * 45; // £45 per tonne haulage
      const disposalCost = estimatedTonnage * basePricePerTonne;
      const landfillTax = calculateLandfillTax(quoteData.spoilType, estimatedTonnage);
      const totalCost = haulageCost + disposalCost + landfillTax;

      // Add urgency multiplier
      const urgencyMultiplier = quoteData.urgency === 'urgent' ? 1.3 : quoteData.urgency === 'express' ? 1.5 : 1;
      const finalCost = totalCost * urgencyMultiplier;

      const quote = {
        spoilType: quoteData.spoilType,
        estimatedVolume: quoteData.estimatedVolume,
        estimatedTonnage,
        contaminationLevel: quoteData.contaminationLevel,
        haulageCost,
        disposalCost,
        landfillTax,
        totalCost: finalCost,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        quoteId: `MWA-${Date.now()}`,
        siteAddress: quoteData.siteAddress,
        clientName: quoteData.clientName,
        clientEmail: quoteData.clientEmail,
        urgency: quoteData.urgency,
      };

      setGeneratedQuote(quote);

      // Store quote in database (optional)
      if (quoteData.clientEmail) {
        const { error } = await supabase.from('jobs').insert({
          user_id: user.id,
          material_type: quoteData.spoilType.toLowerCase().replace(' ', '_'),
          contamination_level: quoteData.contaminationLevel,
          volume_tonnes: estimatedTonnage,
          estimated_volume: quoteData.estimatedVolume,
          estimated_tonnage: estimatedTonnage,
          site_address: quoteData.siteAddress || 'Not specified',
          quote_amount: finalCost,
          haulage_cost: haulageCost,
          disposal_cost: disposalCost,
          landfill_tax_amount: landfillTax,
          status: 'pending',
          notes: `Auto-generated quote for ${quoteData.clientName}`,
        });

        if (error) {
          console.error('Error saving quote:', error);
        } else {
          // Track quote creation
          trackEvent("quote_created", {
            flow: "ai_workflow",
            spoil_type: quoteData.spoilType,
            estimated_volume_m3: quoteData.estimatedVolume,
            contamination_level: quoteData.contaminationLevel,
            urgency: quoteData.urgency,
            site_address_present: !!quoteData.siteAddress,
            client_email_present: !!quoteData.clientEmail,
            client_name_present: !!quoteData.clientName,
            estimated_tonnage: estimatedTonnage,
            haulage_cost: haulageCost,
            disposal_cost: disposalCost,
            landfill_tax: landfillTax,
            total_cost: finalCost,
            quote_id: quote.quoteId,
            valid_until: quote.validUntil,
          });
        }
      }

      toast({
        title: "Quote Generated Successfully",
        description: `Total cost: ${formatCurrency(finalCost)}`,
      });

    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        title: "Quote Generation Failed",
        description: "Failed to generate quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateBasePricing = (materialType: string, contamination: string): number => {
    const basePrices: Record<string, number> = {
      'clean_fill': 25,
      'topsoil': 30,
      'subsoil': 35,
      'clay': 40,
      'mixed_spoil': 45,
      'contaminated_soil': 120,
      'hazardous_waste': 250,
    };

    const contaminationMultiplier = {
      'none': 1,
      'low': 1.2,
      'medium': 1.8,
      'high': 3.0,
    };

    const basePrice = basePrices[materialType.toLowerCase().replace(' ', '_')] || 50;
    const multiplier = contaminationMultiplier[contamination as keyof typeof contaminationMultiplier] || 1;
    
    return basePrice * multiplier;
  };

  const calculateLandfillTax = (materialType: string, tonnage: number): number => {
    // Current HMRC Landfill Tax Rates (April 2024 - March 2025)
    // Source: https://www.gov.uk/government/publications/rates-and-allowances-landfill-tax
    const standardRate = 126.15; // £126.15 per tonne - standard rate for non-inert waste
    const inertRate = 3.25; // £3.25 per tonne - lower rate for inert/inactive waste
    
    const inertMaterials = ['clean_fill', 'topsoil', 'clay', 'subsoil', 'sand', 'gravel', 'crushed_rock', 'concrete_rubble', 'brick_rubble', 'inert', 'soil', 'stone', 'rocks', 'aggregate'];
    const isInert = inertMaterials.some(material => materialType.toLowerCase().includes(material));
    
    return tonnage * (isInert ? inertRate : standardRate);
  };

  const handleTermsAccepted = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    // Proceed with job conversion after accepting
    processConvertToJob();
  };

  const handleConvertToJobClick = () => {
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }
    processConvertToJob();
  };

  const processConvertToJob = async () => {
    if (!generatedQuote || !user) return;

    try {
      const { data: jobData, error } = await supabase.from('jobs').insert({
        user_id: user.id,
        material_type: generatedQuote.spoilType.toLowerCase().replace(' ', '_'),
        contamination_level: generatedQuote.contaminationLevel,
        volume_tonnes: generatedQuote.estimatedTonnage,
        estimated_volume: generatedQuote.estimatedVolume,
        estimated_tonnage: generatedQuote.estimatedTonnage,
        site_address: generatedQuote.siteAddress || 'Not specified',
        quote_amount: generatedQuote.totalCost,
        haulage_cost: generatedQuote.haulageCost,
        disposal_cost: generatedQuote.disposalCost,
        landfill_tax_amount: generatedQuote.landfillTax,
        status: 'confirmed',
        notes: `Converted from quote ${generatedQuote.quoteId}`,
      }).select();

      if (error) throw error;

      // Track booking creation
      if (jobData && jobData.length > 0) {
        trackEvent("booking_created", {
          flow: "ai_workflow",
          quote_id: generatedQuote.quoteId,
          estimated_tonnage: generatedQuote.estimatedTonnage,
          total_amount: generatedQuote.totalCost,
          spoil_type: generatedQuote.spoilType,
          contamination_level: generatedQuote.contaminationLevel,
          urgency: generatedQuote.urgency,
          job_id: jobData[0].id,
        });
      }

      toast({
        title: "Job Created Successfully",
        description: "Quote has been converted to a confirmed job",
      });

      setGeneratedQuote(null);
      setQuoteData({
        spoilType: '',
        estimatedVolume: 0,
        contaminationLevel: 'none',
        siteAddress: '',
        clientName: '',
        clientEmail: '',
        urgency: 'standard',
      });

    } catch (error) {
      console.error('Error converting to job:', error);
      toast({
        title: "Conversion Failed",
        description: "Failed to convert quote to job",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            AI-Powered Quote Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="spoilType">Material Type</Label>
              <Select value={quoteData.spoilType} onValueChange={(value) => setQuoteData({...quoteData, spoilType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean_fill">Clean Fill</SelectItem>
                  <SelectItem value="topsoil">Topsoil</SelectItem>
                  <SelectItem value="subsoil">Subsoil</SelectItem>
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="mixed_spoil">Mixed Spoil</SelectItem>
                  <SelectItem value="contaminated_soil">Contaminated Soil</SelectItem>
                  <SelectItem value="hazardous_waste">Hazardous Waste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="volume">Estimated Volume (m³)</Label>
              <Input
                id="volume"
                type="number"
                value={quoteData.estimatedVolume}
                onChange={(e) => setQuoteData({...quoteData, estimatedVolume: parseFloat(e.target.value) || 0})}
                placeholder="Enter volume in cubic meters"
              />
            </div>

            <div>
              <Label htmlFor="contamination">Contamination Level</Label>
              <Select value={quoteData.contaminationLevel} onValueChange={(value) => setQuoteData({...quoteData, contaminationLevel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contamination level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={quoteData.urgency} onValueChange={(value) => setQuoteData({...quoteData, urgency: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (5-7 days)</SelectItem>
                  <SelectItem value="urgent">Urgent (2-3 days) +30%</SelectItem>
                  <SelectItem value="express">Express (24 hours) +50%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Site Address</Label>
              <Input
                id="address"
                value={quoteData.siteAddress}
                onChange={(e) => setQuoteData({...quoteData, siteAddress: e.target.value})}
                placeholder="Enter the site address for collection"
              />
            </div>

            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={quoteData.clientName}
                onChange={(e) => setQuoteData({...quoteData, clientName: e.target.value})}
                placeholder="Enter client name"
              />
            </div>

            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={quoteData.clientEmail}
                onChange={(e) => setQuoteData({...quoteData, clientEmail: e.target.value})}
                placeholder="Enter client email"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={calculateQuote}
              disabled={isGenerating}
              className="flex-1"
              variant="action"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Quote'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Simulate AI classification result for demo
                const mockClassification: ClassificationResult = {
                  material_type: 'Mixed Spoil',
                  confidence: 0.92,
                  estimated_volume_m3: 50,
                  contamination_risk: 'Low',
                  ewc_code: '17 05 04',
                  description: 'Mixed construction and demolition waste',
                  recommendations: 'Suitable for standard disposal methods',
                  landfill_tax_category: 'Standard',
                };
                applyAIClassification(mockClassification);
              }}
            >
              <Bot className="h-4 w-4 mr-2" />
              Apply AI Result
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedQuote && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <FileText className="h-5 w-5" />
              Generated Quote - {generatedQuote.quoteId}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-green-700">Material</Label>
                <p className="font-semibold">{generatedQuote.spoilType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-green-700">Volume</Label>
                <p className="font-semibold">{generatedQuote.estimatedVolume} m³</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-green-700">Weight</Label>
                <p className="font-semibold">{generatedQuote.estimatedTonnage.toFixed(1)} tonnes</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-green-700">Urgency</Label>
                <p className="font-semibold capitalize">{generatedQuote.urgency}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Haulage Cost:</span>
                <span>{formatCurrency(generatedQuote.haulageCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Disposal Cost:</span>
                <span>{formatCurrency(generatedQuote.disposalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Landfill Tax:</span>
                <span>{formatCurrency(generatedQuote.landfillTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total Cost:</span>
                <span className="text-green-600">{formatCurrency(generatedQuote.totalCost)}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleConvertToJobClick}
                className="flex-1"
                variant="action"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Convert to Job
              </Button>
              <Button
                variant="outline"
                onClick={() => setGeneratedQuote(null)}
              >
                Clear Quote
              </Button>
            </div>

            <TermsAcceptanceModal
              open={showTermsModal}
              onAccept={handleTermsAccepted}
              onDecline={() => setShowTermsModal(false)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};