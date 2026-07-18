import React from 'react';
import { useGlobal } from './GlobalProvider';
import { getComplianceForRegion } from '@/config/regionalCompliance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileCheck, AlertTriangle, Globe, ExternalLink, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RegionalComplianceSection: React.FC = () => {
  const { region } = useGlobal();
  const { t } = useTranslation();
  const compliance = getComplianceForRegion(region?.country || 'UK');

  const getRegulationIcon = (index: number) => {
    const icons = [Shield, FileCheck, AlertTriangle, Globe, FileCheck];
    const Icon = icons[index % icons.length];
    return <Icon className="h-5 w-5 text-primary" />;
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-primary border-primary">
            {compliance.flag} {compliance.name} Compliance
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('compliance.title', 'Full Regulatory Compliance')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('compliance.subtitle', 'MuckAway.ai automatically ensures all waste transfers meet local regulatory requirements')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {compliance.regulations.map((reg, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getRegulationIcon(index)}
                    <CardTitle className="text-lg">{reg.name}</CardTitle>
                  </div>
                  {reg.badge && (
                    <Badge variant="destructive" className="text-xs">
                      {reg.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{reg.description}</p>
                {reg.mandatory && (
                  <Badge variant="secondary" className="mt-3 text-xs">
                    Mandatory
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tax Rates Section */}
        <div className="bg-card rounded-xl p-6 border border-border mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Current Disposal Levies & Taxes
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(compliance.taxRates).map(([key, tax]) => (
              <div key={key} className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{tax.label}</p>
                <p className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat(region?.language === 'en' ? 'en-US' : region?.language || 'en-US', {
                    style: 'currency',
                    currency: tax.currency
                  }).format(tax.rate)}
                </p>
                {tax.unit && <p className="text-xs text-muted-foreground">{tax.unit}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Contact */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Regulatory Body:</span>
            <a 
              href={compliance.regulatoryUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {compliance.regulatoryBody}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Emergency Hotline:</span>
            <a href={`tel:${compliance.emergencyNumber}`} className="text-primary font-medium">
              {compliance.emergencyNumber}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegionalComplianceSection;
