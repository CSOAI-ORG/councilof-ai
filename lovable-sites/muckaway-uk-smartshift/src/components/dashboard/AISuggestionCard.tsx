import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Cloud, Route, Lightbulb, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface AISuggestion {
  id: string;
  type: "weather" | "route" | "demand" | "efficiency" | "tip";
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: "high" | "medium" | "low";
}

const SUGGESTION_POOL: AISuggestion[] = [
  {
    id: "weather-1",
    type: "weather",
    title: "Weather Alert",
    description: "Heavy rain forecast for tomorrow. Consider rescheduling outdoor excavation jobs at muddy sites to avoid access issues.",
    actionLabel: "View Schedule",
    actionUrl: "/dashboard",
    priority: "high",
  },
  {
    id: "route-1",
    type: "route",
    title: "Route Optimization",
    description: "Your most profitable route this week is the E17 corridor. Consider scheduling more jobs in this area.",
    actionLabel: "View Insights",
    actionUrl: "/ai-insights",
    priority: "medium",
  },
  {
    id: "demand-1",
    type: "demand",
    title: "Demand Forecast",
    description: "Chalk disposal demand is up 23% this month. Consider adjusting pricing to maximize revenue.",
    actionLabel: "View Analytics",
    actionUrl: "/ai-insights",
    priority: "medium",
  },
  {
    id: "efficiency-1",
    type: "efficiency",
    title: "Fleet Efficiency",
    description: "Truck 3 has 15% lower fuel efficiency than fleet average. Schedule maintenance check to improve performance.",
    actionLabel: "View Fleet",
    actionUrl: "/fleet",
    priority: "high",
  },
  {
    id: "tip-1",
    type: "tip",
    title: "Pro Tip",
    description: "Use voice commands to create quotes hands-free while on-site. Say 'Book muck away for tomorrow' to get started.",
    actionLabel: "Try Voice AI",
    actionUrl: "/ai-tools",
    priority: "low",
  },
  {
    id: "demand-2",
    type: "demand",
    title: "Seasonal Insight",
    description: "December typically sees 18% drop in bookings. Consider promotional pricing to maintain volume.",
    actionLabel: "View Pricing",
    actionUrl: "/subscribe",
    priority: "medium",
  },
];

export const AISuggestionCard = () => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuggestions = () => {
    // Randomly select 2-3 suggestions
    const shuffled = [...SUGGESTION_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.random() > 0.5 ? 3 : 2);
    // Sort by priority
    selected.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    setSuggestions(selected);
  };

  useEffect(() => {
    setTimeout(() => {
      loadSuggestions();
      setLoading(false);
    }, 800);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadSuggestions();
      setRefreshing(false);
    }, 500);
  };

  const getTypeIcon = (type: AISuggestion["type"]) => {
    switch (type) {
      case "weather":
        return <Cloud className="w-4 h-4 text-blue-500" />;
      case "route":
        return <Route className="w-4 h-4 text-green-500" />;
      case "demand":
        return <TrendingUp className="w-4 h-4 text-accent" />;
      case "efficiency":
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case "tip":
        return <Lightbulb className="w-4 h-4 text-primary" />;
      default:
        return <Brain className="w-4 h-4 text-primary" />;
    }
  };

  const getPriorityBadge = (priority: AISuggestion["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="text-xs">Tip</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 shadow-card animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            AI Suggestions
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Proactive insights to optimize your business</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(suggestion.type)}
                  <span className="font-medium text-sm">{suggestion.title}</span>
                </div>
                {getPriorityBadge(suggestion.priority)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {suggestion.description}
              </p>
              {suggestion.actionUrl && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={suggestion.actionUrl}>{suggestion.actionLabel}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
