/**
 * ComplianceTrendChart Component
 *
 * Line chart showing compliance score trends over time
 * Supports multiple frameworks with distinct colors
 * Green color scheme matching CSOAI brand
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

// Framework color palette - green-focused brand colors
const FRAMEWORK_COLORS: Record<string, string> = {
  'EU AI Act': '#10b981', // emerald-500
  'NIST AI RMF': '#059669', // emerald-600
  'ISO 42001': '#14b8a6', // teal-500
  'TC260': '#0d9488', // teal-600
  'Overall': '#22c55e', // green-500
};

// Default mock data - 12 months of compliance trend
const DEFAULT_DATA = [
  { month: 'Jan', 'EU AI Act': 45, 'NIST AI RMF': 52, 'ISO 42001': 38, 'TC260': 41, 'Overall': 44 },
  { month: 'Feb', 'EU AI Act': 48, 'NIST AI RMF': 55, 'ISO 42001': 42, 'TC260': 44, 'Overall': 47 },
  { month: 'Mar', 'EU AI Act': 52, 'NIST AI RMF': 58, 'ISO 42001': 48, 'TC260': 47, 'Overall': 51 },
  { month: 'Apr', 'EU AI Act': 55, 'NIST AI RMF': 62, 'ISO 42001': 52, 'TC260': 51, 'Overall': 55 },
  { month: 'May', 'EU AI Act': 58, 'NIST AI RMF': 68, 'ISO 42001': 55, 'TC260': 54, 'Overall': 59 },
  { month: 'Jun', 'EU AI Act': 62, 'NIST AI RMF': 72, 'ISO 42001': 58, 'TC260': 58, 'Overall': 63 },
  { month: 'Jul', 'EU AI Act': 65, 'NIST AI RMF': 75, 'ISO 42001': 62, 'TC260': 61, 'Overall': 66 },
  { month: 'Aug', 'EU AI Act': 68, 'NIST AI RMF': 78, 'ISO 42001': 65, 'TC260': 64, 'Overall': 69 },
  { month: 'Sep', 'EU AI Act': 70, 'NIST AI RMF': 80, 'ISO 42001': 68, 'TC260': 66, 'Overall': 71 },
  { month: 'Oct', 'EU AI Act': 72, 'NIST AI RMF': 82, 'ISO 42001': 71, 'TC260': 68, 'Overall': 73 },
  { month: 'Nov', 'EU AI Act': 74, 'NIST AI RMF': 84, 'ISO 42001': 73, 'TC260': 70, 'Overall': 75 },
  { month: 'Dec', 'EU AI Act': 78, 'NIST AI RMF': 85, 'ISO 42001': 76, 'TC260': 72, 'Overall': 78 },
];

export interface ComplianceTrendDataPoint {
  month: string;
  [framework: string]: string | number;
}

export interface ComplianceTrendChartProps {
  /** Array of data points with month and framework scores */
  data?: ComplianceTrendDataPoint[];
  /** Array of framework names to display (defaults to all available) */
  frameworks?: string[];
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Height of the chart in pixels */
  height?: number;
  /** Show card wrapper */
  showCard?: boolean;
  /** Custom class name */
  className?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
      <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function ComplianceTrendChart({
  data = DEFAULT_DATA,
  frameworks,
  title = 'Compliance Score Trend',
  description = 'Track compliance progress across multiple frameworks over time',
  height = 350,
  showCard = true,
  className = '',
}: ComplianceTrendChartProps) {
  // Determine which frameworks to show
  const activeFrameworks = useMemo(() => {
    if (frameworks && frameworks.length > 0) {
      return frameworks;
    }
    // Extract framework names from data (exclude 'month' key)
    if (data.length > 0) {
      return Object.keys(data[0]).filter(key => key !== 'month');
    }
    return Object.keys(FRAMEWORK_COLORS);
  }, [frameworks, data]);

  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          className="text-gray-600 dark:text-gray-400"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(value) => `${value}%`}
          className="text-gray-600 dark:text-gray-400"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
          iconSize={10}
        />
        {activeFrameworks.map((framework) => (
          <Line
            key={framework}
            type="monotone"
            dataKey={framework}
            stroke={FRAMEWORK_COLORS[framework] || '#10b981'}
            strokeWidth={2}
            dot={{ r: 4, fill: FRAMEWORK_COLORS[framework] || '#10b981' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
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

export default ComplianceTrendChart;
