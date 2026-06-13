/*
 * COAI Risk Assessment Page
 * Multi-framework risk assessment wizard
 */

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const assessmentTypes = [
  {
    title: "EU AI Act Assessment",
    description: "Comprehensive risk classification per Regulation 2024/1689",
    icon: FileText,
    articles: "113 articles",
    time: "~45 min",
  },
  {
    title: "NIST AI RMF Assessment",
    description: "Four-function framework: GOVERN, MAP, MEASURE, MANAGE",
    icon: FileText,
    articles: "7 characteristics",
    time: "~30 min",
  },
  {
    title: "TC260 Assessment",
    description: "China AI Safety Governance Framework 2.0 compliance",
    icon: FileText,
    articles: "14 measures",
    time: "~35 min",
  },
  {
    title: "Multi-Framework Assessment",
    description: "Combined assessment across all supported frameworks",
    icon: AlertTriangle,
    articles: "All frameworks",
    time: "~90 min",
  },
];

export default function RiskAssessment() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold font-primary">Risk Assessment</h1>
          <p className="text-muted-foreground text-sm">
            Evaluate your AI systems against global safety frameworks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessmentTypes.map((type, idx) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Card className="bg-card border-border hover:bg-accent/30 transition-colors cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{type.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {type.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>{type.articles}</span>
                          <span>•</span>
                          <span>{type.time}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toast.info("Feature coming soon")}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
