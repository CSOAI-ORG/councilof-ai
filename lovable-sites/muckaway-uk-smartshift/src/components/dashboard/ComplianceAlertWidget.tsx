import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, FileWarning, Shield } from "lucide-react";
import { Link } from "react-router-dom";

interface ComplianceItem {
  id: string;
  name: string;
  type: "license" | "certificate" | "policy" | "document";
  status: "valid" | "expiring" | "expired";
  expiryDate?: string;
  daysRemaining?: number;
}

export const ComplianceAlertWidget = () => {
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading compliance data - in production, fetch from Supabase
    const mockData: ComplianceItem[] = [
      {
        id: "1",
        name: "Waste Carrier License",
        type: "license",
        status: "valid",
        expiryDate: "2025-08-15",
        daysRemaining: 250,
      },
      {
        id: "2",
        name: "Environmental Permit",
        type: "certificate",
        status: "expiring",
        expiryDate: "2025-01-20",
        daysRemaining: 42,
      },
      {
        id: "3",
        name: "Vehicle MOT - Truck 1",
        type: "certificate",
        status: "valid",
        expiryDate: "2025-06-10",
        daysRemaining: 184,
      },
      {
        id: "4",
        name: "Public Liability Insurance",
        type: "policy",
        status: "valid",
        expiryDate: "2025-04-30",
        daysRemaining: 143,
      },
    ];

    setTimeout(() => {
      setComplianceItems(mockData);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusBadge = (status: ComplianceItem["status"], daysRemaining?: number) => {
    switch (status) {
      case "expired":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Expired
          </Badge>
        );
      case "expiring":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysRemaining}d left
          </Badge>
        );
      case "valid":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Valid
          </Badge>
        );
    }
  };

  const getTypeIcon = (type: ComplianceItem["type"]) => {
    switch (type) {
      case "license":
        return <Shield className="w-4 h-4 text-primary" />;
      case "certificate":
        return <FileWarning className="w-4 h-4 text-accent" />;
      case "policy":
        return <Shield className="w-4 h-4 text-primary" />;
      default:
        return <FileWarning className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const expiringCount = complianceItems.filter((item) => item.status === "expiring" || item.status === "expired").length;
  const allValid = expiringCount === 0;

  if (loading) {
    return (
      <Card className="bg-card border-border shadow-card animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border shadow-card transition-all duration-300 ${
        allValid ? "bg-card border-border" : "bg-amber-500/5 border-amber-500/20"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className={`h-5 w-5 ${allValid ? "text-green-600" : "text-amber-600"}`} />
            Compliance Status
          </CardTitle>
          {!allValid && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              {expiringCount} Action{expiringCount > 1 ? "s" : ""} Needed
            </Badge>
          )}
        </div>
        <CardDescription>
          {allValid ? "All documents are current and compliant" : "Some items require attention"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {complianceItems.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                item.status === "expiring" || item.status === "expired"
                  ? "bg-amber-500/5"
                  : "bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {getTypeIcon(item.type)}
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.expiryDate && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(item.expiryDate).toLocaleDateString("en-GB")}
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(item.status, item.daysRemaining)}
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full mt-4" asChild>
          <Link to="/hazardous">View All Documents</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
