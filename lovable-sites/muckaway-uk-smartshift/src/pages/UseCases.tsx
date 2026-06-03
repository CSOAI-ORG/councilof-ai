import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Building2, 
  HardHat, 
  Home, 
  Train, 
  Waves, 
  Mountain,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const useCases = [
  {
    icon: Building2,
    title: "Commercial Construction",
    subtitle: "Office buildings, retail, mixed-use developments",
    description: "Handle bulk excavation spoil from foundation works and basement construction. Track multiple material types from a single site with automated compliance documentation.",
    benefits: [
      "Basement excavation spoil management",
      "Foundation dig material classification",
      "Multi-contractor coordination",
      "Real-time job tracking across sites"
    ],
    volume: "500-10,000+ tonnes per project"
  },
  {
    icon: HardHat,
    title: "Civil Engineering",
    subtitle: "Roads, bridges, tunnels, utilities",
    description: "Manage complex earthworks with mixed material types. From highway construction to tunnel boring, our AI handles classification at scale.",
    benefits: [
      "Highway and road construction",
      "Tunnel boring spoil",
      "Bridge foundation works",
      "Pipeline and cable trenching"
    ],
    volume: "1,000-100,000+ tonnes per project"
  },
  {
    icon: Home,
    title: "Residential Development",
    subtitle: "Housing estates, apartments, renovations",
    description: "Perfect for housebuilders managing multiple plots. Generate instant quotes for each plot and track spoil removal across your entire development.",
    benefits: [
      "Plot-by-plot tracking",
      "Foundation excavation",
      "Garden landscaping waste",
      "Renovation and demolition debris"
    ],
    volume: "50-5,000 tonnes per development"
  },
  {
    icon: Train,
    title: "Infrastructure Projects",
    subtitle: "Rail, metro, airports, ports",
    description: "Major infrastructure demands precise compliance. Our platform handles the complexity of large-scale, multi-phase projects with stringent regulatory requirements.",
    benefits: [
      "Rail and metro construction",
      "Airport expansion works",
      "Port development",
      "Large-scale utility projects"
    ],
    volume: "10,000-500,000+ tonnes per project"
  },
  {
    icon: Waves,
    title: "Dredging Operations",
    subtitle: "Marine, river, canal maintenance",
    description: "Specialized handling for dredged materials with complex contamination profiles. AI classification helps optimize disposal routes and identify reuse opportunities.",
    benefits: [
      "Marina and harbour dredging",
      "River and flood defence",
      "Canal maintenance",
      "Contaminated sediment handling"
    ],
    volume: "5,000-50,000+ tonnes per project"
  },
  {
    icon: Mountain,
    title: "Mining & Quarrying",
    subtitle: "Overburden, tailings, restoration",
    description: "Manage overburden removal and site restoration. Track material movements across large sites with real-time fleet monitoring and compliance tracking.",
    benefits: [
      "Overburden management",
      "Site restoration",
      "Material reuse optimization",
      "Long-term project tracking"
    ],
    volume: "100,000+ tonnes per operation"
  }
];

const UseCases = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-6 bg-primary/10 text-primary">Use Cases</Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Built for Every <span className="text-primary">Project Type</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From small residential builds to major infrastructure projects, MuckAway.ai 
              adapts to your needs. See how industry leaders use our platform.
            </p>
          </div>
        </section>

        {/* Use Cases Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <Card key={index} className="group hover:shadow-elegant transition-all duration-300 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <useCase.icon className="h-7 w-7 text-primary" />
                      </div>
                      <Badge variant="secondary">{useCase.volume}</Badge>
                    </div>
                    <CardTitle className="text-xl">{useCase.title}</CardTitle>
                    <CardDescription className="text-primary font-medium">
                      {useCase.subtitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-muted-foreground mb-6">{useCase.description}</p>
                    <div className="mt-auto">
                      <h4 className="font-semibold text-foreground mb-3">Key Applications:</h4>
                      <ul className="space-y-2">
                        {useCase.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Ready to Transform Your Operations?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Join hundreds of construction companies already using MuckAway.ai to 
              streamline their waste management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="action" size="lg" asChild>
                <Link to="/ai-tools">
                  Try AI Classifier Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/how-to-use">See How It Works</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default UseCases;
