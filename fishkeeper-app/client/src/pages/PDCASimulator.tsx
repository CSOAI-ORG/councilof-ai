/**
 * Interactive PDCA Cycle Simulator
 * Walk through a sample PDCA cycle with a fictional AI system
 * and see 33-Agent Council recommendations at each phase
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Target,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Shield,
  AlertTriangle,
  Lightbulb,
  FileText,
} from 'lucide-react';

type Phase = 'PLAN' | 'DO' | 'CHECK' | 'ACT';

interface PhaseData {
  phase: Phase;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  scenario: string;
  tasks: string[];
  councilRecommendations: string[];
  risks: string[];
  outcomes: string[];
}

const FICTIONAL_AI_SYSTEM = {
  name: 'HealthBot AI',
  description: 'AI-powered medical symptom checker and health advisor',
  riskLevel: 'High-Risk',
  frameworks: ['EU AI Act', 'HIPAA', 'NIST AI RMF'],
  users: '500,000 monthly active users',
};

const PHASES: PhaseData[] = [
  {
    phase: 'PLAN',
    title: 'Phase 1: PLAN',
    description: 'Define objectives and establish safety requirements',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    scenario:
      'HealthBot AI is a medical symptom checker used by 500,000 patients monthly. Recent user feedback indicates potential bias in diagnostic suggestions for certain demographics.',
    tasks: [
      'Document AI system scope and boundaries',
      'Conduct comprehensive risk assessment',
      'Map applicable regulatory frameworks (EU AI Act, HIPAA)',
      'Identify potential bias and fairness issues',
      'Define success criteria and KPIs',
      'Establish baseline compliance requirements',
    ],
    councilRecommendations: [
      '🤖 33-Agent Council Analysis: "High-risk medical AI system requires enhanced oversight under EU AI Act Article 6"',
      '🔍 Bias Detection: "Recommend demographic fairness audit across age, gender, ethnicity, and socioeconomic factors"',
      '📊 Risk Priority: "Focus on diagnostic accuracy disparities (Critical), data privacy (High), and explainability (High)"',
      '✅ Compliance Gap: "HIPAA compliance verified. EU AI Act conformity assessment required before deployment in EU"',
    ],
    risks: [
      'Diagnostic bias leading to health disparities',
      'Privacy violations of sensitive health data',
      'Lack of explainability in medical recommendations',
      'Regulatory non-compliance in multiple jurisdictions',
    ],
    outcomes: [
      '✓ Risk Assessment Matrix completed (12 risks identified)',
      '✓ Compliance requirements mapped to 3 frameworks',
      '✓ Implementation roadmap approved (16-week timeline)',
      '✓ Stakeholder sign-off obtained',
    ],
  },
  {
    phase: 'DO',
    title: 'Phase 2: DO',
    description: 'Implement safety controls and safeguards',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    scenario:
      'Implementation phase: Deploy bias mitigation controls, enhance data privacy measures, and establish monitoring systems for HealthBot AI.',
    tasks: [
      'Deploy fairness-aware model retraining pipeline',
      'Implement differential privacy for patient data',
      'Add explainability layer (SHAP values for diagnoses)',
      'Configure real-time bias monitoring dashboard',
      'Establish incident response procedures',
      'Train medical staff on AI oversight protocols',
    ],
    councilRecommendations: [
      '🛡️ Technical Controls: "Implement demographic parity constraints in model training. Target: <5% accuracy difference across groups"',
      '🔐 Privacy Enhancement: "Add federated learning to process sensitive data locally. Encrypt all PHI at rest and in transit"',
      '📈 Monitoring Setup: "Track diagnostic accuracy, bias metrics, and user satisfaction in real-time. Alert threshold: >10% accuracy drop"',
      '👥 Human Oversight: "Require medical professional review for high-stakes diagnoses (cancer, cardiac, neurological)"',
    ],
    risks: [
      'Implementation delays affecting compliance deadlines',
      'Performance degradation from bias mitigation',
      'Staff resistance to new oversight procedures',
    ],
    outcomes: [
      '✓ Fairness-aware model deployed (bias reduced by 67%)',
      '✓ Privacy controls implemented (HIPAA audit passed)',
      '✓ Monitoring dashboard operational (15 KPIs tracked)',
      '✓ 45 medical staff trained on oversight protocols',
    ],
  },
  {
    phase: 'CHECK',
    title: 'Phase 3: CHECK',
    description: 'Monitor performance and assess compliance',
    icon: BarChart3,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    scenario:
      'Monitoring phase: After 8 weeks of operation, collect performance data, review incident reports, and assess control effectiveness.',
    tasks: [
      'Analyze diagnostic accuracy across demographics',
      'Review 23 incident reports from Watchdog database',
      'Conduct compliance audit against EU AI Act',
      'Collect user feedback and satisfaction scores',
      'Assess bias metrics and fairness indicators',
      'Generate compliance reports for regulators',
    ],
    councilRecommendations: [
      '📊 Performance Analysis: "Overall accuracy: 94.2% (target: 95%). Demographic parity achieved: max difference 3.8%"',
      '⚠️ Incident Review: "23 reports analyzed. 3 critical (misdiagnosis), 8 high (bias concerns), 12 medium (UX issues)"',
      '🎯 Compliance Status: "EU AI Act: 89% compliant (2 gaps identified). HIPAA: 100% compliant. NIST AI RMF: Aligned"',
      '💡 Improvement Areas: "Accuracy below target for rare diseases. Explainability scores low for complex cases"',
    ],
    risks: [
      'Accuracy gap for rare diseases (91.5% vs 94.2% overall)',
      'User confusion with AI explanations (satisfaction: 3.8/5)',
      'EU AI Act conformity assessment pending',
    ],
    outcomes: [
      '✓ Performance metrics collected (8 weeks, 67,000 diagnoses)',
      '✓ Incident root cause analysis completed',
      '✓ Compliance audit report generated',
      '✓ 2 critical gaps identified for remediation',
    ],
  },
  {
    phase: 'ACT',
    title: 'Phase 4: ACT',
    description: 'Implement improvements and plan next cycle',
    icon: RefreshCw,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    scenario:
      'Improvement phase: Address identified gaps, implement corrective actions, and prepare for the next PDCA cycle iteration.',
    tasks: [
      'Enhance rare disease training data (5,000 new cases)',
      'Redesign explanation UI for better user comprehension',
      'Complete EU AI Act conformity assessment',
      'Update incident response procedures based on learnings',
      'Communicate improvements to stakeholders',
      'Plan next PDCA cycle (focus: explainability)',
    ],
    councilRecommendations: [
      '🔧 Corrective Actions: "Priority 1: Augment rare disease dataset. Priority 2: Simplify explanations. Priority 3: Complete EU assessment"',
      '📈 Expected Impact: "Rare disease accuracy: +4.2% (to 95.7%). User satisfaction: +0.9 points (to 4.7/5)"',
      '🎓 Lessons Learned: "Bias mitigation successful. Explainability needs ongoing attention. Proactive monitoring prevented major incidents"',
      '🔄 Next Cycle Focus: "Expand to mental health assessments. Implement advanced explainability (counterfactual explanations)"',
    ],
    risks: [
      'Timeline pressure for EU conformity assessment',
      'Resource constraints for rare disease data collection',
    ],
    outcomes: [
      '✓ Rare disease accuracy improved to 95.8%',
      '✓ New explanation UI deployed (satisfaction: 4.6/5)',
      '✓ EU AI Act conformity assessment passed',
      '✓ Next PDCA cycle planned (mental health expansion)',
      '✓ Continuous improvement loop established',
    ],
  },
];

export default function PDCASimulator() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<Phase[]>([]);

  const currentPhase = PHASES[currentPhaseIndex];
  const progress = ((currentPhaseIndex + 1) / PHASES.length) * 100;

  const handleNext = () => {
    if (!completedPhases.includes(currentPhase.phase)) {
      setCompletedPhases([...completedPhases, currentPhase.phase]);
    }
    if (currentPhaseIndex < PHASES.length - 1) {
      setCurrentPhaseIndex(currentPhaseIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPhaseIndex > 0) {
      setCurrentPhaseIndex(currentPhaseIndex - 1);
    }
  };

  const handleReset = () => {
    setCurrentPhaseIndex(0);
    setCompletedPhases([]);
  };

  const Icon = currentPhase.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Interactive PDCA Cycle Simulator</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Walk through a complete SOAI-PDCA cycle with a fictional AI system and see how the
            33-Agent Council provides recommendations at each phase.
          </p>
        </div>

        {/* AI System Info Card */}
        <Card className="mb-8 border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{FICTIONAL_AI_SYSTEM.name}</CardTitle>
                <p className="text-gray-600">{FICTIONAL_AI_SYSTEM.description}</p>
              </div>
              <Badge variant="destructive" className="text-sm">
                {FICTIONAL_AI_SYSTEM.riskLevel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Applicable Frameworks:</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {FICTIONAL_AI_SYSTEM.frameworks.map((fw) => (
                    <Badge key={fw} variant="outline">
                      {fw}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Scale:</strong>
                </p>
                <p className="text-gray-900">{FICTIONAL_AI_SYSTEM.users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">PDCA Cycle Progress</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="grid grid-cols-4 gap-2 mt-4">
            {PHASES.map((phase, index) => (
              <div
                key={phase.phase}
                className={`text-center p-2 rounded-lg border-2 ${
                  index === currentPhaseIndex
                    ? 'border-green-500 bg-green-50'
                    : completedPhases.includes(phase.phase)
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-xs font-semibold text-gray-700">{phase.phase}</div>
                {completedPhases.includes(phase.phase) && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Phase Content */}
        <div className="space-y-6">
          {/* Phase Header */}
          <Card className={`border-2 ${currentPhase.bgColor}`}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-white`}>
                  <Icon className={`h-8 w-8 ${currentPhase.color}`} />
                </div>
                <div>
                  <CardTitle className="text-2xl">{currentPhase.title}</CardTitle>
                  <p className="text-gray-600 mt-1">{currentPhase.description}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Scenario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Scenario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{currentPhase.scenario}</p>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Key Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentPhase.tasks.map((task, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 33-Agent Council Recommendations */}
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-green-600" />
                33-Agent AI Council Recommendations
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Democratic consensus from 33 AI agents across multiple providers (OpenAI, Anthropic,
                Google, Meta, and more)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentPhase.councilRecommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risks */}
          {currentPhase.risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Identified Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentPhase.risks.map((risk, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Phase Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentPhase.outcomes.map((outcome, index) => (
                  <li key={index} className="text-gray-700">
                    {outcome}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPhaseIndex === 0}
            size="lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Previous Phase
          </Button>

          {currentPhaseIndex === PHASES.length - 1 ? (
            <Button onClick={handleReset} size="lg" className="bg-green-600 hover:bg-green-700">
              <RefreshCw className="mr-2 h-5 w-5" />
              Start New Cycle
            </Button>
          ) : (
            <Button onClick={handleNext} size="lg" className="bg-green-600 hover:bg-green-700">
              Next Phase
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Completion Message */}
        {currentPhaseIndex === PHASES.length - 1 && completedPhases.length === PHASES.length && (
          <Card className="mt-8 border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  PDCA Cycle Complete! 🎉
                </h3>
                <p className="text-gray-700 mb-6">
                  You've successfully walked through a complete SOAI-PDCA cycle. HealthBot AI is now
                  safer, more compliant, and ready for the next iteration of continuous improvement.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="outline" onClick={handleReset}>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Try Another Cycle
                  </Button>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    Get Started with Your AI System
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
