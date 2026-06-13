import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  Key, 
  Webhook, 
  Shield, 
  Zap,
  ArrowRight,
  Copy,
  CheckCircle,
  Terminal,
  FileJson,
  Lock,
  Globe
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ApiDocs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const pythonExample = `import coai

# Initialize the client
client = coai.Client(api_key="your_api_key")

# Register an AI system
system = client.ai_systems.create(
    name="My AI Chatbot",
    description="Customer service chatbot",
    system_type="chatbot",
    risk_level="limited"
)

# Run compliance assessment
assessment = client.compliance.assess(
    system_id=system.id,
    frameworks=["eu_ai_act", "nist_rmf"]
)

# Get compliance score
print(f"EU AI Act Score: {assessment.eu_ai_act.score}%")
print(f"NIST RMF Score: {assessment.nist_rmf.score}%")

# Submit to 33-Agent Council for review
session = client.council.submit(
    system_id=system.id,
    subject="Compliance Review Request",
    context=assessment.summary
)

# Check voting status
print(f"Council Decision: {session.decision}")
print(f"Votes: {session.votes}")`;

  const javascriptExample = `import { CoaiClient } from '@coai/sdk';

// Initialize the client
const client = new CoaiClient({
  apiKey: process.env.COAI_API_KEY
});

// Register an AI system
const system = await client.aiSystems.create({
  name: 'My AI Chatbot',
  description: 'Customer service chatbot',
  systemType: 'chatbot',
  riskLevel: 'limited'
});

// Run compliance assessment
const assessment = await client.compliance.assess({
  systemId: system.id,
  frameworks: ['eu_ai_act', 'nist_rmf']
});

// Get compliance score
console.log(\`EU AI Act Score: \${assessment.euAiAct.score}%\`);
console.log(\`NIST RMF Score: \${assessment.nistRmf.score}%\`);

// Set up webhook for real-time alerts
await client.webhooks.create({
  url: 'https://your-app.com/webhooks/coai',
  events: ['watchdog.report', 'council.decision', 'compliance.alert']
});`;

  const curlExample = `# Register an AI system
curl -X POST https://api.coai.org/v1/ai-systems \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My AI Chatbot",
    "description": "Customer service chatbot",
    "system_type": "chatbot",
    "risk_level": "limited"
  }'

# Run compliance assessment
curl -X POST https://api.coai.org/v1/compliance/assess \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "system_id": "sys_abc123",
    "frameworks": ["eu_ai_act", "nist_rmf"]
  }'

# Get Watchdog reports for your system
curl https://api.coai.org/v1/watchdog/reports?system_id=sys_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Submit to 33-Agent Council
curl -X POST https://api.coai.org/v1/council/submit \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "system_id": "sys_abc123",
    "subject": "Compliance Review Request",
    "context": "Requesting review of bias mitigation measures"
  }'`;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/public">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">COAI</span>
              </div>
              <span className="font-semibold text-lg">API Documentation</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link href="/home">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href="/settings">
              <Button size="sm">Get API Key</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Code className="w-4 h-4" />
              Enterprise Integration
            </div>
            <h1 className="text-4xl font-bold mb-4">COAI API & SDK</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Integrate AI safety governance directly into your systems. 
              Programmatic access to compliance, council voting, and Watchdog alerts.
            </p>
          </div>

          {/* Quick Start Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Key className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Get API Key</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate your API key from the dashboard settings page.
                </p>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="gap-2">
                    Get Key <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Terminal className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Install SDK</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Install our SDK for Python, JavaScript, or use REST directly.
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded">pip install coai</code>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Start Building</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Register systems, run assessments, and integrate Watchdog alerts.
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  View Examples <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* API Endpoints */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm">
                  <div className="col-span-2">Method</div>
                  <div className="col-span-4">Endpoint</div>
                  <div className="col-span-6">Description</div>
                </div>
                
                {[
                  { method: "POST", endpoint: "/v1/ai-systems", desc: "Register a new AI system for compliance tracking" },
                  { method: "GET", endpoint: "/v1/ai-systems", desc: "List all registered AI systems" },
                  { method: "GET", endpoint: "/v1/ai-systems/:id", desc: "Get details of a specific AI system" },
                  { method: "PUT", endpoint: "/v1/ai-systems/:id", desc: "Update an AI system" },
                  { method: "DELETE", endpoint: "/v1/ai-systems/:id", desc: "Delete an AI system" },
                  { method: "POST", endpoint: "/v1/compliance/assess", desc: "Run compliance assessment against frameworks" },
                  { method: "GET", endpoint: "/v1/compliance/frameworks", desc: "List supported compliance frameworks" },
                  { method: "GET", endpoint: "/v1/compliance/requirements", desc: "Get requirements for a framework" },
                  { method: "POST", endpoint: "/v1/council/submit", desc: "Submit to 33-Agent Council for review" },
                  { method: "GET", endpoint: "/v1/council/sessions", desc: "List council voting sessions" },
                  { method: "GET", endpoint: "/v1/council/sessions/:id", desc: "Get session details and votes" },
                  { method: "GET", endpoint: "/v1/watchdog/reports", desc: "Get public Watchdog reports" },
                  { method: "POST", endpoint: "/v1/watchdog/reports", desc: "Submit a Watchdog report" },
                  { method: "POST", endpoint: "/v1/webhooks", desc: "Configure webhook for real-time alerts" },
                  { method: "GET", endpoint: "/v1/webhooks", desc: "List configured webhooks" },
                ].map((api, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 p-3 border-b last:border-0 text-sm">
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        api.method === "GET" ? "bg-green-100 text-green-700" :
                        api.method === "POST" ? "bg-blue-100 text-blue-700" :
                        api.method === "PUT" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {api.method}
                      </span>
                    </div>
                    <div className="col-span-4 font-mono text-xs">{api.endpoint}</div>
                    <div className="col-span-6 text-muted-foreground">{api.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Code Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="python">
                <TabsList className="mb-4">
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>

                <TabsContent value="python">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 gap-2"
                      onClick={() => copyToClipboard(pythonExample, "python")}
                    >
                      {copiedCode === "python" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{pythonExample}</code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="javascript">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 gap-2"
                      onClick={() => copyToClipboard(javascriptExample, "javascript")}
                    >
                      {copiedCode === "javascript" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{javascriptExample}</code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="curl">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 gap-2"
                      onClick={() => copyToClipboard(curlExample, "curl")}
                    >
                      {copiedCode === "curl" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{curlExample}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Webhooks & Real-time Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Configure webhooks to receive real-time notifications when important events occur.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">watchdog.report</h4>
                  <p className="text-sm text-muted-foreground">
                    Triggered when a new Watchdog report is submitted about your AI system
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">council.decision</h4>
                  <p className="text-sm text-muted-foreground">
                    Triggered when the 33-Agent Council reaches a decision on your submission
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">compliance.alert</h4>
                  <p className="text-sm text-muted-foreground">
                    Triggered when compliance status changes or new requirements are detected
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Tiers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                API Pricing Tiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Free</h3>
                  <p className="text-3xl font-bold mb-4">£0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      1 AI system
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      100 API calls/month
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Basic compliance reports
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Community support
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">Get Started</Button>
                </div>

                <div className="p-6 border-2 border-primary rounded-lg relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Pro</h3>
                  <p className="text-3xl font-bold mb-4">£500<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      10 AI systems
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      10,000 API calls/month
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      All frameworks (EU, NIST, TC260)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Webhooks & real-time alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Priority support
                    </li>
                  </ul>
                  <Button className="w-full">Start Pro Trial</Button>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Enterprise</h3>
                  <p className="text-3xl font-bold mb-4">£5,000<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Unlimited AI systems
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Unlimited API calls
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Custom SDK integration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      SSO/SAML authentication
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      99.9% SLA guarantee
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Dedicated support
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to integrate?</h2>
            <p className="text-muted-foreground mb-6">
              Get your API key and start building AI safety into your systems today.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/settings">
                <Button size="lg" className="gap-2">
                  Get API Key <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="https://github.com/optimobile/coai-dashboard" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2">
                  <Globe className="w-4 h-4" />
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
