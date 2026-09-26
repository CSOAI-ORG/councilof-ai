/**
 * IncidentTrendChart Component
 *
 * Area chart showing incident reports over time
 * Categories breakdown with stacked areas
 * Resolution rate overlay line
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

// Incident categories
export type IncidentCategory =
  | 'safety'
  | 'bias'
  | 'privacy'
  | 'security'
  | 'transparency'
  | 'other';

export interface IncidentDataPoint {
  month: string;
  safety: number;
  bias: number;
  privacy: number;
  security: number;
  transparency: number;
  other: number;
  total: number;
  resolved: number;
  resolutionRate: number;
}

// Category colors matching incident severity
const CATEGORY_COLORS: Record<IncidentCategory, { fill: string; stroke: string }> = {
  safety: { fill: '#fef2f2', stroke: '#ef4444' }, // red
  bias: { fill: '#fff7ed', stroke: '#f97316' }, // orange
  privacy: { fill: '#fefce8', stroke: '#eab308' }, // yellow
  security: { fill: '#ecfdf5', stroke: '#10b981' }, // emerald
  transparency: { fill: '#eff6ff', stroke: '#3b82f6' }, // blue
  other: { fill: '#f3f4f6', stroke: '#6b7280' }, // gray
};

// 2026-09-26: the mock default series (invented monthly scores) was removed. A chart with
// no data renders empty; callers pass measured data or do not render the chart.
const DEFAULT_DATA: IncidentDataPoint[] = [];

export interface IncidentTrendChartProps {
  /** Incident data over time */
  data?: IncidentDataPoint[];
  /** Categories to display */
  categories?: IncidentCategory[];
  /** Show resolution rate overlay */
  showResolutionRate?: boolean;
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Show card wrapper */
  showCard?: boolean;
  /** Custom class name */
  className?: string;
}

// Category display names
const CATEGORY_NAMES: Record<IncidentCategory, string> = {
  safety: 'Safety Issues',
  bias: 'Bias/Fairness',
  privacy: 'Privacy Violations',
  security: 'Security Incidents',
  transparency: 'Transparency',
  other: 'Other',
};

// Custom tooltip
const CustomTooltip = ({
  active,
  payload,
  label,
  showResolutionRate
}: TooltipProps<number, string> & { showResolutionRate?: boolean }) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0].payload as IncidentDataPoint;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[220px]">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
        <Badge variant="outline" className="text-xs">
          {dataPoint.total} total
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        {payload
          .filter(p => p.dataKey !== 'resolutionRate')
          .map((entry, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry.stroke || entry.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {CATEGORY_NAMES[entry.dataKey as IncidentCategory] || entry.name}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {entry.value}
              </span>
            </div>
          ))}
      </div>

      {showResolutionRate && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Resolution Rate</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">
              {dataPoint.resolutionRate}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {dataPoint.resolved} of {dataPoint.total} resolved
          </p>
        </div>
      )}
    </div>
  );
};

export function IncidentTrendChart({
  data = DEFAULT_DATA,
  categories = ['safety', 'bias', 'privacy', 'security', 'transparency', 'other'],
  showResolutionRate = true,
  title = 'Incident Trends',
  description = 'Track incident reports and resolution rates over time',
  height = 400,
  showCard = true,
  className = '',
}: IncidentTrendChartProps) {
  // Calculate summary stats
  const stats = useMemo(() => {
    if (!data.length) return { total: 0, resolved: 0, rate: 0 };
    const total = data.reduce((sum, d) => sum + d.total, 0);
    const resolved = data.reduce((sum, d) => sum + d.resolved, 0);
    return {
      total,
      resolved,
      rate: Math.round((resolved / total) * 100),
    };
  }, [data]);

  const chartContent = (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">{stats.total} Total Incidents</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {stats.rate}% Resolution Rate
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Incidents', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          {showResolutionRate && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${value}%`}
              label={{ value: 'Resolution %', angle: 90, position: 'insideRight', fontSize: 12 }}
            />
          )}
          <Tooltip content={<CustomTooltip showResolutionRate={showResolutionRate} />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            formatter={(value) => CATEGORY_NAMES[value as IncidentCategory] || value}
          />

          {/* Stacked area charts for each category */}
          {categories.map((category) => (
            <Area
              key={category}
              yAxisId="left"
              type="monotone"
              dataKey={category}
              stackId="1"
              stroke={CATEGORY_COLORS[category].stroke}
              fill={CATEGORY_COLORS[category].fill}
              strokeWidth={1.5}
              name={category}
            />
          ))}

          {/* Resolution rate overlay line */}
          {showResolutionRate && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="resolutionRate"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981' }}
              activeDot={{ r: 6, fill: '#059669' }}
              name="Resolution Rate"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Category legend with counts */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => {
          const total = data.reduce((sum, d) => sum + d[category], 0);
          return (
            <Badge
              key={category}
              variant="outline"
              className="flex items-center gap-1.5"
              style={{ borderColor: CATEGORY_COLORS[category].stroke }}
            >
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS[category].stroke }}
              />
              {CATEGORY_NAMES[category]}: {total}
            </Badge>
          );
        })}
      </div>
    </div>
  );

  if (!showCard) {
    return <div className={className}>{chartContent}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
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

export default IncidentTrendChart;
