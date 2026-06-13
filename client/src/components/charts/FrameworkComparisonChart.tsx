/**
 * FrameworkComparisonChart Component
 *
 * Bar chart and Radar chart comparing compliance across multiple frameworks
 * EU AI Act, NIST AI RMF, ISO 42001, TC260
 * Interactive legend and hover states
 */

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Target } from 'lucide-react';

// Framework data structure
export interface FrameworkData {
  name: string;
  shortName?: string;
  score: number;
  maxScore?: number;
  requirements?: number;
  compliant?: number;
  status?: 'compliant' | 'in_progress' | 'not_started';
}

// Default mock data
const DEFAULT_DATA: FrameworkData[] = [
  { name: 'EU AI Act', shortName: 'EU AI', score: 72, maxScore: 100, requirements: 113, compliant: 81, status: 'in_progress' },
  { name: 'NIST AI RMF', shortName: 'NIST', score: 85, maxScore: 100, requirements: 72, compliant: 61, status: 'compliant' },
  { name: 'ISO 42001', shortName: 'ISO', score: 68, maxScore: 100, requirements: 89, compliant: 60, status: 'in_progress' },
  { name: 'TC260', shortName: 'TC260', score: 64, maxScore: 100, requirements: 56, compliant: 36, status: 'in_progress' },
];

// Color palette
const COLORS = {
  'EU AI Act': { main: '#10b981', light: '#d1fae5', dark: '#059669' },
  'NIST AI RMF': { main: '#14b8a6', light: '#ccfbf1', dark: '#0d9488' },
  'ISO 42001': { main: '#22c55e', light: '#dcfce7', dark: '#16a34a' },
  'TC260': { main: '#0ea5e9', light: '#e0f2fe', dark: '#0284c7' },
};

const getColor = (name: string) => {
  return COLORS[name as keyof typeof COLORS]?.main || '#10b981';
};

const getLightColor = (name: string) => {
  return COLORS[name as keyof typeof COLORS]?.light || '#d1fae5';
};

export interface FrameworkComparisonChartProps {
  /** Framework comparison data */
  data?: FrameworkData[];
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Initial chart type */
  defaultChartType?: 'bar' | 'radar';
  /** Allow switching between chart types */
  allowTypeSwitch?: boolean;
  /** Show card wrapper */
  showCard?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when a framework is clicked */
  onFrameworkClick?: (framework: FrameworkData) => void;
}

// Custom bar chart tooltip
const BarTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload as FrameworkData;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
        <Badge
          variant={data.status === 'compliant' ? 'default' : data.status === 'in_progress' ? 'secondary' : 'outline'}
          className={data.status === 'compliant' ? 'bg-emerald-100 text-emerald-700' : ''}
        >
          {data.status === 'compliant' ? 'Compliant' : data.status === 'in_progress' ? 'In Progress' : 'Not Started'}
        </Badge>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Compliance Score</span>
          <span className="font-medium text-gray-900 dark:text-white">{data.score}%</span>
        </div>
        {data.requirements && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Requirements</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {data.compliant}/{data.requirements}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom radar chart tooltip
const RadarTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-gray-900 dark:text-white">{payload[0].payload.name}</p>
      <p className="text-emerald-600 font-medium">{payload[0].value}% Compliant</p>
    </div>
  );
};

export function FrameworkComparisonChart({
  data = DEFAULT_DATA,
  title = 'Framework Compliance Comparison',
  description = 'Compare your compliance status across regulatory frameworks',
  height = 350,
  defaultChartType = 'bar',
  allowTypeSwitch = true,
  showCard = true,
  className = '',
  onFrameworkClick,
}: FrameworkComparisonChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'radar'>(defaultChartType);
  const [hoveredFramework, setHoveredFramework] = useState<string | null>(null);

  // Prepare radar data format
  const radarData = useMemo(() => {
    return data.map(item => ({
      name: item.shortName || item.name,
      fullName: item.name,
      score: item.score,
      fullMark: 100,
    }));
  }, [data]);

  const handleBarClick = (framework: FrameworkData) => {
    if (onFrameworkClick) {
      onFrameworkClick(framework);
    }
  };

  const barChart = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        onMouseLeave={() => setHoveredFramework(null)}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="shortName"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
        <Legend />
        <Bar
          dataKey="score"
          name="Compliance Score"
          radius={[4, 4, 0, 0]}
          onMouseEnter={(data) => setHoveredFramework(data.name)}
          onClick={(data) => handleBarClick(data)}
          cursor="pointer"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={hoveredFramework === entry.name ? getColor(entry.name) : getLightColor(entry.name)}
              stroke={getColor(entry.name)}
              strokeWidth={2}
              style={{
                filter: hoveredFramework === entry.name ? 'brightness(1.1)' : 'none',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const radarChart = (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
        <PolarGrid className="stroke-gray-200 dark:stroke-gray-700" />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#6b7280' }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<RadarTooltip />} />
        <Radar
          name="Compliance Score"
          dataKey="score"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.4}
          strokeWidth={2}
          dot={{ r: 4, fill: '#10b981' }}
          activeDot={{ r: 6, fill: '#059669' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );

  const chartContent = (
    <div className="space-y-4">
      {allowTypeSwitch && (
        <div className="flex justify-end gap-2">
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
            className={chartType === 'bar' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Bar
          </Button>
          <Button
            variant={chartType === 'radar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('radar')}
            className={chartType === 'radar' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <Target className="h-4 w-4 mr-1" />
            Radar
          </Button>
        </div>
      )}
      {chartType === 'bar' ? barChart : radarChart}
    </div>
  );

  if (!showCard) {
    return <div className={className}>{chartContent}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-600" />
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

export default FrameworkComparisonChart;
