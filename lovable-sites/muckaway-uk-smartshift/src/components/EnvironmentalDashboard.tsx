import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, Recycle, Factory, TrendingUp, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface JobMetrics {
  material_type: string;
  volume_tonnes: number;
  disposal_method: string | null;
  completed_date: string | null;
}

interface AggregatedMetrics {
  totalTonnage: number;
  recycledTonnage: number;
  landfillTonnage: number;
  co2Saved: number;
  recyclingRate: number;
  monthlyData: { month: string; recycled: number; landfill: number }[];
  byMaterial: { name: string; value: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

// CO2 savings per tonne recycled (kg CO2e)
const CO2_FACTORS: Record<string, number> = {
  'topsoil': 50,
  'clay': 30,
  'sand': 25,
  'gravel': 20,
  'concrete': 150,
  'mixed': 80,
  'contaminated': 200,
  'default': 60
};

export function EnvironmentalDashboard() {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'3m' | '6m' | '12m'>('6m');
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const monthsBack = dateRange === '3m' ? 3 : dateRange === '6m' ? 6 : 12;
    const startDate = startOfMonth(subMonths(new Date(), monthsBack - 1));

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('material_type, volume_tonnes, disposal_method, completed_date')
      .gte('completed_date', startDate.toISOString())
      .not('completed_date', 'is', null);

    if (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
      return;
    }

    // Calculate metrics
    const aggregated = calculateMetrics(jobs || [], monthsBack);
    setMetrics(aggregated);
    setLoading(false);
  };

  const calculateMetrics = (jobs: JobMetrics[], monthsBack: number): AggregatedMetrics => {
    let totalTonnage = 0;
    let recycledTonnage = 0;
    let landfillTonnage = 0;
    let co2Saved = 0;

    const byMaterialMap = new Map<string, number>();
    const monthlyMap = new Map<string, { recycled: number; landfill: number }>();

    // Initialize monthly data
    for (let i = 0; i < monthsBack; i++) {
      const month = format(subMonths(new Date(), monthsBack - 1 - i), 'MMM yyyy');
      monthlyMap.set(month, { recycled: 0, landfill: 0 });
    }

    jobs.forEach(job => {
      const tonnes = job.volume_tonnes || 0;
      totalTonnage += tonnes;

      // Track by material
      const material = job.material_type || 'unknown';
      byMaterialMap.set(material, (byMaterialMap.get(material) || 0) + tonnes);

      // Track recycled vs landfill
      const isRecycled = job.disposal_method?.toLowerCase().includes('recycl') || 
                         job.disposal_method?.toLowerCase().includes('reuse');
      
      if (isRecycled) {
        recycledTonnage += tonnes;
        const co2Factor = CO2_FACTORS[material.toLowerCase()] || CO2_FACTORS.default;
        co2Saved += tonnes * co2Factor;
      } else {
        landfillTonnage += tonnes;
      }

      // Track monthly
      if (job.completed_date) {
        const month = format(new Date(job.completed_date), 'MMM yyyy');
        const existing = monthlyMap.get(month);
        if (existing) {
          if (isRecycled) {
            existing.recycled += tonnes;
          } else {
            existing.landfill += tonnes;
          }
        }
      }
    });

    const recyclingRate = totalTonnage > 0 ? (recycledTonnage / totalTonnage) * 100 : 0;

    return {
      totalTonnage,
      recycledTonnage,
      landfillTonnage,
      co2Saved,
      recyclingRate,
      monthlyData: Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        recycled: Math.round(data.recycled * 100) / 100,
        landfill: Math.round(data.landfill * 100) / 100
      })),
      byMaterial: Array.from(byMaterialMap.entries())
        .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    };
  };

  const handleExport = () => {
    if (!metrics) return;
    
    const report = {
      generatedAt: new Date().toISOString(),
      period: dateRange,
      summary: {
        totalTonnage: metrics.totalTonnage,
        recycledTonnage: metrics.recycledTonnage,
        landfillTonnage: metrics.landfillTonnage,
        recyclingRate: metrics.recyclingRate,
        co2SavedKg: metrics.co2Saved
      },
      monthlyBreakdown: metrics.monthlyData,
      byMaterial: metrics.byMaterial
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sustainability-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    
    toast({ title: 'Report Downloaded', description: 'Sustainability report exported successfully' });
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading environmental data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Period:</span>
          <div className="flex gap-1">
            {(['3m', '6m', '12m'] as const).map(range => (
              <Button
                key={range}
                size="sm"
                variant={dateRange === range ? 'default' : 'outline'}
                onClick={() => setDateRange(range)}
              >
                {range === '3m' ? '3 Months' : range === '6m' ? '6 Months' : '12 Months'}
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-1" /> Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Factory className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Processed</p>
                <p className="text-2xl font-bold">{metrics?.totalTonnage.toFixed(1)} t</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Recycle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recycled</p>
                <p className="text-2xl font-bold">{metrics?.recycledTonnage.toFixed(1)} t</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Leaf className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                <p className="text-2xl font-bold">{((metrics?.co2Saved || 0) / 1000).toFixed(1)} t</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recycling Rate</p>
                <p className="text-2xl font-bold">{metrics?.recyclingRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Waste Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="recycled" stackId="a" fill="#22c55e" name="Recycled (t)" />
                  <Bar dataKey="landfill" stackId="a" fill="#ef4444" name="Landfill (t)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waste by Material Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.byMaterial || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics?.byMaterial.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" />
            Environmental Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{((metrics?.co2Saved || 0) / 1000).toFixed(1)}t</p>
              <p className="text-sm text-muted-foreground">CO₂ Emissions Avoided</p>
              <p className="text-xs text-muted-foreground mt-1">
                Equivalent to {Math.round((metrics?.co2Saved || 0) / 4600)} return flights London-NYC
              </p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-primary">{metrics?.recyclingRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Waste Diverted from Landfill</p>
              <Badge variant={metrics?.recyclingRate && metrics.recyclingRate > 70 ? 'default' : 'secondary'} className="mt-1">
                {metrics?.recyclingRate && metrics.recyclingRate > 70 ? 'Excellent' : 'Can Improve'}
              </Badge>
            </div>
            <div className="text-center p-4 bg-secondary/10 rounded-lg">
              <p className="text-3xl font-bold">{Math.round((metrics?.recycledTonnage || 0) * 0.85)}</p>
              <p className="text-sm text-muted-foreground">Cubic Metres of Landfill Saved</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on average material density
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
