/**
 * Chart Components Index
 *
 * Export all chart components for easy importing
 * All charts use Recharts and follow CSOAI brand guidelines
 */

// Compliance Trend Chart - Multi-line chart for framework compliance over time
export {
  ComplianceTrendChart,
  type ComplianceTrendChartProps,
  type ComplianceTrendDataPoint,
} from './ComplianceTrendChart';

// Framework Comparison Chart - Bar and Radar charts for comparing frameworks
export {
  FrameworkComparisonChart,
  type FrameworkComparisonChartProps,
  type FrameworkData,
} from './FrameworkComparisonChart';

// Incident Trend Chart - Area chart for incident tracking with resolution rates
export {
  IncidentTrendChart,
  type IncidentTrendChartProps,
  type IncidentDataPoint,
  type IncidentCategory,
} from './IncidentTrendChart';

// Prosperity Fund Chart - Fund growth projections and contribution breakdown
export {
  ProsperityFundChart,
  type ProsperityFundChartProps,
  type FundProjectionDataPoint,
  type UBIThreshold,
  type ContributionSource,
} from './ProsperityFundChart';
