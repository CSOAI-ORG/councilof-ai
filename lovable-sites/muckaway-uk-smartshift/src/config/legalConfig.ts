// Global Legal Protection System - Configuration
// Version tracking and regional legal entities

export interface LegalEntity {
  name: string;
  registrationNumber: string;
  address: string;
  governingLaw: string;
  courts: string;
  vatNumber?: string;
  dpo: {
    email: string;
    phone?: string;
  };
  regulatoryBody?: string;
  regulatoryUrl?: string;
}

export interface LegalVersion {
  version: string;
  effectiveDate: string;
  lastUpdated: string;
}

export const LEGAL_VERSIONS: Record<string, LegalVersion> = {
  terms: {
    version: '2.0.0',
    effectiveDate: '2024-12-16',
    lastUpdated: '2024-12-16',
  },
  privacy: {
    version: '2.0.0',
    effectiveDate: '2024-12-16',
    lastUpdated: '2024-12-16',
  },
  cookies: {
    version: '1.0.0',
    effectiveDate: '2024-12-16',
    lastUpdated: '2024-12-16',
  },
  dpa: {
    version: '1.0.0',
    effectiveDate: '2024-12-16',
    lastUpdated: '2024-12-16',
  },
};

// LoopFactory AI Ltd - Parent Company for MuckAway.ai, GrabHire.ai, PlantHire.ai
export const LOOPFACTORY_COMPANY = {
  name: 'LoopFactory AI Ltd',
  companyNumber: '15212XXX', // TODO: Update with real Company Number
  vatNumber: 'GB XXX XXX XXX', // TODO: Update with real VAT number
  address: '[Your Registered Address], United Kingdom', // TODO: Update with real address
  phone: '0800 XXX XXXX', // TODO: Update with real phone
  email: 'hello@loopfactory.ai',
  website: 'https://loopfactory.ai',
};

export const REGIONAL_LEGAL_ENTITIES: Record<string, LegalEntity> = {
  UK: {
    name: 'LoopFactory AI Ltd',
    registrationNumber: LOOPFACTORY_COMPANY.companyNumber,
    address: LOOPFACTORY_COMPANY.address,
    governingLaw: 'England and Wales',
    courts: 'English Courts',
    vatNumber: LOOPFACTORY_COMPANY.vatNumber,
    dpo: {
      email: 'dpo@loopfactory.ai',
      phone: '+44 20 7946 0958',
    },
    regulatoryBody: 'Information Commissioner\'s Office (ICO)',
    regulatoryUrl: 'https://ico.org.uk',
  },
  US: {
    name: 'LoopFactory AI Inc',
    registrationNumber: 'Pending Delaware Registration',
    address: '456 Site Drive, Houston, TX 77002, United States',
    governingLaw: 'Delaware and applicable state law',
    courts: 'Delaware Courts',
    dpo: {
      email: 'privacy@loopfactory.ai',
    },
    regulatoryBody: 'Federal Trade Commission (FTC)',
    regulatoryUrl: 'https://ftc.gov',
  },
  EU: {
    name: 'LoopFactory AI Ireland Ltd',
    registrationNumber: 'Pending CRO Registration',
    address: '78 Industrial Park, Dublin 12, D12 X8K3, Ireland',
    governingLaw: 'Irish law',
    courts: 'Irish High Court',
    vatNumber: 'Pending Registration',
    dpo: {
      email: 'dpo@loopfactory.ai',
      phone: '+353 1 555 0123',
    },
    regulatoryBody: 'Data Protection Commission (DPC)',
    regulatoryUrl: 'https://dataprotection.ie',
  },
  AU: {
    name: 'LoopFactory AI Australia Pty Ltd',
    registrationNumber: 'Pending ASIC Registration',
    address: '100 Construction St, Sydney NSW 2000, Australia',
    governingLaw: 'New South Wales law',
    courts: 'NSW Courts',
    dpo: {
      email: 'privacy@loopfactory.ai',
    },
    regulatoryBody: 'Office of the Australian Information Commissioner (OAIC)',
    regulatoryUrl: 'https://oaic.gov.au',
  },
  CA: {
    name: 'LoopFactory AI Canada Inc',
    registrationNumber: 'Pending Federal Registration',
    address: '200 Equipment Ave, Toronto, ON M5V 1A1, Canada',
    governingLaw: 'Ontario law',
    courts: 'Ontario Courts',
    dpo: {
      email: 'privacy@loopfactory.ai',
    },
    regulatoryBody: 'Office of the Privacy Commissioner of Canada',
    regulatoryUrl: 'https://priv.gc.ca',
  },
};

