import { AlertTriangle, Bot, HardHat, Recycle, Calculator, Shield, CloudRain } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const disclaimers = [
  {
    id: 'ai-recommendations',
    icon: Bot,
    title: 'AI Recommendations Disclaimer',
    content: `Our AI-powered recommendations, including spoil classification, pricing estimates, and compliance suggestions, are provided for informational purposes only. They do not constitute professional engineering, environmental, or legal advice. All AI outputs should be verified by qualified professionals before relying on them for operational decisions. MuckAway.ai is not liable for decisions made based solely on AI recommendations without proper professional verification.`,
  },
  {
    id: 'site-safety',
    icon: HardHat,
    title: 'Site Safety Disclaimer',
    content: `The customer is solely responsible for all site safety matters, including but not limited to: conducting appropriate risk assessments, ensuring safe access for vehicles, providing adequate signage and barriers, and compliance with CDM Regulations 2015 (UK) or equivalent local regulations. MuckAway.ai and its contractors are not responsible for site safety conditions created or maintained by the customer.`,
  },
  {
    id: 'waste-classification',
    icon: Recycle,
    title: 'Waste Classification Disclaimer',
    content: `The customer is legally responsible for the accurate classification of waste materials under applicable regulations (including UK Environmental Protection Act 1990, EU Waste Framework Directive, or equivalent local laws). While our AI assists with classification suggestions, the duty of care for correct waste classification remains with the waste producer. Incorrect classification may result in regulatory penalties for which MuckAway.ai bears no liability.`,
  },
  {
    id: 'financial',
    icon: Calculator,
    title: 'Financial Disclaimer',
    content: `All pricing displayed is indicative and subject to change based on actual site conditions, material quantities, and disposal requirements. Final costs may vary from estimates. Landfill tax rates, disposal levies, and other regulatory charges are set by government authorities and may change without notice. Currency conversions are approximate and based on current exchange rates. MuckAway.ai is not a financial advisor; consult appropriate professionals for tax and financial guidance.`,
  },
  {
    id: 'insurance',
    icon: Shield,
    title: 'Insurance Disclaimer',
    content: `MuckAway.ai maintains appropriate business insurance for its operations. However, this insurance does not replace the customer's obligation to maintain their own adequate insurance coverage, including but not limited to: public liability insurance, employer's liability insurance (where applicable), and professional indemnity insurance. Customers should ensure their own insurance policies adequately cover all aspects of their operations and any work conducted on their sites.`,
  },
  {
    id: 'force-majeure',
    icon: CloudRain,
    title: 'Force Majeure Disclaimer',
    content: `MuckAway.ai shall not be liable for any delay or failure in performance resulting from circumstances beyond our reasonable control, including but not limited to: extreme weather conditions, natural disasters, pandemics, government actions, civil unrest, equipment failures, or third-party service disruptions. In such events, performance obligations will be suspended for the duration of the force majeure event, and we will use reasonable efforts to mitigate the impact and resume normal operations as soon as practicable.`,
  },
];

interface LegalDisclaimersProps {
  compact?: boolean;
  showAll?: boolean;
}

export function LegalDisclaimers({ compact = false, showAll = true }: LegalDisclaimersProps) {
  const displayedDisclaimers = showAll ? disclaimers : disclaimers.slice(0, 3);

  if (compact) {
    return (
      <Alert className="bg-muted/50 border-border">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Disclaimers</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          AI recommendations are for informational purposes only and do not constitute professional advice. 
          The customer remains responsible for site safety, waste classification accuracy, and maintaining 
          appropriate insurance coverage. See our full{' '}
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a> for complete details.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-foreground">Important Disclaimers</h3>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {displayedDisclaimers.map((disclaimer) => (
          <AccordionItem key={disclaimer.id} value={disclaimer.id} className="border-border">
            <AccordionTrigger className="text-foreground hover:text-primary">
              <div className="flex items-center gap-3">
                <disclaimer.icon className="h-4 w-4 text-muted-foreground" />
                <span>{disclaimer.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
              {disclaimer.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
