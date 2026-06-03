import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { IntegrationCard } from '@/components/IntegrationCard';
import { 
  integrationProviders, 
  migrationProviders, 
  categoryLabels,
  categoryIcons 
} from '@/config/integrationProviders';
import { 
  ArrowRight, 
  Check, 
  Code, 
  Download, 
  FileText, 
  Shield, 
  Upload, 
  Zap,
  Brain,
  Clock,
  RefreshCw,
  Headphones,
  Terminal,
  Webhook
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SmartIntegrations() {
  const [activeCategory, setActiveCategory] = useState('accounting');

  const filteredProviders = integrationProviders.filter(
    (p) => p.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 text-primary border-primary">
              50+ Integrations Available
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Connect Your Tools.{' '}
              <span className="text-primary">Automate Your Workflows.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Zero Manual Data Entry. 100% Compatible. MuckAway.ai seamlessly integrates with 
              50+ construction, accounting, and fleet management platforms. Switch in minutes, not months.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button size="lg" asChild>
                <a href="#integrations">
                  Browse Integrations
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline">
                <Download className="mr-2 w-4 h-4" />
                Download CSV Template
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#api">
                  <Code className="mr-2 w-4 h-4" />
                  View API Docs
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>One-Click CSV Import</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Two-Way Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Secure API</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Our Smart Integrations Are Different
          </h2>
          
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b border-border">Feature</th>
                  <th className="text-left p-4 border-b border-border text-muted-foreground">Other Platforms</th>
                  <th className="text-left p-4 border-b border-border text-primary">Our Smart Integrations</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 border-b border-border font-medium">CSV Imports</td>
                  <td className="p-4 border-b border-border text-muted-foreground">Manual mapping, errors</td>
                  <td className="p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      AI auto-maps fields, learns your format
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 border-b border-border font-medium">Accounting Sync</td>
                  <td className="p-4 border-b border-border text-muted-foreground">Manual invoice entry</td>
                  <td className="p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-primary" />
                      Automatic invoice generation & reconciliation
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 border-b border-border font-medium">Fleet Tracking</td>
                  <td className="p-4 border-b border-border text-muted-foreground">Switch between apps</td>
                  <td className="p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Live GPS data in your dashboard
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 border-b border-border font-medium">Project Management</td>
                  <td className="p-4 border-b border-border text-muted-foreground">Copy-paste updates</td>
                  <td className="p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-primary" />
                      Real-time status sync
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 border-b border-border font-medium">Setup Time</td>
                  <td className="p-4 border-b border-border text-muted-foreground">2-3 weeks</td>
                  <td className="p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      5 minutes (most integrations)
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-center mt-8 text-lg">
            <span className="text-primary font-semibold">Switch from any provider in 3 clicks.</span>{' '}
            No data loss. No downtime.
          </p>
        </div>
      </section>

      {/* Integration Categories */}
      <section id="integrations" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Browse Integrations by Category
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Connect your existing tools and start syncing data in minutes
          </p>

          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 mb-8 h-auto bg-transparent">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="mr-2">{categoryIcons[key]}</span>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.keys(categoryLabels).map((category) => (
              <TabsContent key={category} value={category}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {integrationProviders
                    .filter((p) => p.category === category)
                    .map((provider) => (
                      <IntegrationCard 
                        key={provider.id} 
                        provider={provider} 
                        variant="public"
                      />
                    ))}
                </div>

                {category === 'accounting' && (
                  <Card className="mt-8 border-dashed">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        CSV Import (Works with ANY Accounting Software)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Don't see your platform? Export as CSV and our AI will:
                      </p>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Auto-detect columns (Customer Name, Equipment, Rates, Dates)
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Learn your naming conventions
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Map to our system automatically
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          Flag errors before import
                        </li>
                      </ul>
                      <div className="flex gap-4">
                        <Button variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download CSV Template
                        </Button>
                        <Button>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Your File
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Migration Wizard Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Switching from Another Provider?{' '}
              <span className="text-primary">Migrate in 3 Clicks.</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Our AI Migration Tool Handles Everything
            </p>

            {/* 3-Step Process */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Step 1: Upload Your Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Export from your current system (CSV, Excel, PDF, or API access). 
                    Our AI recognizes formats from 100+ providers.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Step 2: AI Analyzes & Maps</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We automatically detect customers, equipment, bookings, and pricing. 
                    No manual mapping required.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Step 3: Review & Sync</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Preview imported data. Approve sections individually. 
                    Go live when ready—no downtime.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mb-12">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Migration Wizard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Supported Providers */}
            <h3 className="text-xl font-semibold mb-6">Supported Providers (Pre-Mapped Templates)</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🚜 Waste Management Software</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {migrationProviders.waste_management.map((provider) => (
                      <li key={provider.id} className="flex justify-between items-center">
                        <span className="font-medium">{provider.name}</span>
                        <span className="text-sm text-muted-foreground">{provider.feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏗️ Plant/Machinery Hire Software</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {migrationProviders.plant_hire.map((provider) => (
                      <li key={provider.id} className="flex justify-between items-center">
                        <span className="font-medium">{provider.name}</span>
                        <span className="text-sm text-muted-foreground">{provider.feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🚛 Grab Hire Software</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {migrationProviders.grab_hire.map((provider) => (
                      <li key={provider.id} className="flex justify-between items-center">
                        <span className="font-medium">{provider.name}</span>
                        <span className="text-sm text-muted-foreground">{provider.feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Generic Business Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {migrationProviders.generic.map((provider) => (
                      <li key={provider.id} className="flex justify-between items-center">
                        <span className="font-medium">{provider.name}</span>
                        <span className="text-sm text-muted-foreground">{provider.feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Data Migration Includes */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Data Migration Includes:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    'Customer database (with GDPR compliance)',
                    'Equipment inventory & specifications',
                    'Active & historical bookings',
                    'Pricing & discount structures',
                    'Financial data (invoices, payments)',
                    'Driver/operator certifications',
                    'Project/job site information',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <Shield className="w-4 h-4 inline mr-1" />
                  <strong>Security:</strong> All migrations are encrypted end-to-end. Data is never stored after import.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Developer Section */}
      <section id="api" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Build Custom Integrations with Our API
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              RESTful API with Webhook Support
            </p>

            {/* Code Example */}
            <Card className="bg-zinc-900 text-zinc-100 mb-8">
              <CardHeader>
                <CardTitle className="text-sm font-mono text-zinc-400">Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto">
{`# Get your API key from the dashboard
curl -X GET https://api.muckaway.ai/v1/equipment \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </pre>
              </CardContent>
            </Card>

            {/* API Features */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-primary" />
                    API Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Real-time webhooks for instant notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Bulk operations for thousands of records
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Sandbox environment for safe testing
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      GraphQL endpoint available
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      OAuth 2.0 for secure authentication
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    SDKs Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 font-mono text-sm">
                    <li className="flex items-center justify-between">
                      <span>Python</span>
                      <code className="bg-muted px-2 py-1 rounded">pip install muckaway-ai</code>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Node.js</span>
                      <code className="bg-muted px-2 py-1 rounded">npm install @muckaway/ai</code>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>PHP</span>
                      <code className="bg-muted px-2 py-1 rounded">composer require muckaway/ai</code>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Ruby</span>
                      <code className="bg-muted px-2 py-1 rounded">gem install muckaway-ai</code>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                View API Docs
              </Button>
              <Button variant="outline">
                <Code className="w-4 h-4 mr-2" />
                Interactive API Explorer
              </Button>
              <Button variant="outline">
                <Webhook className="w-4 h-4 mr-2" />
                Webhook Events
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Enterprise-Grade Integration
            </h2>
            <p className="text-muted-foreground mb-12">
              For Companies with Complex Requirements
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Headphones className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Dedicated Engineer</h3>
                  <p className="text-sm text-muted-foreground">
                    We assign an engineer to your migration
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Code className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Custom Field Mapping</h3>
                  <p className="text-sm text-muted-foreground">
                    Any data structure supported
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">99.9% SLA</h3>
                  <p className="text-sm text-muted-foreground">
                    Uptime guarantee for API & integrations
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Priority Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Direct line to integration team
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Security Certifications */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap justify-center gap-4">
                  <Badge variant="outline" className="px-4 py-2">SOC 2 Type II Certified</Badge>
                  <Badge variant="outline" className="px-4 py-2">GDPR Compliant</Badge>
                  <Badge variant="outline" className="px-4 py-2">ISO 27001 Certified</Badge>
                  <Badge variant="outline" className="px-4 py-2">End-to-End Encryption</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/contact">
                  Contact Enterprise Sales
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                View Enterprise Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
