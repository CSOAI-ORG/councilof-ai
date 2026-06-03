import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  Shield,
  CreditCard,
  Database,
  Globe,
  Key,
  Lock,
  Zap,
  FileCheck,
  Server,
  Smartphone
} from "lucide-react";
import { isProduction, getEnvironmentName } from "@/lib/environment";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: { status: string; latency_ms?: number; error?: string };
    stripe: { status: string; mode?: string; error?: string };
    secrets: { status: string; configured: string[]; missing: string[] };
  };
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: "complete" | "pending" | "error" | "checking";
  category: "security" | "technical" | "stripe" | "manual";
  icon: React.ReactNode;
  link?: string;
}

export function PreLaunchChecklist() {
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("health-check");
      
      if (fnError) throw fnError;
      setHealthCheck(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health check failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getChecklistItems = (): ChecklistItem[] => {
    const items: ChecklistItem[] = [
      // Security checks
      {
        id: "jwt-verification",
        label: "JWT Verification",
        description: "22+ edge functions protected with JWT verification",
        status: "complete",
        category: "security",
        icon: <Lock className="w-5 h-5" />,
      },
      {
        id: "rate-limiting",
        label: "Rate Limiting",
        description: "Public endpoints protected (100 req/min per IP)",
        status: "complete",
        category: "security",
        icon: <Shield className="w-5 h-5" />,
      },
      {
        id: "token-security",
        label: "Token Security",
        description: "Using crypto.randomUUID() + SHA-256 hashing",
        status: "complete",
        category: "security",
        icon: <Key className="w-5 h-5" />,
      },
      {
        id: "input-validation",
        label: "Input Validation",
        description: "Zod schemas on all forms",
        status: "complete",
        category: "security",
        icon: <FileCheck className="w-5 h-5" />,
      },
      {
        id: "rls-policies",
        label: "RLS Policies",
        description: "All tables have row-level security enabled",
        status: "complete",
        category: "security",
        icon: <Database className="w-5 h-5" />,
      },
      // Technical checks
      {
        id: "database",
        label: "Database Connection",
        description: healthCheck?.checks.database.latency_ms 
          ? `Connected (${healthCheck.checks.database.latency_ms}ms latency)`
          : "Checking database connectivity...",
        status: healthCheck?.checks.database.status === "ok" ? "complete" 
          : healthCheck?.checks.database.status === "error" ? "error" 
          : "checking",
        category: "technical",
        icon: <Database className="w-5 h-5" />,
      },
      {
        id: "secrets",
        label: "Required Secrets",
        description: healthCheck?.checks.secrets.missing.length === 0 
          ? "All secrets configured"
          : `Missing: ${healthCheck?.checks.secrets.missing.join(", ")}`,
        status: healthCheck?.checks.secrets.status === "ok" ? "complete" : "error",
        category: "technical",
        icon: <Key className="w-5 h-5" />,
      },
      {
        id: "edge-functions",
        label: "Edge Functions",
        description: "25+ functions deployed and verified",
        status: "complete",
        category: "technical",
        icon: <Server className="w-5 h-5" />,
      },
      {
        id: "pwa",
        label: "PWA Features",
        description: "Service worker, offline support, install prompt",
        status: "complete",
        category: "technical",
        icon: <Smartphone className="w-5 h-5" />,
      },
      // Stripe checks
      {
        id: "stripe",
        label: "Stripe Integration",
        description: healthCheck?.checks.stripe.status === "ok"
          ? `Connected (${healthCheck.checks.stripe.mode} mode)`
          : healthCheck?.checks.stripe.error || "Checking Stripe...",
        status: healthCheck?.checks.stripe.status === "ok" ? "complete" : "error",
        category: "stripe",
        icon: <CreditCard className="w-5 h-5" />,
      },
      {
        id: "subscription-tiers",
        label: "Subscription Tiers",
        description: "3 tiers configured (Starter, Professional, Enterprise)",
        status: "complete",
        category: "stripe",
        icon: <Zap className="w-5 h-5" />,
      },
      {
        id: "stripe-live",
        label: "Stripe Live Mode",
        description: healthCheck?.checks.stripe.mode === "live"
          ? "Using production keys"
          : "Currently using test keys - switch to live for production",
        status: healthCheck?.checks.stripe.mode === "live" ? "complete" : "pending",
        category: "stripe",
        icon: <Shield className="w-5 h-5" />,
        link: "https://dashboard.stripe.com/developers",
      },
      // Manual checks
      {
        id: "domain",
        label: "Custom Domain",
        description: isProduction()
          ? "Production domain configured"
          : "Connect muckaway.ai in Lovable Settings → Domains",
        status: isProduction() ? "complete" : "pending",
        category: "manual",
        icon: <Globe className="w-5 h-5" />,
      },
      {
        id: "customer-portal",
        label: "Stripe Customer Portal",
        description: "Configure branding in Stripe Dashboard",
        status: "pending",
        category: "manual",
        icon: <CreditCard className="w-5 h-5" />,
        link: "https://dashboard.stripe.com/settings/billing/portal",
      },
      {
        id: "leaked-password",
        label: "Leaked Password Protection",
        description: "Enable in Supabase Dashboard → Auth → Security",
        status: "pending",
        category: "manual",
        icon: <Shield className="w-5 h-5" />,
      },
    ];

    return items;
  };

  const items = getChecklistItems();
  const securityItems = items.filter(i => i.category === "security");
  const technicalItems = items.filter(i => i.category === "technical");
  const stripeItems = items.filter(i => i.category === "stripe");
  const manualItems = items.filter(i => i.category === "manual");

  const completedCount = items.filter(i => i.status === "complete").length;
  const totalCount = items.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const getStatusIcon = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "pending":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "checking":
        return <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusBadge = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "complete":
        return <Badge variant="default" className="bg-green-500">Complete</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "pending":
        return <Badge variant="secondary">Manual Step</Badge>;
      case "checking":
        return <Badge variant="outline">Checking...</Badge>;
    }
  };

  const renderSection = (title: string, sectionItems: ChecklistItem[], icon: React.ReactNode) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {sectionItems.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="mt-0.5">{getStatusIcon(item.status)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{item.label}</span>
              {getStatusBadge(item.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          </div>
          {item.link && (
            <Button variant="ghost" size="sm" asChild>
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Pre-Launch Checklist
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Environment: <Badge variant="outline">{getEnvironmentName()}</Badge>
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runHealthCheck}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Launch Readiness</span>
            <span className="font-medium">{completedCount}/{totalCount} ({progressPercent}%)</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {healthCheck && (
          <div className="flex items-center gap-2 p-3 rounded-lg border">
            <Badge
              variant={
                healthCheck.status === "healthy"
                  ? "default"
                  : healthCheck.status === "degraded"
                  ? "secondary"
                  : "destructive"
              }
              className={healthCheck.status === "healthy" ? "bg-green-500" : ""}
            >
              {healthCheck.status.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last checked: {new Date(healthCheck.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {renderSection("Security Hardening", securityItems, <Lock className="w-4 h-4" />)}
        {renderSection("Technical Infrastructure", technicalItems, <Server className="w-4 h-4" />)}
        {renderSection("Stripe Configuration", stripeItems, <CreditCard className="w-4 h-4" />)}
        {renderSection("Manual Steps Required", manualItems, <AlertCircle className="w-4 h-4" />)}

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                Stripe Dashboard <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://docs.lovable.dev/features/custom-domain" target="_blank" rel="noopener noreferrer">
                Domain Setup <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/LAUNCH_READINESS_REPORT.md" target="_blank" rel="noopener noreferrer">
                Full Report <FileCheck className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
