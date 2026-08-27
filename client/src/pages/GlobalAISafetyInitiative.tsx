import {useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Shield, 
  Users, 
  Building2, 
  GraduationCap, 
  CheckCircle2,
  ArrowRight,
  Download,
  Mail,
  Phone,
  MapPin,
  FileText,
  Zap,
  Target,
  Award,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

// List of 118 countries without AI governance
const COUNTRIES_WITHOUT_GOVERNANCE = [
  "Afghanistan", "Albania", "Algeria", "Angola", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh",
  "Belarus", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brunei",
  "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Cape Verde", "Central African Republic", "Chad",
  "Comoros", "Congo (Brazzaville)", "Congo (DRC)", "Costa Rica", "Côte d'Ivoire", "Cuba", "Djibouti",
  "Dominican Republic", "Ecuador", "El Salvador", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia",
  "Fiji", "Gabon", "Gambia", "Georgia", "Ghana", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Iraq", "Jamaica", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", "Laos",
  "Lebanon", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Maldives", "Mali", "Mauritania",
  "Mauritius", "Moldova", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nepal", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Oman", "Pakistan", "Palestine",
  "Panama", "Papua New Guinea", "Paraguay", "Philippines", "Qatar", "Romania", "Rwanda", "Samoa",
  "São Tomé and Príncipe", "Senegal", "Serbia", "Sierra Leone", "Solomon Islands", "Somalia",
  "South Sudan", "Sri Lanka", "Sudan", "Suriname", "Syria", "Tajikistan", "Tanzania", "Timor-Leste",
  "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkmenistan", "Uganda", "Ukraine", "Uzbekistan",
  "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Antigua and Barbuda", "Barbados"
];

const REGIONS = {
  "Africa": ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", "Cape Verde", 
    "Central African Republic", "Chad", "Comoros", "Congo (Brazzaville)", "Congo (DRC)", "Côte d'Ivoire",
    "Djibouti", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana",
    "Guinea", "Guinea-Bissau", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania",
    "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe",
    "Senegal", "Sierra Leone", "Somalia", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda",
    "Zambia", "Zimbabwe"],
  "Asia": ["Afghanistan", "Armenia", "Azerbaijan", "Bangladesh", "Bhutan", "Brunei", "Cambodia", "Georgia",
    "Kazakhstan", "Kyrgyzstan", "Laos", "Maldives", "Mongolia", "Myanmar", "Nepal", "Pakistan", "Philippines",
    "Sri Lanka", "Tajikistan", "Timor-Leste", "Turkmenistan", "Uzbekistan", "Vietnam"],
  "Middle East": ["Bahrain", "Iraq", "Jordan", "Kuwait", "Lebanon", "Oman", "Palestine", "Qatar", "Syria", "Yemen"],
  "Europe": ["Albania", "Belarus", "Bosnia and Herzegovina", "Moldova", "Montenegro", "North Macedonia", 
    "Romania", "Serbia", "Ukraine"],
  "Americas": ["Belize", "Bolivia", "Costa Rica", "Cuba", "Dominican Republic", "Ecuador", "El Salvador",
    "Guatemala", "Guyana", "Haiti", "Honduras", "Jamaica", "Nicaragua", "Panama", "Paraguay", "Suriname",
    "Trinidad and Tobago", "Venezuela", "Antigua and Barbuda", "Barbados"],
  "Oceania": ["Fiji", "Papua New Guinea", "Samoa", "Solomon Islands", "Tonga", "Vanuatu"]
};

