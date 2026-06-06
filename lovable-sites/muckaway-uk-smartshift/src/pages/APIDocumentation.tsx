import { DashboardLayout } from '@/components/DashboardLayout';
import { APIKeyManager } from '@/components/APIKeyManager';
import { WebhookManager } from '@/components/WebhookManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Key, Webhook, Book, Code } from 'lucide-react';

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/jobs',
    description: 'List all jobs',
    params: ['limit', 'offset', 'status'],
  },
  {
    method: 'POST',
    path: '/api/v1/jobs',
    description: 'Create a new job',
    params: ['material_type', 'volume_tonnes', 'site_address'],
  },
  {
    method: 'GET',
    path: '/api/v1/jobs/:id',
    description: 'Get job details',
    params: [],
  },
  {
    method: 'PUT',
    path: '/api/v1/jobs/:id',
    description: 'Update a job',
    params: ['status', 'notes'],
  },
  {
    method: 'GET',
    path: '/api/v1/quotes',
    description: 'List all quotes',
    params: ['limit', 'offset'],
  },
  {
    method: 'POST',
    path: '/api/v1/quotes',
    description: 'Create a quote',
    params: ['material_type', 'volume_tonnes', 'site_postcode'],
  },
  {
    method: 'GET',
    path: '/api/v1/vehicles',
    description: 'List fleet vehicles',
    params: ['active'],
  },
  {
    method: 'GET',
    path: '/api/v1/drivers',
    description: 'List drivers',
    params: ['active'],
  },
];

const CODE_EXAMPLES = {
  curl: `curl -X GET "https://api.muckaway.ai/v1/jobs" \\
  -H "Authorization: Bearer muck_your_api_key" \\
  -H "Content-Type: application/json"`,
  javascript: `const response = await fetch('https://api.muckaway.ai/v1/jobs', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer muck_your_api_key',
    'Content-Type': 'application/json'
  }
});

const jobs = await response.json();`,
  python: `import requests

response = requests.get(
    'https://api.muckaway.ai/v1/jobs',
    headers={
        'Authorization': 'Bearer muck_your_api_key',
        'Content-Type': 'application/json'
    }
)

jobs = response.json()`,
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-yellow-500',
  DELETE: 'bg-red-500',
};

export default function APIDocumentation() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API & Integrations</h1>
          <p className="text-muted-foreground">
            Connect external systems using our REST API and webhooks
          </p>
        </div>

        <Tabs defaultValue="keys" className="space-y-4">
          <TabsList>
            <TabsTrigger value="keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Documentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys">
            <APIKeyManager />
          </TabsContent>

          <TabsContent value="webhooks">
            <WebhookManager />
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  All API requests require authentication using an API key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Include your API key in the Authorization header of all requests:
                </p>
                <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                  <code>Authorization: Bearer muck_your_api_key</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endpoints</CardTitle>
                <CardDescription>
                  Available API endpoints for managing your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {API_ENDPOINTS.map((endpoint, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-3 border rounded-lg"
                    >
                      <Badge className={METHOD_COLORS[endpoint.method]}>
                        {endpoint.method}
                      </Badge>
                      <div className="flex-1">
                        <code className="text-sm font-mono">{endpoint.path}</code>
                        <p className="text-sm text-muted-foreground mt-1">
                          {endpoint.description}
                        </p>
                        {endpoint.params.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {endpoint.params.map((param) => (
                              <Badge key={param} variant="outline" className="text-xs">
                                {param}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code Examples
                </CardTitle>
                <CardDescription>
                  Quick start examples in popular languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="curl">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(CODE_EXAMPLES).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang}>
                      <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                        <code>{code}</code>
                      </pre>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limits</CardTitle>
                <CardDescription>
                  API usage limits based on your subscription tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">1,000</p>
                    <p className="text-sm text-muted-foreground">Starter requests/day</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">10,000</p>
                    <p className="text-sm text-muted-foreground">Professional requests/day</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">Unlimited</p>
                    <p className="text-sm text-muted-foreground">Enterprise requests/day</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
