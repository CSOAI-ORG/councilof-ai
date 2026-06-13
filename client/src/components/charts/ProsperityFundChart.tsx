/**
 * ProsperityFundChart Component
 *
 * Fund growth projection chart with UBI trigger thresholds
 * Contribution breakdown pie chart
 * Reference lines for key milestones
 */

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  TooltipProps,
  Area,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, PieChart as PieIcon, DollarSign, Target } from 'lucide-react';

// Fund projection data point
export interface FundProjectionDataPoint {
  year: number;
  projected: number;
  conservative: number;
  optimistic: number;
  actual?: number;
}

// UBI threshold data
export interface UBIThreshold {
  name: string;
  unemploymentRate: number;
  monthlyAmount: number;
  fundRequired: number; // in billions
  color: string;
}

// Contribution source data
export interface ContributionSource {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

// Default fund projection data (values in billions USD)
const DEFAULT_PROJECTION_DATA: FundProjectionDataPoint[] = [
  { year: 2024, projected: 0.001, conservative: 0.0008, optimistic: 0.002, actual: 0.00085 },
  { year: 2025, projected: 0.01, conservative: 0.005, optimistic: 0.02, actual: undefined },
  { year: 2026, projected: 0.1, conservative: 0.05, optimistic: 0.3 },
  { year: 2027, projected: 1, conservative: 0.5, optimistic: 2 },
  { year: 2028, projected: 5, conservative: 2, optimistic: 10 },
  { year: 2029, projected: 15, conservative: 8, optimistic: 30 },
  { year: 2030, projected: 50, conservative: 25, optimistic: 100 },
  { year: 2031, projected: 100, conservative: 50, optimistic: 200 },
  { year: 2032, projected: 200, conservative: 100, optimistic: 400 },
  { year: 2033, projected: 350, conservative: 175, optimistic: 600 },
  { year: 2034, projected: 500, conservative: 250, optimistic: 850 },
  { year: 2035, projected: 750, conservative: 400, optimistic: 1200 },
];

// Default UBI thresholds
const DEFAULT_UBI_THRESHOLDS: UBIThreshold[] = [
  { name: 'Tier 1', unemploymentRate: 20, monthlyAmount: 500, fundRequired: 50, color: '#22c55e' },
  { name: 'Tier 2', unemploymentRate: 40, monthlyAmount: 1500, fundRequired: 200, color: '#eab308' },
  { name: 'Tier 3', unemploymentRate: 70, monthlyAmount: 3000, fundRequired: 500, color: '#f97316' },
];

// Default contribution sources
const DEFAULT_CONTRIBUTION_SOURCES: ContributionSource[] = [
  { name: 'Giant Corps (>$10B)', value: 45, percentage: 45, color: '#10b981' },
  { name: 'Large Corps ($1B-$10B)', value: 25, percentage: 25, color: '#14b8a6' },
  { name: 'Established ($100M-$1B)', value: 15, percentage: 15, color: '#22c55e' },
  { name: 'Growth ($10M-$100M)', value: 10, percentage: 10, color: '#34d399' },
  { name: 'Startups (<$10M)', value: 3, percentage: 3, color: '#6ee7b7' },
  { name: 'CSOAI Contribution', value: 2, percentage: 2, color: '#0d9488' },
];

export interface ProsperityFundChartProps {
  /** Fund projection data */
  projectionData?: FundProjectionDataPoint[];
  /** UBI trigger thresholds */
  ubiThresholds?: UBIThreshold[];
  /** Contribution sources */
  contributionSources?: ContributionSource[];
  /** Current fund size in dollars */
  currentFundSize?: number;
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Initial tab */
  defaultTab?: 'projection' | 'contributions';
  /** Show card wrapper */
  showCard?: boolean;
  /** Custom class name */
  className?: string;
}

// Format large numbers
const formatBillions = (value: number): string => {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}T`;
  if (value >= 1) return `$${value.toFixed(0)}B`;
  if (value >= 0.001) return `$${(value * 1000).toFixed(0)}M`;
  return `$${(value * 1000000).toFixed(0)}K`;
};

// Custom tooltip for projection chart
const ProjectionTooltip = ({ active, payload, label, thresholds }: TooltipProps<number, string> & { thresholds: UBIThreshold[] }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as FundProjectionDataPoint;
  const activeThresholds = thresholds.filter(t => data.projected >= t.fundRequired);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[250px]">
      <p className="font-semibold text-gray-900 dark:text-white mb-3">Year {label}</p>

      <div className="space-y-2 mb-3">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatBillions(entry.value as number)}
            </span>
          </div>
        ))}
      </div>

      {activeThresholds.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Active UBI Tiers:</p>
          {activeThresholds.map((threshold) => (
            <Badge
              key={threshold.name}
              variant="outline"
              className="mr-1 mb-1"
              style={{ borderColor: threshold.color, color: threshold.color }}
            >
              {threshold.name}: ${threshold.monthlyAmount}/mo
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom tooltip for pie chart
const ContributionTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as ContributionSource;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
      <p className="text-emerald-600 text-lg font-bold">{data.percentage}%</p>
      <p className="text-xs text-gray-500">of total contributions</p>
    </div>
  );
};

// Custom label for pie chart
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ProsperityFundChart({
  projectionData = DEFAULT_PROJECTION_DATA,
  ubiThresholds = DEFAULT_UBI_THRESHOLDS,
  contributionSources = DEFAULT_CONTRIBUTION_SOURCES,
  currentFundSize = 847293,
  title = 'AI Prosperity Fund',
  description = 'Fund growth projections and contribution breakdown',
  height = 400,
  defaultTab = 'projection',
  showCard = true,
  className = '',
}: ProsperityFundChartProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Calculate next milestone
  const nextMilestone = useMemo(() => {
    const currentInBillions = currentFundSize / 1_000_000_000;
    return ubiThresholds.find(t => currentInBillions < t.fundRequired) || ubiThresholds[ubiThresholds.length - 1];
  }, [currentFundSize, ubiThresholds]);

  const projectionChart = (
    <div className="space-y-4">
      {/* Current fund status */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            Current: {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(currentFundSize)}
          </span>
        </div>
        {nextMilestone && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Target className="h-5 w-5 text-gray-500" />
            <span className="text-sm">
              Next UBI Tier: {formatBillions(nextMilestone.fundRequired)} ({nextMilestone.name})
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={projectionData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            scale="log"
            domain={[0.0001, 2000]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={formatBillions}
          />
          <Tooltip content={<ProjectionTooltip thresholds={ubiThresholds} />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />

          {/* UBI threshold reference lines */}
          {ubiThresholds.map((threshold) => (
            <ReferenceLine
              key={threshold.name}
              y={threshold.fundRequired}
              stroke={threshold.color}
              strokeDasharray="5 5"
              label={{
                value: `${threshold.name}: ${formatBillions(threshold.fundRequired)}`,
                position: 'right',
                fontSize: 10,
                fill: threshold.color,
              }}
            />
          ))}

          {/* Confidence interval area */}
          <Area
            type="monotone"
            dataKey="optimistic"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.1}
            name="Optimistic"
          />

          {/* Main projection lines */}
          <Line
            type="monotone"
            dataKey="conservative"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Conservative"
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981' }}
            activeDot={{ r: 6, fill: '#059669' }}
            name="Projected"
          />
          <Line
            type="monotone"
            dataKey="optimistic"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            name="Optimistic"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#0d9488"
            strokeWidth={3}
            dot={{ r: 5, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
            name="Actual"
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* UBI threshold legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {ubiThresholds.map((threshold) => (
          <Badge
            key={threshold.name}
            variant="outline"
            className="flex items-center gap-2"
            style={{ borderColor: threshold.color }}
          >
            <div
              className="w-3 h-0.5"
              style={{ backgroundColor: threshold.color }}
            />
            <span>{threshold.name}:</span>
            <span className="font-bold">${threshold.monthlyAmount}/mo</span>
            <span className="text-gray-500">@ {threshold.unemploymentRate}% unemployment</span>
          </Badge>
        ))}
      </div>
    </div>
  );

  const contributionChart = (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={contributionSources}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={150}
            innerRadius={60}
            dataKey="value"
            stroke="white"
            strokeWidth={2}
          >
            {contributionSources.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ContributionTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Contribution breakdown legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {contributionSources.map((source) => (
          <div
            key={source.name}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: source.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{source.name}</p>
              <p className="text-sm font-bold text-emerald-600">{source.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const chartContent = (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="projection" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Fund Projection
        </TabsTrigger>
        <TabsTrigger value="contributions" className="flex items-center gap-2">
          <PieIcon className="h-4 w-4" />
          Contributions
        </TabsTrigger>
      </TabsList>
      <TabsContent value="projection">
        {projectionChart}
      </TabsContent>
      <TabsContent value="contributions">
        {contributionChart}
      </TabsContent>
    </Tabs>
  );

  if (!showCard) {
    return <div className={className}>{chartContent}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartContent}
      </CardContent>
    </Card>
  );
}

export default ProsperityFundChart;
