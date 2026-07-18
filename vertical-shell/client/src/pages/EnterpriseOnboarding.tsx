import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  Building2, 
  Users, 
  Shield, 
  FileCheck, 
  Rocket,
  ChevronRight,
  ChevronLeft,
  Check,
  Cpu,
  Globe,
  Mail,
  Key,
  AlertTriangle
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Company Info', icon: Building2, description: 'Basic organization details' },
  { id: 2, title: 'AI Systems', icon: Cpu, description: 'Register your AI systems' },
  { id: 3, title: 'Compliance', icon: FileCheck, description: 'Select frameworks' },
  { id: 4, title: 'Team', icon: Users, description: 'Invite team members' },
  { id: 5, title: 'API Setup', icon: Key, description: 'Get your API credentials' },
];

const RISK_LEVELS = [
  { value: 'minimal', label: 'Minimal Risk', description: 'Low-impact AI applications' },
  { value: 'limited', label: 'Limited Risk', description: 'Transparency obligations apply' },
  { value: 'high', label: 'High Risk', description: 'Strict requirements apply' },
  { value: 'unacceptable', label: 'Unacceptable Risk', description: 'Prohibited under EU AI Act' },
];

const FRAMEWORKS = [
  { id: 'eu-ai-act', name: 'EU AI Act', region: 'Europe' },
  { id: 'nist-rmf', name: 'NIST AI RMF', region: 'United States' },
  { id: 'tc260', name: 'TC260 Standards', region: 'China' },
];

