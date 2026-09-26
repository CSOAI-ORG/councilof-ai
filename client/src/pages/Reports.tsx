/*
 * CSOAI Reports Page
 * Generated compliance reports and documentation
 */

import { motion } from "framer-motion";
import { FileText, Download, Calendar, Filter, Search, Eye, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

// No fabricated report list — reports render here once generated for real.


const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    Compliance: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    Assessment: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    Risk: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    Council: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    Incident: "bg-red-500/10 text-red-500 border-red-500/30",
  };
  return colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/30";
};

// 2026-09-26: the "Example data" sample PDF was removed. It printed invented per-system
// compliance scores (85/72/91/78/95) and framework percentages under a CSOAI header. No
// measurement produced them, and CSOAI does not score compliance.

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-primary">Reports</h1>
            <p className="text-muted-foreground text-sm">
              Generated compliance reports and documentation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reports..." className="pl-9" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>

        {/* Reports List — honest empty state until real reports exist */}
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="font-semibold">No reports generated yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reports you generate appear here. We don&apos;t list example reports as if
              you made them.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
