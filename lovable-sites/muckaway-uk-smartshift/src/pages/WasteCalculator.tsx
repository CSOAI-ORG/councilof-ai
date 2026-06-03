import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WasteVolumeCalculator } from '@/components/WasteVolumeCalculator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Truck, Shield, Clock, CheckCircle } from 'lucide-react';

const WasteCalculator = () => {
  return (
    <>
      <Helmet>
        <title>Free Muck Away Calculator | Spoil Volume & Cost Estimator | MuckAway.ai</title>
        <meta 
          name="description" 
          content="Free muck away calculator. Estimate your excavation spoil volume, weight in tonnes, number of loads needed, and get instant price quotes. No registration required." 
        />
        <meta 
          name="keywords" 
          content="muck away calculator, spoil calculator, excavation calculator, waste volume calculator, tonnes calculator, grab lorry loads, muck away cost, spoil removal estimate" 
        />
        <link rel="canonical" href="https://muckaway.ai/waste-calculator" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "MuckAway.ai Waste Calculator",
            "description": "Free tool to calculate excavation spoil volume, weight, and estimated removal costs",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "GBP"
            }
          })}
        </script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Hero */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="outline" className="mb-4">
              <Calculator className="h-3 w-3 mr-1" />
              Free Tool - No Registration Required
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Muck Away Calculator
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Calculate your excavation spoil volume, weight, and get an instant price estimate in seconds.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <WasteVolumeCalculator showCTA={true} />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Enter Dimensions</h3>
                  <p className="text-sm text-muted-foreground">
                    Input your excavation length, width, and depth in metres
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Select Material</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your spoil type for accurate weight calculations
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Get Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Instantly see volume, weight, loads needed, and price estimate
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Material densities */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Material Density Reference
            </h2>
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-4">Material</th>
                          <th className="text-center p-4">Density (t/m³)</th>
                          <th className="text-left p-4">Common Use</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-4 font-medium">Topsoil</td>
                          <td className="text-center p-4">1.4</td>
                          <td className="p-4 text-muted-foreground">Gardens, landscaping</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4 font-medium">Clay</td>
                          <td className="text-center p-4">1.8</td>
                          <td className="p-4 text-muted-foreground">Foundation excavations</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4 font-medium">Sand</td>
                          <td className="text-center p-4">1.6</td>
                          <td className="p-4 text-muted-foreground">Drainage, bedding</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4 font-medium">Gravel</td>
                          <td className="text-center p-4">1.8</td>
                          <td className="p-4 text-muted-foreground">Driveways, sub-base</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4 font-medium">Hardcore</td>
                          <td className="text-center p-4">1.9</td>
                          <td className="p-4 text-muted-foreground">Demolition, recycling</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4 font-medium">Concrete</td>
                          <td className="text-center p-4">2.4</td>
                          <td className="p-4 text-muted-foreground">Demolition waste</td>
                        </tr>
                        <tr>
                          <td className="p-4 font-medium">Mixed Spoil</td>
                          <td className="text-center p-4">1.6</td>
                          <td className="p-4 text-muted-foreground">General excavation</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Why Use MuckAway.ai?
            </h2>
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Accurate Loads</h3>
                <p className="text-sm text-muted-foreground">
                  Know exactly how many loads you'll need
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  DWT 2026 ready with digital WTNs
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Save Time</h3>
                <p className="text-sm text-muted-foreground">
                  AI classification in under 10 seconds
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">No Hidden Fees</h3>
                <p className="text-sm text-muted-foreground">
                  Transparent pricing from £37/month
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">
              Understanding Muck Away Calculations
            </h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p>
                Calculating the volume and weight of excavation spoil is essential for planning any construction project. 
                Our free muck away calculator helps you estimate exactly how much material needs to be removed, 
                how many grab lorry loads you'll need, and what it might cost.
              </p>
              <h3>How to Calculate Spoil Volume</h3>
              <p>
                The basic formula is simple: Length × Width × Depth = Volume (m³). However, different materials have 
                different densities, which affects the weight and therefore the number of loads needed. For example, 
                clay at 1.8 tonnes per cubic metre is much heavier than topsoil at 1.4 tonnes per cubic metre.
              </p>
              <h3>Planning Your Muck Away</h3>
              <p>
                Once you know the volume and weight, you can plan your waste removal more effectively. A standard 
                grab lorry can carry approximately 8 tonnes per load. Our calculator automatically factors this in 
                to give you an accurate load count.
              </p>
              <h3>Compliance Matters</h3>
              <p>
                From 2026, new Digital Waste Tracking regulations come into force in the UK. MuckAway.ai helps you 
                stay compliant with automated EWC code assignment and digital Waste Transfer Notes, saving you time 
                and reducing the risk of fines.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default WasteCalculator;