export default function EnterpriseOnboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company Info
    companyName: '',
    industry: '',
    website: '',
    employeeCount: '',
    // AI Systems
    aiSystems: [{ name: '', type: '', riskLevel: 'limited', description: '' }],
    // Compliance
    frameworks: [] as string[],
    // Team
    teamMembers: [{ email: '', role: 'viewer' }],
  });
  
  const createSystemMutation = trpc.aiSystems.create.useMutation();
  const createApiKeyMutation = trpc.apiKeys.create.useMutation();
  
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleNext = async () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - create everything
      setIsSubmitting(true);
      try {
        // Create AI systems
        for (const system of formData.aiSystems) {
          if (system.name) {
            await createSystemMutation.mutateAsync({
              name: system.name,
              systemType: (system.type || 'other') as any,
              riskLevel: system.riskLevel as any,
              description: system.description,
            });
          }
        }
        
        // Create API key
        const keyResult = await createApiKeyMutation.mutateAsync({
          name: `${formData.companyName} Production Key`,
        });
        setApiKey(keyResult.key);
        
        toast.success('Enterprise setup complete!');
      } catch (error) {
        toast.error('Setup failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const addAISystem = () => {
    setFormData({
      ...formData,
      aiSystems: [...formData.aiSystems, { name: '', type: '', riskLevel: 'limited', description: '' }],
    });
  };
  
  const updateAISystem = (index: number, field: string, value: string) => {
    const updated = [...formData.aiSystems];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, aiSystems: updated });
  };
  
  const addTeamMember = () => {
    setFormData({
      ...formData,
      teamMembers: [...formData.teamMembers, { email: '', role: 'viewer' }],
    });
  };
  
  const updateTeamMember = (index: number, field: string, value: string) => {
    const updated = [...formData.teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, teamMembers: updated });
  };
  
  const toggleFramework = (frameworkId: string) => {
    const current = formData.frameworks;
    if (current.includes(frameworkId)) {
      setFormData({ ...formData, frameworks: current.filter(f => f !== frameworkId) });
    } else {
      setFormData({ ...formData, frameworks: [...current, frameworkId] });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Enterprise Onboarding</h1>
          <p className="text-slate-400">Set up your organization for AI compliance in minutes</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-cyan-500/20 border border-cyan-500/50' 
                      : isCompleted 
                        ? 'bg-green-500/20 border border-green-500/50'
                        : 'bg-slate-800 border border-slate-700'
                  }`}>
                    <div className={`p-1.5 rounded-full ${
                      isActive ? 'bg-cyan-500' : isCompleted ? 'bg-green-500' : 'bg-slate-700'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <Icon className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className={`text-sm font-medium hidden md:block ${
                      isActive ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-slate-600 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Step Content */}
        <Card className="max-w-2xl mx-auto bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Company Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Acme Corporation"
                    className="bg-slate-900 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      className="pl-10 bg-slate-900 border-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeCount">Company Size</Label>
                  <Select
                    value={formData.employeeCount}
                    onValueChange={(value) => setFormData({ ...formData, employeeCount: value })}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-50">1-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-1000">201-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* Step 2: AI Systems */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {formData.aiSystems.map((system, index) => (
                  <Card key={index} className="bg-slate-900 border-slate-700">
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">AI System #{index + 1}</span>
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = formData.aiSystems.filter((_, i) => i !== index);
                              setFormData({ ...formData, aiSystems: updated });
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>System Name *</Label>
                          <Input
                            value={system.name}
                            onChange={(e) => updateAISystem(index, 'name', e.target.value)}
                            placeholder="ChatBot Pro"
                            className="bg-slate-800 border-slate-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={system.type}
                            onValueChange={(value) => updateAISystem(index, 'type', value)}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-600">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chatbot">Chatbot</SelectItem>
                              <SelectItem value="recommendation">Recommendation</SelectItem>
                              <SelectItem value="classification">Classification</SelectItem>
                              <SelectItem value="generation">Content Generation</SelectItem>
                              <SelectItem value="analysis">Data Analysis</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Risk Level</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {RISK_LEVELS.map(level => (
                            <div
                              key={level.value}
                              onClick={() => updateAISystem(index, 'riskLevel', level.value)}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                system.riskLevel === level.value
                                  ? 'border-cyan-500 bg-cyan-500/10'
                                  : 'border-slate-600 hover:border-slate-500'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {level.value === 'unacceptable' && (
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                )}
                                <span className="text-sm font-medium">{level.label}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{level.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={system.description}
                          onChange={(e) => updateAISystem(index, 'description', e.target.value)}
                          placeholder="Brief description of the AI system..."
                          className="bg-slate-800 border-slate-600"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={addAISystem} className="w-full">
                  + Add Another AI System
                </Button>
              </div>
            )}
            
            {/* Step 3: Compliance Frameworks */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Select the compliance frameworks applicable to your organization:
                </p>
                <div className="space-y-3">
                  {FRAMEWORKS.map(framework => (
                    <div
                      key={framework.id}
                      onClick={() => toggleFramework(framework.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        formData.frameworks.includes(framework.id)
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={formData.frameworks.includes(framework.id)} />
                          <div>
                            <p className="font-medium">{framework.name}</p>
                            <p className="text-sm text-slate-400">{framework.region}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{framework.region}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Step 4: Team Members */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Invite team members to collaborate on AI governance:
                </p>
                {formData.teamMembers.map((member, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                          value={member.email}
                          onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                          placeholder="colleague@company.com"
                          className="pl-10 bg-slate-900 border-slate-700"
                        />
                      </div>
                    </div>
                    <Select
                      value={member.role}
                      onValueChange={(value) => updateTeamMember(index, 'role', value)}
                    >
                      <SelectTrigger className="w-32 bg-slate-900 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = formData.teamMembers.filter((_, i) => i !== index);
                          setFormData({ ...formData, teamMembers: updated });
                        }}
                        className="text-red-400"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addTeamMember} className="w-full">
                  + Add Team Member
                </Button>
              </div>
            )}
            
            {/* Step 5: API Setup */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {apiKey ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="h-5 w-5 text-green-400" />
                        <span className="font-medium text-green-400">Setup Complete!</span>
                      </div>
                      <p className="text-sm text-slate-400">
                        Your API key has been generated. Save it securely - it won't be shown again.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Your API Key</Label>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 font-mono text-sm break-all">
                        {apiKey}
                      </div>
                    </div>
                    <Button 
                      onClick={() => setLocation('/dashboard')}
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
                      <h4 className="font-medium mb-2">What happens next:</h4>
                      <ul className="space-y-2 text-sm text-slate-400">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-cyan-400" />
                          Your AI systems will be registered
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-cyan-400" />
                          Compliance frameworks will be configured
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-cyan-400" />
                          Team invitations will be sent
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-cyan-400" />
                          Your API key will be generated
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                      <p className="text-sm">
                        <strong>Ready to complete setup?</strong> Click "Complete Setup" to create your 
                        enterprise account and get your API credentials.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Navigation Buttons */}
            {!apiKey && (
              <div className="flex justify-between pt-4 border-t border-slate-700">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {isSubmitting ? (
                    'Processing...'
                  ) : currentStep === 5 ? (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Complete Setup
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
