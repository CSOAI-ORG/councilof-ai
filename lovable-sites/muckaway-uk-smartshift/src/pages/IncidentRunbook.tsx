import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Database, 
  CreditCard, 
  Shield, 
  Server, 
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const IncidentRunbook = () => {
  return (
    <>
      <Helmet>
        <title>Incident Response Runbook | MuckAway.ai</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <Header />
      
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Incident Response Runbook
            </h1>
            <p className="text-muted-foreground">
              Emergency procedures for critical system incidents
            </p>
          </div>

          <Alert className="mb-8 border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Emergency Contacts</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>On-Call: +44 XXX XXX XXXX</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>incidents@muckaway.ai</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* AI Service Outage */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                AI Service Outage
                <Badge variant="destructive">Critical</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Symptoms</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>MuckBot not responding or returning errors</li>
                  <li>Spoil classifier failing to analyze images</li>
                  <li>429 or 503 errors from AI endpoints</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Immediate Actions</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Check Lovable AI Gateway status</li>
                  <li>Verify LOVABLE_API_KEY is valid in secrets</li>
                  <li>Check edge function logs for errors</li>
                  <li>Enable fallback responses in chatbot</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">User Communication</h4>
                <p className="text-muted-foreground">
                  "Our AI assistant is temporarily unavailable. Please contact support@muckaway.ai for immediate assistance."
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Target Resolution: 30 minutes</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Failures */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment System Failure
                <Badge variant="destructive">Critical</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Symptoms</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Checkout sessions failing to create</li>
                  <li>Stripe webhook errors in logs</li>
                  <li>Subscriptions not activating after payment</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Immediate Actions</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Check Stripe Dashboard for API status</li>
                  <li>Verify STRIPE_SECRET_KEY is valid</li>
                  <li>Check webhook endpoint health</li>
                  <li>Review recent failed payments in Stripe</li>
                  <li>Manually process urgent subscriptions if needed</li>
                </ol>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Target Resolution: 15 minutes</span>
              </div>
            </CardContent>
          </Card>

          {/* Database Issues */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Database Connectivity Issues
                <Badge variant="secondary">High</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Symptoms</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Queries timing out or failing</li>
                  <li>Edge functions returning 500 errors</li>
                  <li>Data not loading in dashboard</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Immediate Actions</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Check database connection pool status</li>
                  <li>Review recent migrations for issues</li>
                  <li>Check for long-running queries</li>
                  <li>Verify RLS policies aren't causing recursion</li>
                  <li>Contact Lovable support if infrastructure issue</li>
                </ol>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Target Resolution: 1 hour</span>
              </div>
            </CardContent>
          </Card>

          {/* Data Breach */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Suspected Data Breach
                <Badge variant="destructive">Critical</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Symptoms</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Unauthorized access attempts in logs</li>
                  <li>Unusual data export activity</li>
                  <li>Reports of exposed customer data</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Immediate Actions (GDPR 72-hour requirement)</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li className="font-semibold text-destructive">Isolate affected systems immediately</li>
                  <li>Document timeline of events</li>
                  <li>Revoke all API keys and tokens</li>
                  <li>Force password reset for affected users</li>
                  <li>Notify ICO within 72 hours if personal data affected</li>
                  <li>Prepare user notification</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Post-Incident</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Complete root cause analysis</li>
                  <li>Update security measures</li>
                  <li>Document lessons learned</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* General Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Post-Incident Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "Incident documented with timeline",
                  "Root cause identified",
                  "Fix implemented and tested",
                  "Affected users notified",
                  "Monitoring alerts updated",
                  "Runbook updated with lessons learned",
                  "Post-mortem meeting scheduled"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" className="rounded" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default IncidentRunbook;
