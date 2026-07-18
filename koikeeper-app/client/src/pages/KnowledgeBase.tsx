import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { 
  Brain, 
  Search, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  Shield,
  Lightbulb,
  FileText,
  ChevronRight,
  Clock,
  Users,
  BarChart3,
  Zap
} from 'lucide-react';

// Scenario categories based on real AI safety incidents
const SCENARIO_CATEGORIES = [
  { id: 'bias', name: 'Algorithmic Bias', icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { id: 'privacy', name: 'Privacy Violations', icon: Shield, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { id: 'misinformation', name: 'Misinformation', icon: AlertTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { id: 'safety', name: 'Safety Failures', icon: Zap, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { id: 'transparency', name: 'Transparency Issues', icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { id: 'accountability', name: 'Accountability Gaps', icon: BarChart3, color: 'text-green-400', bgColor: 'bg-green-500/20' },
];

// Sample scenarios from real-world AI incidents
const SCENARIOS = [
  {
    id: 1,
    title: 'Facial Recognition Misidentification',
    category: 'bias',
    severity: 'high',
    description: 'AI system incorrectly identified individuals leading to wrongful accusations',
    lessons: ['Ensure diverse training data', 'Implement human review for high-stakes decisions', 'Regular bias audits'],
    frameworks: ['EU AI Act Article 10', 'NIST AI RMF MAP 1.1'],
    occurrences: 47,
  },
  {
    id: 2,
    title: 'Healthcare Algorithm Discrimination',
    category: 'bias',
    severity: 'critical',
    description: 'Medical AI prioritized patients based on historical spending rather than health needs',
    lessons: ['Audit proxy variables', 'Test for disparate impact', 'Include domain experts in development'],
    frameworks: ['EU AI Act Article 9', 'TC260 Model Safety'],
    occurrences: 23,
  },
  {
    id: 3,
    title: 'Chatbot Data Leakage',
    category: 'privacy',
    severity: 'high',
    description: 'Conversational AI exposed sensitive user data in responses to other users',
    lessons: ['Implement data isolation', 'Regular security audits', 'Clear data retention policies'],
    frameworks: ['EU AI Act Article 15', 'NIST AI RMF GOVERN 1.3'],
    occurrences: 89,
  },
  {
    id: 4,
    title: 'Deepfake Political Manipulation',
    category: 'misinformation',
    severity: 'critical',
    description: 'AI-generated content used to spread false political information',
    lessons: ['Implement content provenance', 'Deploy detection systems', 'User education'],
    frameworks: ['TC260 Content Safety', 'EU AI Act Article 52'],
    occurrences: 156,
  },
  {
    id: 5,
    title: 'Autonomous Vehicle Sensor Failure',
    category: 'safety',
    severity: 'critical',
    description: 'Self-driving system failed to detect pedestrians in unusual conditions',
    lessons: ['Edge case testing', 'Redundant safety systems', 'Clear operational design domain'],
    frameworks: ['EU AI Act Annex III', 'NIST AI RMF MEASURE 2.1'],
    occurrences: 12,
  },
  {
    id: 6,
    title: 'Recommendation Algorithm Radicalization',
    category: 'safety',
    severity: 'high',
    description: 'Content recommendation system amplified extreme content to maximize engagement',
    lessons: ['Audit recommendation objectives', 'Implement content diversity', 'Monitor user outcomes'],
    frameworks: ['TC260 Safety Measures', 'EU AI Act Article 14'],
    occurrences: 234,
  },
  {
    id: 7,
    title: 'Credit Scoring Opacity',
    category: 'transparency',
    severity: 'medium',
    description: 'AI credit decisions provided no explanation to affected individuals',
    lessons: ['Implement explainability', 'Provide appeal mechanisms', 'Document decision factors'],
    frameworks: ['EU AI Act Article 13', 'NIST AI RMF GOVERN 4.1'],
    occurrences: 67,
  },
  {
    id: 8,
    title: 'Hiring AI Liability Gap',
    category: 'accountability',
    severity: 'high',
    description: 'No clear responsibility when AI hiring tool discriminated against candidates',
    lessons: ['Define liability chains', 'Maintain human oversight', 'Document AI involvement'],
    frameworks: ['EU AI Act Article 16', 'TC260 Management Requirements'],
    occurrences: 45,
  },
];

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<typeof SCENARIOS[0] | null>(null);
  
  const { data: incidentStats } = trpc.publicApi.getIncidentStats.useQuery();
  const { data: councilStats } = trpc.publicApi.getCouncilStats.useQuery();
  const { data: rlmaiLearnings } = trpc.publicApi.getRLMAILearnings.useQuery();
  const { data: incidentPatterns } = trpc.publicApi.getIncidentPatterns.useQuery();
  
  const filteredScenarios = SCENARIOS.filter(scenario => {
    const matchesSearch = searchQuery === '' || 
      scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || scenario.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-cyan-500" />
              RLMAI Knowledge Base
            </h1>
            <p className="text-muted-foreground mt-1">
              Learn from historical AI safety incidents and council decisions
            </p>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <BookOpen className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{SCENARIOS.length}</p>
                  <p className="text-sm text-muted-foreground">Documented Scenarios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{incidentStats?.totalIncidents || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Incidents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{councilStats?.totalSessions || 0}</p>
                  <p className="text-sm text-muted-foreground">Council Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Lightbulb className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{SCENARIOS.reduce((sum, s) => sum + s.lessons.length, 0)}</p>
                  <p className="text-sm text-muted-foreground">Lessons Learned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="scenarios" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scenarios">Scenario Library</TabsTrigger>
            <TabsTrigger value="patterns">Incident Patterns</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scenarios" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scenarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {SCENARIO_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="gap-2"
                  >
                    <Icon className={`h-4 w-4 ${selectedCategory === cat.id ? '' : cat.color}`} />
                    {cat.name}
                  </Button>
                );
              })}
            </div>
            
            {/* Scenario Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredScenarios.map(scenario => {
                const category = SCENARIO_CATEGORIES.find(c => c.id === scenario.category);
                const Icon = category?.icon || AlertTriangle;
                
                return (
                  <Card 
                    key={scenario.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedScenario(scenario)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${category?.bgColor}`}>
                          <Icon className={`h-6 w-6 ${category?.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{scenario.title}</h3>
                            <Badge className={getSeverityColor(scenario.severity)}>
                              {scenario.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {scenario.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {scenario.occurrences} occurrences
                              </span>
                              <span className="flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" />
                                {scenario.lessons.length} lessons
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-500" />
                  Incident Pattern Analysis
                </CardTitle>
                <CardDescription>
                  AI-detected patterns from historical incident data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SCENARIO_CATEGORIES.map(cat => {
                    const count = SCENARIOS.filter(s => s.category === cat.id).length;
                    const percentage = Math.round((count / SCENARIOS.length) * 100);
                    const Icon = cat.icon;
                    
                    return (
                      <div key={cat.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${cat.color}`} />
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {count} scenarios ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${cat.bgColor.replace('/20', '')}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-sm">
                      <strong>Bias incidents</strong> account for 25% of all documented cases, 
                      with healthcare and hiring being the most affected domains.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm">
                      <strong>Critical severity</strong> incidents are most common in autonomous 
                      systems and content generation applications.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-sm">
                      <strong>Transparency issues</strong> are often precursors to accountability 
                      gaps - addressing explainability early prevents downstream problems.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI-Generated Recommendations
                </CardTitle>
                <CardDescription>
                  Based on analysis of {SCENARIOS.length} documented scenarios and {councilStats?.totalSessions || 0} council sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      For High-Risk AI Systems
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Implement mandatory human oversight for all consequential decisions</li>
                      <li>• Conduct quarterly bias audits with diverse testing populations</li>
                      <li>• Maintain detailed decision logs for regulatory compliance</li>
                      <li>• Establish clear escalation paths for edge cases</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      For Consumer-Facing AI
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Provide clear AI disclosure at all interaction points</li>
                      <li>• Implement content provenance for generated media</li>
                      <li>• Offer user controls for personalization algorithms</li>
                      <li>• Establish feedback mechanisms for reporting issues</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      For Enterprise AI Governance
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Designate AI ethics officers with board-level reporting</li>
                      <li>• Implement PDCA cycles for continuous improvement</li>
                      <li>• Maintain cross-functional AI review committees</li>
                      <li>• Conduct annual third-party AI audits</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Scenario Detail Modal */}
        {selectedScenario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedScenario.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {SCENARIO_CATEGORIES.find(c => c.id === selectedScenario.category)?.name}
                    </CardDescription>
                  </div>
                  <Badge className={getSeverityColor(selectedScenario.severity)}>
                    {selectedScenario.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedScenario.description}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Lessons Learned
                  </h4>
                  <ul className="space-y-2">
                    {selectedScenario.lessons.map((lesson, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        {lesson}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-cyan-500" />
                    Relevant Framework Requirements
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.frameworks.map((fw, i) => (
                      <Badge key={i} variant="outline">{fw}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {selectedScenario.occurrences} documented occurrences
                  </span>
                  <Button onClick={() => setSelectedScenario(null)}>Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