export const DATA_RETENTION_SCHEDULE = [
  { dataType: 'Contact & Account', retention: 'Active + 7 years', justification: 'Tax/contract law' },
  { dataType: 'Booking History', retention: 'Active + 7 years', justification: 'Tax/contract law' },
  { dataType: 'Payment Records', retention: '7 years', justification: 'Financial compliance' },
  { dataType: 'Safety Incidents', retention: '10 years', justification: 'HSE/regulatory' },
  { dataType: 'Marketing Consent', retention: 'Until withdrawn + 2 years', justification: 'Best practice' },
  { dataType: 'Anonymized Analytics', retention: 'Indefinite', justification: 'AI improvement' },
  { dataType: 'Closed Accounts', retention: '7 years', justification: 'Legal obligations' },
  { dataType: 'AI Interactions', retention: '2 years', justification: 'Service improvement' },
];

export const SUB_PROCESSORS = [
  { service: 'Stripe', purpose: 'Payment processing', location: 'US/EU', dataProcessed: 'Payment data', dpaInPlace: true },
  { service: 'Supabase', purpose: 'Database & Auth', location: 'EU/US', dataProcessed: 'All user data', dpaInPlace: true },
  { service: 'Google (Gemini)', purpose: 'AI processing', location: 'US', dataProcessed: 'Project descriptions, images', dpaInPlace: true },
  { service: 'PostHog', purpose: 'Analytics', location: 'EU', dataProcessed: 'Usage data', dpaInPlace: true },
  { service: 'Resend', purpose: 'Email notifications', location: 'US', dataProcessed: 'Email addresses', dpaInPlace: true },
  { service: 'Mapbox', purpose: 'Maps & routing', location: 'US', dataProcessed: 'Location data', dpaInPlace: true },
];

export const COOKIE_CATEGORIES = {
  essential: {
    name: 'Essential',
    description: 'Required for the website to function. Cannot be disabled.',
    required: true,
    cookies: [
      { name: 'sb-*-auth-token', purpose: 'Authentication session', duration: 'Session', provider: 'Supabase' },
      { name: 'consent', purpose: 'Records cookie preferences', duration: '1 year', provider: 'LoopFactory AI' },
      { name: 'region', purpose: 'Stores region preference', duration: '1 year', provider: 'LoopFactory AI' },
    ],
  },
  functional: {
    name: 'Functional',
    description: 'Remember your preferences and settings.',
    required: false,
    cookies: [
      { name: 'theme', purpose: 'Dark/light mode preference', duration: '1 year', provider: 'LoopFactory AI' },
      { name: 'language', purpose: 'Language preference', duration: '1 year', provider: 'LoopFactory AI' },
      { name: 'recent-*', purpose: 'Recently viewed items', duration: '30 days', provider: 'LoopFactory AI' },
    ],
  },
  analytics: {
    name: 'Analytics',
    description: 'Help us understand how visitors use our site.',
    required: false,
    cookies: [
      { name: 'ph_*', purpose: 'Usage analytics', duration: '1 year', provider: 'PostHog' },
      { name: '_ga*', purpose: 'Google Analytics (if enabled)', duration: '2 years', provider: 'Google' },
    ],
  },
  marketing: {
    name: 'Marketing',
    description: 'Used for targeted advertising and remarketing.',
    required: false,
    cookies: [
      { name: '_fbp', purpose: 'Facebook Pixel (if enabled)', duration: '90 days', provider: 'Meta' },
      { name: '_gcl_*', purpose: 'Google Ads conversion', duration: '90 days', provider: 'Google' },
    ],
  },
};

export function getLegalEntityForRegion(countryCode: string): LegalEntity {
  // Map country codes to legal entities
  const regionMap: Record<string, string> = {
    GB: 'UK', UK: 'UK',
    US: 'US',
    IE: 'EU', DE: 'EU', FR: 'EU', ES: 'EU', IT: 'EU', NL: 'EU', BE: 'EU', AT: 'EU', PT: 'EU', PL: 'EU',
    AU: 'AU',
    CA: 'CA',
  };
  
  const entityKey = regionMap[countryCode] || 'UK';
  return REGIONAL_LEGAL_ENTITIES[entityKey];
}

export function formatLegalDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
