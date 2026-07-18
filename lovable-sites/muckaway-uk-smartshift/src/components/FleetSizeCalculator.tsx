import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Truck, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PRICING_TIERS, COMPETITOR_PRICING } from '@/config/pricing';

export const FleetSizeCalculator = () => {
  const navigate = useNavigate();
  const [vehicleCount, setVehicleCount] = useState(5);

  const calculations = useMemo(() => {
    // Determine recommended tier based on vehicle count
    let recommendedTier: 'wasteTracker' | 'aiClassifier' | 'enterpriseWaste';
    let tierPrice: number;
    let tierName: string;
    
    if (vehicleCount <= 3) {
      recommendedTier = 'wasteTracker';
      tierPrice = PRICING_TIERS.wasteTracker.price;
      tierName = PRICING_TIERS.wasteTracker.name;
    } else if (vehicleCount <= 10) {
      recommendedTier = 'aiClassifier';
      tierPrice = PRICING_TIERS.aiClassifier.price;
      tierName = PRICING_TIERS.aiClassifier.name;
    } else {
      recommendedTier = 'enterpriseWaste';
      tierPrice = PRICING_TIERS.enterpriseWaste.price;
      tierName = PRICING_TIERS.enterpriseWaste.name;
    }
    
    // Estimate jobs based on vehicle count (avg 15 jobs/vehicle/month)
    const estimatedJobsPerMonth = vehicleCount * 15;
    
    // Traditional competitor average per load
    const avgCompetitorPerLoad = Object.values(COMPETITOR_PRICING).reduce(
      (acc, c) => acc + c.perLoad, 0
    ) / Object.values(COMPETITOR_PRICING).length;
    
    // Admin cost estimate (£50/vehicle/month for paperwork, compliance, etc.)
    const traditionalAdminCost = vehicleCount * 50;
    
    // Total traditional cost (admin only - not disposal, just management overhead)
    const traditionalManagementCost = traditionalAdminCost;
    
    // Savings on admin/management
    const savingsVsTraditional = Math.max(0, traditionalManagementCost - tierPrice);
    const savingsPercent = traditionalManagementCost > 0 
      ? Math.round((savingsVsTraditional / traditionalManagementCost) * 100)
      : 0;
    
    // Cost per vehicle
    const costPerVehicle = Math.round(tierPrice / vehicleCount);
    
    return {
      vehicleCount,
      estimatedJobsPerMonth,
      tierPrice,
      tierName,
      recommendedTier,
      traditionalManagementCost,
      savingsVsTraditional,
      savingsPercent,
      costPerVehicle,
    };
  }, [vehicleCount]);

  const handleGetStarted = () => {
    navigate(`/subscribe?tier=${calculations.recommendedTier}`);
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Fleet Size Calculator
        </CardTitle>
        <CardDescription>
          Find the right plan based on your fleet size
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Number of vehicles</span>
            <Badge variant="secondary" className="text-lg font-bold px-4 py-1">
              {vehicleCount}
            </Badge>
          </div>
          <Slider
            value={[vehicleCount]}
            onValueChange={(value) => setVehicleCount(value[0])}
            min={1}
            max={25}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 vehicle</span>
            <span>25+ vehicles</span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 rounded-lg border border-primary bg-primary/5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Recommended: {calculations.tierName}</span>
                <Badge variant="default" className="text-xs">Best Fit</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Perfect for {calculations.vehicleCount} vehicles • ~{calculations.estimatedJobsPerMonth} jobs/month
              </p>
            </div>
            <span className="text-xl font-bold text-primary">
              £{calculations.tierPrice}/mo
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            That's just £{calculations.costPerVehicle}/vehicle/month
          </p>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">MuckAway.ai</p>
            <p className="text-lg font-bold text-primary">£{calculations.tierPrice}/mo</p>
            <p className="text-xs text-muted-foreground">Fixed monthly</p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">Traditional Admin</p>
            <p className="text-lg font-bold text-muted-foreground">£{calculations.traditionalManagementCost}/mo</p>
            <p className="text-xs text-muted-foreground">Est. paperwork cost</p>
          </div>
        </div>

        {/* Savings Banner */}
        {calculations.savingsVsTraditional > 0 && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <TrendingDown className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-green-500">
                  Save £{Math.round(calculations.savingsVsTraditional)}/month on admin
                </p>
                <p className="text-sm text-muted-foreground">
                  Plus automated compliance and AI classification included
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Features included */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">All plans include:</p>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-primary" />
              AI spoil classification
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-primary" />
              Digital WTN generation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-primary" />
              DWT 2026 compliance
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-primary" />
              Fleet management
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleGetStarted}
        >
          Get Started with {calculations.tierName}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default FleetSizeCalculator;
