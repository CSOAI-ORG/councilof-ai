import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '@/components/GlobalProvider';
import { CheckCircle, Building, CreditCard, Rocket } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

interface OnboardingData {
  companyName: string;
  industry: string;
  companySize: string;
  monthlyVolume: string;
  plan: string;
  features: string[];
}

export const EnhancedOnboarding: React.FC<{ onComplete: (data: OnboardingData) => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useGlobal();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    industry: '',
    companySize: '',
    monthlyVolume: '',
    plan: 'basic',
    features: [],
  });

  const steps: OnboardingStep[] = [
    {
      id: 'company',
      title: t('onboarding.step1.title'),
      subtitle: t('onboarding.step1.subtitle'),
      icon: <Building className="h-8 w-8" />,
    },
    {
      id: 'plan',
      title: t('onboarding.step2.title'),
      subtitle: t('onboarding.step2.subtitle'),
      icon: <CreditCard className="h-8 w-8" />,
    },
    {
      id: 'complete',
      title: t('onboarding.step3.title'),
      subtitle: t('onboarding.step3.subtitle'),
      icon: <Rocket className="h-8 w-8" />,
    },
  ];

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 99,
      features: ['AI Classification', 'Basic Reporting', 'Email Support'],
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 299,
      popular: true,
      features: ['Everything in Basic', 'Advanced Analytics', 'Voice AI', 'Priority Support'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 699,
      features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Manager', 'White-label'],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return data.companyName && data.industry && data.companySize;
      case 1:
        return data.plan;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card border-border shadow-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index <= currentStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        index < currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl text-primary">
            {steps[currentStep].title}
          </CardTitle>
          <p className="text-muted-foreground">
            {steps[currentStep].subtitle}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={data.companyName}
                  onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  placeholder="Enter your company name"
                  className="bg-input border-border"
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={data.industry} onValueChange={(value) => setData({ ...data, industry: value })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="demolition">Demolition</SelectItem>
                    <SelectItem value="excavation">Excavation</SelectItem>
                    <SelectItem value="waste-management">Waste Management</SelectItem>
                    <SelectItem value="environmental">Environmental Services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="companySize">Company Size</Label>
                <Select value={data.companySize} onValueChange={(value) => setData({ ...data, companySize: value })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monthlyVolume">Monthly Waste Volume (approximate)</Label>
                <Select value={data.monthlyVolume} onValueChange={(value) => setData({ ...data, monthlyVolume: value })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select monthly volume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-100">0-100 tonnes</SelectItem>
                    <SelectItem value="100-500">100-500 tonnes</SelectItem>
                    <SelectItem value="500-1000">500-1000 tonnes</SelectItem>
                    <SelectItem value="1000-5000">1000-5000 tonnes</SelectItem>
                    <SelectItem value="5000+">5000+ tonnes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all border-2 ${
                      data.plan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setData({ ...data, plan: plan.id })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{plan.name}</h3>
                            {plan.popular && (
                              <Badge variant="secondary">{t('pricing.mostPopular')}</Badge>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(plan.price)}
                            <span className="text-sm font-normal text-muted-foreground">/month</span>
                          </p>
                          <ul className="mt-2 space-y-1">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          data.plan === plan.id ? 'bg-primary border-primary' : 'border-muted'
                        }`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Welcome to MuckAway.ai!</h3>
              <p className="text-muted-foreground">
                Your account has been set up successfully. You can now access all the powerful AI features.
              </p>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Company:</strong> {data.companyName}<br />
                  <strong>Industry:</strong> {data.industry}<br />
                  <strong>Plan:</strong> {plans.find(p => p.id === data.plan)?.name}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              {t('common.back')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              variant="action"
            >
              {currentStep === steps.length - 1 ? t('common.finish') : t('common.next')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};