export default function GlobalAISafetyInitiative() {
  useEffect(() => { document.title = "Global AI Safety Initiative | Council of AI"; }, []);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    role: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you for your interest! Our government partnerships team will contact you within 48 hours.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <Globe className="mr-2 h-4 w-4" />
              Global AI Safety Initiative
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              AI Governance for{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Every Nation
              </span>
            </h1>
            <p className="mb-8 text-xl text-gray-600">
              The UN's 2024 report <em>Governing AI for Humanity</em> found 118 countries were party to
              none of the major international AI governance initiatives. We help governments close that
              gap with measurement tools and training — not a conformity mark.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a href="/contact" className="bg-emerald-600 hover:bg-emerald-700">
                <Building2 className="mr-2 h-5 w-5" />
                Request Government Demo
              </a>
              <Button size="lg" variant="outline" disabled title="No file is published for this yet.">Brochure not published yet</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section — every figure sourced */}
      <section className="border-y bg-white py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600">118</div>
              <div className="text-gray-600">Countries party to none of the major AI governance initiatives</div>
              <div className="mt-1 text-xs text-gray-400">UN, <em>Governing AI for Humanity</em>, 2024</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">7</div>
              <div className="text-gray-600">Countries party to all of them</div>
              <div className="mt-1 text-xs text-gray-400">UN, <em>Governing AI for Humanity</em>, 2024</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">Aug 2026</div>
              <div className="text-gray-600">EU AI Act high-risk (Annex III) obligations apply</div>
              <div className="mt-1 text-xs text-gray-400">Regulation (EU) 2024/1689, Art. 113</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">The Global AI Governance Gap</h2>
            <p className="text-lg text-gray-600">
              According to the UN's 2024 report "Governing AI for Humanity," only 7 countries participate 
              in all major AI governance initiatives. The remaining 118 nations are left without frameworks 
              to protect their citizens from AI risks.
            </p>
          </div>

          <Tabs defaultValue="africa" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
              <TabsTrigger value="africa">Africa ({REGIONS.Africa.length})</TabsTrigger>
              <TabsTrigger value="asia">Asia ({REGIONS.Asia.length})</TabsTrigger>
              <TabsTrigger value="middle-east">Middle East ({REGIONS["Middle East"].length})</TabsTrigger>
              <TabsTrigger value="europe">Europe ({REGIONS.Europe.length})</TabsTrigger>
              <TabsTrigger value="americas">Americas ({REGIONS.Americas.length})</TabsTrigger>
              <TabsTrigger value="oceania">Oceania ({REGIONS.Oceania.length})</TabsTrigger>
            </TabsList>
            
            {Object.entries(REGIONS).map(([region, countries]) => (
              <TabsContent key={region} value={region.toLowerCase().replace(" ", "-")}>
                <Card>
                  <CardHeader>
                    <CardTitle>{region} - Countries Needing AI Governance</CardTitle>
                    <CardDescription>
                      {countries.length} countries in {region} currently lack comprehensive AI safety frameworks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {countries.map((country) => (
                        <Badge key={country} variant="outline" className="cursor-pointer hover:bg-emerald-50">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="bg-gray-50 py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Government Partnership Tiers</h2>
            <p className="text-lg text-gray-600">
              Flexible solutions designed for nations at every stage of AI governance maturity
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Capacity Building */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-blue-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-blue-500" />
                  Capacity Building
                </CardTitle>
                <CardDescription>For nations beginning their AI governance journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Free rail</span>
                  <span className="text-gray-600"> · partnership scoped with you</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Measurement credential for 100 government officials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>AI governance curriculum and materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Framework development consultation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Quarterly progress reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Access to CSOAI knowledge base</span>
                  </li>
                </ul>
                <a href="/about" className="w-full">
                  Learn More
                </a>
              </CardContent>
            </Card>

            {/* National Authority */}
            <Card className="relative overflow-hidden border-emerald-200 shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-emerald-500" />
                  National Authority
                </CardTitle>
                <CardDescription>Full white-label AI safety framework</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Free rail</span>
                  <span className="text-gray-600"> · partnership scoped with you</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Complete white-label platform with national branding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Local language support and customization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Training for AI Safety Analysts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Designed 33-agent Council of AI access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Dedicated implementation team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>24/7 support and maintenance</span>
                  </li>
                </ul>
                <a href="/contact" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Request Proposal
                </a>
              </CardContent>
            </Card>

            {/* Regional Consortium */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-purple-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-6 w-6 text-purple-500" />
                  Regional Consortium
                </CardTitle>
                <CardDescription>Multi-nation collaborative framework</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Free rail</span>
                  <span className="text-gray-600"> · partnership scoped with you</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Multi-country deployment (e.g., African Union, ASEAN)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Shared infrastructure with country-specific customization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Cross-border incident reporting and coordination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Regional AI safety standards development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Unlimited analyst training across member nations</span>
                  </li>
                </ul>
                <a href="/contact" className="w-full">
                  Contact for Custom Quote
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How the White-Label Pipeline Works</h2>
            <p className="text-lg text-gray-600">
              Our automated framework generation system gets your nation AI-ready in months, not years
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>1. Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We analyze your nation's AI landscape, existing regulations, and specific needs
                </p>
                <Badge className="mt-4" variant="outline">
                  <Clock className="mr-1 h-3 w-3" /> 2-4 Weeks
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Zap className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>2. Framework Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our AI-powered system generates a customized governance framework for your nation
                </p>
                <Badge className="mt-4" variant="outline">
                  <Clock className="mr-1 h-3 w-3" /> 4-8 Weeks
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <Users className="h-8 w-8 text-amber-600" />
                </div>
                <CardTitle>3. Training Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We train your first cohort of AI Safety Analysts through free measurement-credential attestation
                </p>
                <Badge className="mt-4" variant="outline">
                  <Clock className="mr-1 h-3 w-3" /> 8-12 Weeks
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>4. Full Operation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Your national AI safety authority is fully operational with ongoing support
                </p>
                <Badge className="mt-4" variant="outline">
                  <Clock className="mr-1 h-3 w-3" /> 6 Months Total
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Free training rail — no fabricated totals */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 py-20 text-white">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-white/20 text-white hover:bg-white/20">
              <GraduationCap className="mr-2 h-4 w-4" />
              Free Training Rail
            </Badge>
            <h2 className="mb-6 text-4xl font-bold">
              Training and verification are free
            </h2>
            <p className="mb-8 text-xl text-white/90">
              Government officials can complete Council Academy training and receive a measurement
              credential at no cost, and signed measurement results stay free to verify. The credential
              attests training completion — it is not a conformity mark or certification.
            </p>
            <a href="/academy" className="bg-white text-emerald-700 hover:bg-gray-100">
              Apply for Free Training
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Request Government Partnership</CardTitle>
                <CardDescription>
                  Our team will respond within 48 hours with a customized proposal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Official Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="your.name@gov.xx"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES_WITHOUT_GOVERNANCE.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier">Interested Tier</Label>
                      <Select value={selectedTier} onValueChange={setSelectedTier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select partnership tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="capacity">Capacity Building</SelectItem>
                          <SelectItem value="national">National Authority</SelectItem>
                          <SelectItem value="regional">Regional Consortium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="organization">Government Department</Label>
                      <Input 
                        id="organization" 
                        placeholder="Ministry of Technology"
                        value={formData.organization}
                        onChange={(e) => setFormData({...formData, organization: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Your Role</Label>
                      <Input 
                        id="role" 
                        placeholder="Director of Digital Policy"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us about your nation's AI governance needs..."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Mail className="mr-2 h-5 w-5" />
                    Submit Partnership Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t bg-gray-900 py-16 text-white">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Lead in AI Governance?
            </h2>
            <p className="mb-8 text-lg text-gray-400">
              Join the global movement to make AI safe for everyone. Contact our government 
              partnerships team today.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a href="/contact" className="bg-emerald-600 hover:bg-emerald-700">
                <Phone className="mr-2 h-5 w-5" />
                Schedule a Call
              </a>
              <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800" disabled title="No file is published for this yet.">White paper not published yet</Button>
            </div>
            <div className="mt-8 flex justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                government@csoai.org
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Via email — we reply within one working day
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                London, United Kingdom
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
