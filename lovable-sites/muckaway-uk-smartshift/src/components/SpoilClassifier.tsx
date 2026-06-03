import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentButton } from "@/components/PaymentButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

export const SpoilClassifier = () => {
  const [formData, setFormData] = useState({
    postcode: "",
    materialType: "",
    volume: "",
    contamination: ""
  });

  const [quote, setQuote] = useState<any>(null);

  const { toast } = useToast();

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

    // Mock calculation based on form data
    const baseRate = 25; // £25 per tonne
    const estimatedTonnage = parseFloat(formData.volume) * 1.8; // rough conversion
    const landfillTax = formData.contamination === "hazardous" ? 126.15 : 4.05;
    const disposalCost = estimatedTonnage * landfillTax;
    const haulageRate = estimatedTonnage * baseRate;
    const totalCost = haulageRate + disposalCost;

    const ewcCode = formData.contamination === "hazardous" ? "17 05 03*" : "17 05 04";

    const quoteData = {
      materialType: formData.materialType,
      estimatedTonnage: estimatedTonnage.toFixed(1),
      haulageRate: haulageRate.toFixed(2),
      disposalCost: disposalCost.toFixed(2),
      landfillTax: landfillTax,
      totalCost: totalCost.toFixed(2),
      ewcCode: ewcCode,
      complianceLevel: formData.contamination === "hazardous" ? "Hazardous Consignment Note Required" : "WTN Sufficient"
    };

    setQuote(quoteData);

    // Store the quote in Supabase if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user's profile to link customer
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          // Get or create customer record
          const { data: customer } = await supabase
            .from("customers")
            .select("id")
            .eq("profile_id", profile.id)
            .single();

          const customerId = customer?.id;

          // Create a job record with quote status
          const { error } = await supabase.from("jobs").insert({
            user_id: user.id,
            customer_id: customerId,
            material_type: formData.materialType,
            contamination_level: formData.contamination,
            volume_tonnes: estimatedTonnage,
            estimated_volume: parseFloat(formData.volume),
            estimated_tonnage: estimatedTonnage,
            site_address: formData.postcode,
            ewc_code: ewcCode,
            quote_amount: totalCost,
            haulage_cost: haulageRate,
            disposal_cost: disposalCost,
            landfill_tax_amount: disposalCost,
            status: "pending"
          });

          if (error) {
            console.error("Error saving quote:", error);
          } else {
            // Track quote creation
            trackEvent("quote_created", {
              flow: "simple_classifier",
              material_type: formData.materialType,
              volume_m3: parseFloat(formData.volume),
              contamination: formData.contamination,
              estimated_tonnage: estimatedTonnage,
              haulage_cost: parseFloat(haulageRate.toFixed(2)),
              disposal_cost: parseFloat(disposalCost.toFixed(2)),
              landfill_tax_per_tonne: landfillTax,
              total_cost: parseFloat(totalCost.toFixed(2)),
              ewc_code: ewcCode,
              compliance_level: quoteData.complianceLevel,
              user_authenticated: !!user,
              postcode: formData.postcode,
            });
            
            toast({
              title: "Quote Generated",
              description: "Your quote has been saved to your dashboard",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking auth or saving quote:", error);
    }
  };

  return (
    <section id="classifier" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            AI Spoil Classifier & Quote Engine
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get instant, compliant quotes with automated spoil classification and regulatory guidance
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-primary">Classify Your Spoil</CardTitle>
              <CardDescription>
                Enter your site details for instant classification and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="postcode">Site Postcode</Label>
                  <Input
                    id="postcode"
                    placeholder="e.g. SW1A 1AA"
                    value={formData.postcode}
                    onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                    className="bg-input border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="material">Material Type</Label>
                  <Select value={formData.materialType} onValueChange={(value) => setFormData({...formData, materialType: value})}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select material type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soil">Clean Soil</SelectItem>
                      <SelectItem value="clay">Clay</SelectItem>
                      <SelectItem value="hardcore">Hardcore/Rubble</SelectItem>
                      <SelectItem value="chalk">Chalk</SelectItem>
                      <SelectItem value="mixed">Mixed Spoil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="volume">Estimated Volume (m³)</Label>
                  <Input
                    id="volume"
                    type="number"
                    placeholder="e.g. 50"
                    value={formData.volume}
                    onChange={(e) => setFormData({...formData, volume: e.target.value})}
                    className="bg-input border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="contamination">Contamination Risk</Label>
                  <Select value={formData.contamination} onValueChange={(value) => setFormData({...formData, contamination: value})}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select contamination level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inert">Inert/Clean</SelectItem>
                      <SelectItem value="standard">Standard Risk</SelectItem>
                      <SelectItem value="hazardous">Potentially Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" variant="action" className="w-full" size="lg">
                  Get Instant Quote
                </Button>
              </form>
            </CardContent>
          </Card>

          {quote && (
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-accent">Your Quote Breakdown</CardTitle>
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
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Haulage Rate</span>
                    <span>£{quote.haulageRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disposal Cost</span>
                    <span>£{quote.disposalCost}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Landfill Tax Rate</span>
                    <span>£{quote.landfillTax}/t</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total Cost</span>
                      <span className="text-accent">£{quote.totalCost}</span>
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

                <PaymentButton
                  amount={parseFloat(quote.totalCost)}
                  jobData={{
                    postcode: formData.postcode,
                    materialType: formData.materialType,
                    volume: formData.volume,
                    contamination: formData.contamination,
                    quote: quote
                  }}
                  className="w-full"
                >
                  Book This Job - £{quote.totalCost}
                </PaymentButton>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};