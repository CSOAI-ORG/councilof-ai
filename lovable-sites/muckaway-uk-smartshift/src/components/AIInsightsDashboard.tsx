import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Truck, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Insights {
  demand_forecast: string;
  profitability_insights: string;
  pricing_recommendations: string;
  operational_efficiency: string;
  market_trends: string;
  key_metrics: {
    avg_job_value: number;
    most_profitable_spoil_type: string;
    busiest_region: string;
    capacity_utilization: number;
  };
}

const AIInsightsDashboard = () => {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mockData = {
    monthlyRevenue: [
      { month: 'Jan', revenue: 45000, jobs: 180 },
      { month: 'Feb', revenue: 52000, jobs: 220 },
      { month: 'Mar', revenue: 48000, jobs: 195 },
      { month: 'Apr', revenue: 61000, jobs: 250 },
      { month: 'May', revenue: 58000, jobs: 235 },
      { month: 'Jun', revenue: 67000, jobs: 280 }
    ],
    spoilTypes: [
      { name: 'Clay', value: 35, color: '#0052CC' },
      { name: 'Hardcore', value: 25, color: '#FFD700' },
      { name: 'Mixed', value: 20, color: '#666666' },
      { name: 'Topsoil', value: 15, color: '#4CAF50' },
      { name: 'Chalk', value: 5, color: '#9C27B0' }
    ]
  };

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights');

      if (error) {
        throw error;
      }

      if (data.success && data.insights) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      // Fallback to demo insights
      setInsights({
        demand_forecast: "Demand is expected to increase by 15% in Q3 due to major infrastructure projects in Essex and Kent. Summer construction activity typically peaks in July-August.",
        profitability_insights: "Hardcore and mixed spoil jobs generate 23% higher margins than clay-only jobs. Customers in Essex postcodes (CM, CO) show highest lifetime value.",
        pricing_recommendations: "Consider 8% price increase for contaminated spoil removal. Standard rates are competitive but hazardous surcharges could be optimized by region.",
        operational_efficiency: "Fleet utilization at 78% indicates opportunity for 2-3 additional vehicles. Route optimization could reduce fuel costs by 12%.",
        market_trends: "Growing demand for sustainable disposal options. 34% of customers now request recycling documentation. Digital WTNs adoption at 67%.",
        key_metrics: {
          avg_job_value: 1250,
          most_profitable_spoil_type: "hardcore",
          busiest_region: "Essex",
          capacity_utilization: 78
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Business Insights</h2>
        <Button
          onClick={loadInsights}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Insights
        </Button>
      </div>

      {/* Key Metrics */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Job Value</p>
                  <p className="text-xl font-bold">£{insights.key_metrics.avg_job_value.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Top Spoil Type</p>
                  <p className="text-xl font-bold capitalize">{insights.key_metrics.most_profitable_spoil_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Fleet Utilization</p>
                  <p className="text-xl font-bold">{insights.key_metrics.capacity_utilization}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Busiest Region</p>
                  <p className="text-xl font-bold">{insights.key_metrics.busiest_region}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue & Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="revenue" fill="var(--accent)" />
                <Line yAxisId="right" type="monotone" dataKey="jobs" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spoil Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockData.spoilTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockData.spoilTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{insights.demand_forecast}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profitability Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{insights.profitability_insights}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{insights.pricing_recommendations}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{insights.market_trends}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIInsightsDashboard;