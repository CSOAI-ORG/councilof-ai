import { REGIONAL_COMPLIANCE, getComplianceForRegion } from '@/config/regionalCompliance';

export interface TaxCalculation {
  standardRate: number;
  lowerRate: number;
  currency: string;
  regionName: string;
  taxLabel: string;
}

// Get disposal tax rates for a specific region
export const getRegionalTaxRates = (countryCode: string): TaxCalculation => {
  const compliance = getComplianceForRegion(countryCode);
  const taxRates = compliance.taxRates;
  
  // Get the first available tax rate as standard, second as lower
  const rateKeys = Object.keys(taxRates);
  const standardKey = rateKeys[0] || 'standard';
  const lowerKey = rateKeys[1] || rateKeys[0] || 'lower';
  
  const standardRate = taxRates[standardKey]?.rate || 103.70;
  const lowerRate = taxRates[lowerKey]?.rate || 3.25;
  const currency = taxRates[standardKey]?.currency || 'GBP';
  
  return {
    standardRate,
    lowerRate,
    currency,
    regionName: compliance.name,
    taxLabel: taxRates[standardKey]?.label || 'Standard Rate'
  };
};

// Calculate disposal cost based on region and contamination level
export const calculateDisposalCost = (
  tonnage: number,
  contaminationLevel: string,
  countryCode: string
): { cost: number; taxRate: number; currency: string; regionName: string } => {
  const taxRates = getRegionalTaxRates(countryCode);
  
  // Use higher rate for hazardous/contaminated waste
  const isHazardous = contaminationLevel === 'hazardous' || contaminationLevel === 'high';
  const taxRate = isHazardous ? taxRates.standardRate : taxRates.lowerRate;
  
  // Apply regional multiplier for hazardous surcharge
  const hazardousSurcharge = isHazardous ? 1.22 : 1.0; // 22% surcharge for hazardous
  
  const cost = tonnage * taxRate * hazardousSurcharge;
  
  return {
    cost,
    taxRate,
    currency: taxRates.currency,
    regionName: taxRates.regionName
  };
};

// Get EWC code based on region (some regions don't use EWC)
export const getWasteCode = (countryCode: string, isHazardous: boolean): string => {
  const compliance = getComplianceForRegion(countryCode);
  
  // UK and EU use EWC codes
  if (compliance.ewcCodes) {
    return isHazardous ? '17 05 03*' : '17 05 04';
  }
  
  // US uses EPA codes
  if (countryCode === 'US' || countryCode === 'USA') {
    return isHazardous ? 'EPA D001-D043' : 'Non-RCRA Solid Waste';
  }
  
  // Australia uses NEPM classification
  if (countryCode === 'AU' || countryCode === 'AUS') {
    return isHazardous ? 'Listed Waste' : 'General Solid Waste';
  }
  
  // Canada uses TDG classification
  if (countryCode === 'CA' || countryCode === 'CAN') {
    return isHazardous ? 'Class 9 HW' : 'Non-Hazardous Waste';
  }
  
  // Default to EWC-style codes
  return isHazardous ? '17 05 03*' : '17 05 04';
};

// Get compliance document type based on region
export const getComplianceDocumentType = (countryCode: string, isHazardous: boolean): string => {
  const code = countryCode?.toUpperCase();
  
  const documentTypes: Record<string, { hazardous: string; standard: string }> = {
    'UK': { hazardous: 'Hazardous Consignment Note', standard: 'Waste Transfer Note (WTN)' },
    'GB': { hazardous: 'Hazardous Consignment Note', standard: 'Waste Transfer Note (WTN)' },
    'US': { hazardous: 'EPA Hazardous Waste Manifest', standard: 'Non-Hazardous Waste Manifest' },
    'USA': { hazardous: 'EPA Hazardous Waste Manifest', standard: 'Non-Hazardous Waste Manifest' },
    'AU': { hazardous: 'Controlled Waste Tracking Form', standard: 'Waste Transport Certificate' },
    'AUS': { hazardous: 'Controlled Waste Tracking Form', standard: 'Waste Transport Certificate' },
    'CA': { hazardous: 'Hazardous Waste Manifest', standard: 'Waste Shipment Record' },
    'CAN': { hazardous: 'Hazardous Waste Manifest', standard: 'Waste Shipment Record' },
    'NZ': { hazardous: 'Hazardous Substance Tracking', standard: 'Waste Disposal Certificate' },
    'NZL': { hazardous: 'Hazardous Substance Tracking', standard: 'Waste Disposal Certificate' },
  };
  
  const docs = documentTypes[code] || { hazardous: 'Hazardous Consignment Note', standard: 'Waste Transfer Note' };
  return isHazardous ? docs.hazardous : docs.standard;
};
