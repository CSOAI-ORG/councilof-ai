import { useState } from 'react';
import { Link } from 'wouter';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Building2,
  ArrowRight,
  CheckCircle,
  BarChart2
} from 'lucide-react';

interface ROIData {
  aiSystems: number;
  employees: number;
  industry: string;
  complianceSpend: number;
  frameworks: number;
}

export default function ROICalculator() {
  const [data, setData] = useState<ROIData>({
    aiSystems: 25,
    employees: 200,
    industry: 'Technology',
    complianceSpend: 500000,
    frameworks: 3
  });

  // Calculate ROI metrics
  const annualSavings = Math.round(data.complianceSpend * 0.35);
  const riskReduction = 67;
  const implementationCost = data.employees > 500 ? 150000 : data.employees > 100 ? 75000 : 35000;
  const threeYearROI = ((annualSavings * 3) / implementationCost) * 100;

  const handleInputChange = (field: keyof ROIData, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const benefits = [
    {
      icon: <Shield className="w-8 h-8 text-blue-400" />,
      title: "Automated Compliance Monitoring",
      description: "24/7 monitoring of AI systems against regulatory requirements"
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-blue-400" />,
      title: "Multi-Framework Coverage",
      description: "Support for all major regulatory frameworks in one platform"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-400" />,
      title: "Real-Time Risk Scoring",
      description: "Continuous assessment and scoring of AI governance risks"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "33-Agent Byzantine Council",
      description: "Diverse expert agents ensuring robust governance decisions"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-blue-400" />,
      title: "Certification & Training Included",
      description: "Built-in training programs and certification pathways"
    },
    {
      icon: <Building2 className="w-8 h-8 text-blue-400" />,
      title: "Dedicated Advisory Support",
      description: "Expert advisory team for your AI governance needs"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold">CSOAI ROI Calculator</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl">
            Discover how much your organization can save with CSOAI's AI governance platform.
            Use our interactive calculator to estimate your financial impact and ROI.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Input Section */}
          <div className="space-y-8">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-blue-400" />
                Calculate Your ROI
              </h2>

              {/* Number of AI Systems */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">Number of AI Systems</label>
                  <span className="text-lg font-semibold text-blue-400">{data.aiSystems}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={data.aiSystems}
                  onChange={(e) => handleInputChange('aiSystems', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>1</span>
                  <span>500</span>
                </div>
              </div>

              {/* Number of Employees */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">Employees Using AI</label>
                  <span className="text-lg font-semibold text-blue-400">{data.employees.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="10000"
                  value={data.employees}
                  onChange={(e) => handleInputChange('employees', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>10</span>
                  <span>10,000</span>
                </div>
              </div>

              {/* Industry Dropdown */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-300 mb-3">Industry</label>
                <select
                  value={data.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option>Financial Services</option>
                  <option>Healthcare</option>
                  <option>Technology</option>
                  <option>Manufacturing</option>
                  <option>Government</option>
                  <option>Retail</option>
                  <option>Energy</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Current Compliance Spend */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">Annual Compliance Spend</label>
                  <span className="text-lg font-semibold text-blue-400">{formatCurrency(data.complianceSpend)}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="10000000"
                  step="50000"
                  value={data.complianceSpend}
                  onChange={(e) => handleInputChange('complianceSpend', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>$50K</span>
                  <span>$10M</span>
                </div>
              </div>

              {/* Number of Frameworks */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">Regulatory Frameworks</label>
                  <span className="text-lg font-semibold text-blue-400">{data.frameworks}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={data.frameworks}
                  onChange={(e) => handleInputChange('frameworks', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                Your ROI Impact
              </h2>

              {/* Annual Cost Savings Card */}
              <div className="bg-slate-800/50 rounded-lg p-6 mb-4 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Annual Cost Savings</p>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(annualSavings)}</p>
                    <p className="text-xs text-slate-500 mt-2">35% reduction in compliance costs</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400 flex-shrink-0" />
                </div>
              </div>

              {/* Risk Reduction Card */}
              <div className="bg-slate-800/50 rounded-lg p-6 mb-4 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Risk Reduction</p>
                    <p className="text-3xl font-bold text-blue-400">{riskReduction}%</p>
                    <p className="text-xs text-slate-500 mt-2">Average improvement in AI governance</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-400 flex-shrink-0" />
                </div>
              </div>

              {/* Time to Compliance Card */}
              <div className="bg-slate-800/50 rounded-lg p-6 mb-4 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Time to Compliance</p>
                    <p className="text-2xl font-bold text-purple-400">3-6 months</p>
                    <p className="text-xs text-slate-500 mt-2">vs 12-18 months traditional</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-400 flex-shrink-0" />
                </div>
              </div>

              {/* Audit Time Saved Card */}
              <div className="bg-slate-800/50 rounded-lg p-6 mb-4 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Audit Preparation Time Saved</p>
                    <p className="text-3xl font-bold text-amber-400">85%</p>
                    <p className="text-xs text-slate-500 mt-2">Reduction in manual work</p>
                  </div>
                  <BarChart2 className="w-8 h-8 text-amber-400 flex-shrink-0" />
                </div>
              </div>

              {/* 3-Year ROI Card - Highlighted */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-6 border border-green-400/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-300 mb-1 font-semibold">3-Year ROI</p>
                    <p className="text-4xl font-bold text-green-400">{Math.round(threeYearROI)}%</p>
                    <p className="text-xs text-slate-400 mt-2">Return on investment over 3 years</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Benefits of CSOAI</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 hover:border-blue-500/50 transition-colors"
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold mb-3">{benefit.title}</h3>
                <p className="text-slate-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-lg p-12 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to See Your Custom ROI?</h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Contact our advisory team for a personalized ROI assessment tailored to your organization's unique needs and AI governance challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <a className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                  View Pricing
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Link>
              <Link href="/partners">
                <a className="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                  Find an Advisor
                  <Users className="w-5 h-5" />
                </a>
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center text-sm text-slate-500 border-t border-slate-700 pt-8">
          <p>
            * ROI estimates are based on industry averages and may vary. Contact our advisory team for a personalized assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
