import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ExternalLink, Shield } from 'lucide-react';

interface ComplianceItem {
  id: string;
  regulation: string;
  jurisdiction: string;
  status: 'compliant' | 'action_required' | 'not_applicable';
  owner: string;
  lastReview: string;
  nextReview: string;
  riskLevel: 'low' | 'medium' | 'high';
  evidenceUrl?: string;
  notes?: string;
}

const complianceItems: ComplianceItem[] = [
  {
    id: 'uk-gdpr',
    regulation: 'UK GDPR / Data Protection Act 2018',
    jurisdiction: 'United Kingdom',
    status: 'compliant',
    owner: 'Data Protection Officer',
    lastReview: '2024-12-01',
    nextReview: '2025-03-01',
    riskLevel: 'high',
    evidenceUrl: '/privacy',
    notes: 'Privacy policy updated, DPO appointed, data processing records maintained',
  },
  {
    id: 'ccpa-cpra',
    regulation: 'CCPA / CPRA (California)',
    jurisdiction: 'United States (California)',
    status: 'compliant',
    owner: 'Legal Team',
    lastReview: '2024-12-01',
    nextReview: '2025-06-01',
    riskLevel: 'medium',
    evidenceUrl: '/privacy',
    notes: 'California-specific disclosures added, opt-out mechanisms in place',
  },
  {
    id: 'pipeda',
    regulation: 'PIPEDA',
    jurisdiction: 'Canada',
    status: 'compliant',
    owner: 'Privacy Officer',
    lastReview: '2024-11-15',
    nextReview: '2025-05-15',
    riskLevel: 'medium',
    notes: 'Consent mechanisms reviewed, data breach procedures documented',
  },
  {
    id: 'osha-construction',
    regulation: 'OSHA 29 CFR 1926 (Construction)',
    jurisdiction: 'United States',
    status: 'action_required',
    owner: 'Operations Manager',
    lastReview: '2024-10-01',
    nextReview: '2025-01-01',
    riskLevel: 'high',
    notes: 'Annual safety training due for renewal',
  },
  {
    id: 'hse-cdm',
    regulation: 'HSE CDM Regulations 2015',
    jurisdiction: 'United Kingdom',
    status: 'compliant',
    owner: 'Health & Safety Officer',
    lastReview: '2024-12-10',
    nextReview: '2025-06-10',
    riskLevel: 'high',
    notes: 'Site safety assessments up to date, principal contractor duties documented',
  },
  {
    id: 'vat-moss',
    regulation: 'VAT / MOSS (Digital Services)',
    jurisdiction: 'European Union',
    status: 'compliant',
    owner: 'Finance Team',
    lastReview: '2024-11-30',
    nextReview: '2025-02-28',
    riskLevel: 'medium',
    notes: 'VAT registration pending, MOSS compliance ready for EU customers',
  },
  {
    id: 'waste-carrier',
    regulation: 'Waste Carrier Licence',
    jurisdiction: 'United Kingdom',
    status: 'action_required',
    owner: 'Compliance Manager',
    lastReview: '2024-12-01',
    nextReview: '2025-01-15',
    riskLevel: 'high',
    notes: 'Upper tier licence application in progress with Environment Agency',
  },
  {
    id: 'soc2',
    regulation: 'SOC 2 Type II',
    jurisdiction: 'International',
    status: 'action_required',
    owner: 'IT Security',
    lastReview: '2024-09-01',
    nextReview: '2025-03-01',
    riskLevel: 'medium',
    notes: 'Audit scheduled for Q1 2025, security controls documentation in progress',
  },
];

const statusConfig = {
  compliant: { label: 'Compliant', icon: CheckCircle, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  action_required: { label: 'Action Required', icon: AlertTriangle, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  not_applicable: { label: 'N/A', icon: XCircle, color: 'bg-muted text-muted-foreground border-border' },
};

const riskConfig = {
  low: { label: 'Low', color: 'bg-green-500/10 text-green-500' },
  medium: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-500' },
  high: { label: 'High', color: 'bg-red-500/10 text-red-500' },
};

export function ComplianceRegister() {
  const [isOpen, setIsOpen] = useState(true);

  const compliantCount = complianceItems.filter(i => i.status === 'compliant').length;
  const actionRequiredCount = complianceItems.filter(i => i.status === 'action_required').length;

  return (
    <Card className="bg-card border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Compliance Register</CardTitle>
                  <CardDescription>
                    Regulatory compliance status across all jurisdictions
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  {compliantCount} Compliant
                </Badge>
                {actionRequiredCount > 0 && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    {actionRequiredCount} Action Required
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Regulation</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Next Review</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceItems.map((item) => {
                    const status = statusConfig[item.status];
                    const StatusIcon = status.icon;
                    const risk = riskConfig[item.riskLevel];

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{item.regulation}</div>
                            {item.notes && (
                              <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.jurisdiction}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={risk.color}>
                            {risk.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.owner}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(item.nextReview).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          {item.evidenceUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={item.evidenceUrl}>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
