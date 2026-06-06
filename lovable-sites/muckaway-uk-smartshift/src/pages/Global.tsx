import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGlobal } from "@/components/GlobalProvider";
import { getComplianceForRegion, getSupportedRegions } from "@/config/regionalCompliance";
import { getVehiclesForRegion } from "@/config/regionalVehicles";
import { useUnits } from "@/hooks/useUnits";
import { Globe, Shield, Truck, Calculator, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Global = () => {
  const { region, setRegion, formatCurrency } = useGlobal();
  const regions = getSupportedRegions();
  const selectedCompliance = getComplianceForRegion(region?.country || 'UK');
  const vehicles = getVehiclesForRegion(region?.country || 'UK');
  const { formatWeight, getWeightUnit, isImperial } = useUnits();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-6 bg-primary/10 text-primary">
              <Globe className="h-4 w-4 mr-2" />
              Global Platform
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              One Platform, <span className="text-primary">50+ Countries</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              MuckAway.ai automatically adapts to local regulations, currencies, units of measure, 
              and vehicle terminology wherever you operate.
            </p>
          </div>
        </section>

        {/* Region Selector */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              Explore Regional Coverage
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {regions.map((r) => (
                <Button
                  key={r.code}
                  variant={region?.country?.toUpperCase() === r.code ? "default" : "outline"}
                  size="lg"
                  onClick={() => setRegion(r.code)}
                  className="text-lg"
                >
                  {r.flag} {r.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Selected Region Details */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 text-2xl px-6 py-2 bg-card border-border">
                {selectedCompliance.flag} {selectedCompliance.name}
              </Badge>
              <p className="text-muted-foreground">
                Currently viewing: {selectedCompliance.name} regulations and pricing
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Regulations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Regulatory Framework
                  </CardTitle>
                  <CardDescription>
                    Compliance requirements for {selectedCompliance.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {selectedCompliance.regulations.map((reg, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-foreground">{reg.name}</div>
                          <div className="text-sm text-muted-foreground">{reg.description}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      <strong>Regulatory Body:</strong> {selectedCompliance.regulatoryBody}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <strong>Emergency Hotline:</strong> {selectedCompliance.emergencyNumber}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Rates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-accent" />
                    Disposal Levies & Taxes
                  </CardTitle>
                  <CardDescription>
                    Current rates for {selectedCompliance.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(selectedCompliance.taxRates).map(([key, rate]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium text-foreground">{rate.label}</div>
                          <div className="text-sm text-muted-foreground">{rate.unit}</div>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {rate.currency} {rate.rate.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Common Vehicle Types in {selectedCompliance.name}
                </CardTitle>
                <CardDescription>
                  Showing capacities in {isImperial ? 'US tons' : 'metric tonnes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.map((vehicle, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                      <div className="font-medium text-foreground">{vehicle.name}</div>
                      <div className="text-sm text-primary">{vehicle.capacity}</div>
                      <div className="text-xs text-muted-foreground mt-1">{vehicle.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* All Regions Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Supported Regions
              </h2>
              <p className="text-xl text-muted-foreground">
                Click any region to explore local regulations and pricing
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {regions.map((r) => (
                <Card 
                  key={r.code} 
                  className="cursor-pointer hover:shadow-elegant transition-all hover:scale-105"
                  onClick={() => setRegion(r.code)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-2">{r.flag}</div>
                    <div className="font-medium text-foreground text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.regions.length} regions</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Operating in Multiple Countries?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              MuckAway.ai handles cross-border compliance automatically. 
              One platform for all your global operations.
            </p>
            <Button variant="action" size="lg" asChild>
              <Link to="/auth">Start Free Trial</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Global;
