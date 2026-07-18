export interface Regulation {
  name: string;
  description: string;
  badge?: string;
  mandatory?: boolean;
}

export interface TaxRate {
  rate: number;
  currency: string;
  label: string;
  unit?: string;
}

export interface RegionalCompliance {
  name: string;
  code: string;
  flag: string;
  regulations: Regulation[];
  taxRates: Record<string, TaxRate>;
  ewcCodes?: boolean;
  stateVariations?: boolean;
  regions: string[];
  emergencyNumber: string;
  regulatoryBody: string;
  regulatoryUrl: string;
}

export const REGIONAL_COMPLIANCE: Record<string, RegionalCompliance> = {
  UK: {
    name: "United Kingdom",
    code: "UK",
    flag: "🇬🇧",
    regulations: [
      { name: "Digital Waste Tracking (DWT)", description: "DEFRA mandate for digital waste tracking across England", badge: "Mandatory 2025", mandatory: true },
      { name: "Waste Transfer Notes (WTN)", description: "Legal document required for all non-hazardous waste transfers", mandatory: true },
      { name: "Hazardous Consignment Notes", description: "Required documentation for hazardous waste movements", mandatory: true },
      { name: "Duty of Care", description: "Legal responsibility to ensure waste is handled correctly", mandatory: true },
      { name: "EWC Codes", description: "European Waste Catalogue classification system", mandatory: true },
    ],
    taxRates: {
      standard: { rate: 103.70, currency: "GBP", label: "Standard Rate (2024/25)", unit: "per tonne" },
      lower: { rate: 3.25, currency: "GBP", label: "Lower Rate (Inert)", unit: "per tonne" }
    },
    ewcCodes: true,
    regions: ["England", "Wales", "Scotland", "Northern Ireland"],
    emergencyNumber: "0800 80 70 60",
    regulatoryBody: "Environment Agency",
    regulatoryUrl: "https://www.gov.uk/government/organisations/environment-agency"
  },
  US: {
    name: "United States",
    code: "US",
    flag: "🇺🇸",
    regulations: [
      { name: "RCRA Compliance", description: "Resource Conservation and Recovery Act - federal hazardous waste law", mandatory: true },
      { name: "EPA Hazardous Waste Manifest", description: "Federal tracking system for hazardous waste shipments", mandatory: true },
      { name: "DOT Hazmat Requirements", description: "Department of Transportation hazardous materials regulations", mandatory: true },
      { name: "State Environmental Permits", description: "State-specific disposal and transport permits required", mandatory: true },
      { name: "OSHA Safety Standards", description: "Occupational safety requirements for waste handling", mandatory: true },
    ],
    taxRates: {
      federal: { rate: 0, currency: "USD", label: "Federal (No federal tax)", unit: "varies by state" },
      california: { rate: 8.75, currency: "USD", label: "California Disposal Fee", unit: "per ton" },
      newYork: { rate: 5.00, currency: "USD", label: "New York Surcharge", unit: "per ton" }
    },
    stateVariations: true,
    regions: ["California", "Texas", "Florida", "New York", "All 50 States"],
    emergencyNumber: "1-800-424-8802",
    regulatoryBody: "EPA",
    regulatoryUrl: "https://www.epa.gov/rcra"
  },
  AU: {
    name: "Australia",
    code: "AU",
    flag: "🇦🇺",
    regulations: [
      { name: "National Waste Policy", description: "Australia's framework for waste management and resource recovery", mandatory: true },
      { name: "State EPA Licensing", description: "Environmental Protection Authority permits for waste transport", mandatory: true },
      { name: "Waste Tracking System", description: "State-based electronic waste tracking requirements", mandatory: true },
      { name: "Chain of Responsibility", description: "Shared legal duty for safe transport of heavy vehicles", mandatory: true },
      { name: "National Environment Protection", description: "NEPM standards for contaminated site assessment", mandatory: true },
    ],
    taxRates: {
      nsw: { rate: 156.90, currency: "AUD", label: "NSW Waste Levy (Metro)", unit: "per tonne" },
      vic: { rate: 125.90, currency: "AUD", label: "Victoria Levy", unit: "per tonne" },
      qld: { rate: 90.00, currency: "AUD", label: "Queensland Levy", unit: "per tonne" },
      sa: { rate: 152.00, currency: "AUD", label: "South Australia Levy", unit: "per tonne" }
    },
    regions: ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania"],
    emergencyNumber: "1300 130 372",
    regulatoryBody: "State EPAs",
    regulatoryUrl: "https://www.dcceew.gov.au/environment/protection/waste"
  },
  CA: {
    name: "Canada",
    code: "CA",
    flag: "🇨🇦",
    regulations: [
      { name: "CEPA Compliance", description: "Canadian Environmental Protection Act requirements", mandatory: true },
      { name: "TDG Regulations", description: "Transportation of Dangerous Goods for hazardous waste", mandatory: true },
      { name: "Provincial Waste Manifests", description: "Province-specific tracking documentation", mandatory: true },
      { name: "Generator Registration", description: "Registration required for hazardous waste generators", mandatory: true },
      { name: "Carbon Tax Reporting", description: "Federal carbon pricing system compliance", mandatory: true },
    ],
    taxRates: {
      ontario: { rate: 13.50, currency: "CAD", label: "Ontario Tipping Fee (avg)", unit: "per tonne" },
      bc: { rate: 65.00, currency: "CAD", label: "BC Carbon Tax", unit: "per tonne CO2e" },
      alberta: { rate: 45.00, currency: "CAD", label: "Alberta Carbon Levy", unit: "per tonne CO2e" }
    },
    regions: ["Ontario", "British Columbia", "Alberta", "Quebec", "Manitoba", "Saskatchewan"],
    emergencyNumber: "1-800-567-1111",
    regulatoryBody: "Environment Canada",
    regulatoryUrl: "https://www.canada.ca/en/environment-climate-change.html"
  },
  NZ: {
    name: "New Zealand",
    code: "NZ",
    flag: "🇳🇿",
    regulations: [
      { name: "Waste Minimisation Act", description: "National framework for reducing waste to landfill", mandatory: true },
      { name: "RMA Consents", description: "Resource Management Act consents for disposal activities", mandatory: true },
      { name: "Hazardous Substances", description: "HSNO Act requirements for dangerous goods", mandatory: true },
      { name: "Regional Council Rules", description: "Local authority waste management bylaws", mandatory: true },
      { name: "Emissions Trading Scheme", description: "NZ ETS obligations for landfill operators", mandatory: true },
    ],
    taxRates: {
      national: { rate: 60.00, currency: "NZD", label: "Waste Disposal Levy", unit: "per tonne" },
      auckland: { rate: 10.00, currency: "NZD", label: "Auckland Regional Levy", unit: "per tonne" }
    },
    regions: ["Auckland", "Wellington", "Canterbury", "Otago", "Waikato", "Bay of Plenty"],
    emergencyNumber: "0800 764 766",
    regulatoryBody: "Ministry for the Environment",
    regulatoryUrl: "https://environment.govt.nz/what-government-is-doing/areas-of-work/waste/"
  },
  EU: {
    name: "European Union",
    code: "EU",
    flag: "🇪🇺",
    regulations: [
      { name: "Waste Framework Directive", description: "EU-wide waste management and prevention requirements", mandatory: true },
      { name: "Waste Shipment Regulation", description: "Rules for cross-border movement of waste", mandatory: true },
      { name: "Landfill Directive", description: "Standards for landfill operations and acceptance", mandatory: true },
      { name: "REACH Compliance", description: "Chemical substances registration and restrictions", mandatory: true },
      { name: "Circular Economy Package", description: "Recycling targets and extended producer responsibility", mandatory: true },
    ],
    taxRates: {
      germany: { rate: 25.00, currency: "EUR", label: "Germany Landfill Tax", unit: "per tonne" },
      france: { rate: 54.00, currency: "EUR", label: "France TGAP", unit: "per tonne" },
      netherlands: { rate: 33.58, currency: "EUR", label: "Netherlands Tax", unit: "per tonne" }
    },
    regions: ["Germany", "France", "Netherlands", "Belgium", "Ireland", "Spain", "Italy"],
    emergencyNumber: "112",
    regulatoryBody: "European Environment Agency",
    regulatoryUrl: "https://www.eea.europa.eu/themes/waste"
  },
  BR: {
    name: "Brazil",
    code: "BR",
    flag: "🇧🇷",
    regulations: [
      { name: "IBAMA Licensing", description: "Federal environmental licensing for waste activities", mandatory: true },
      { name: "CONAMA Resolutions", description: "National Environment Council waste classification standards", mandatory: true },
      { name: "Solid Waste Policy", description: "National Solid Waste Policy (PNRS) requirements", mandatory: true },
      { name: "State Environmental Permits", description: "CETESB and state-level environmental permits", mandatory: true },
      { name: "Waste Manifest (MTR)", description: "Waste Transport Manifest documentation", mandatory: true },
    ],
    taxRates: {
      saopaulo: { rate: 45.00, currency: "BRL", label: "São Paulo Disposal Fee", unit: "per tonne" },
      riodejaneiro: { rate: 38.00, currency: "BRL", label: "Rio de Janeiro Fee", unit: "per tonne" }
    },
    regions: ["São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia", "Paraná"],
    emergencyNumber: "0800-61-8080",
    regulatoryBody: "IBAMA",
    regulatoryUrl: "https://www.ibama.gov.br/"
  },
  IN: {
    name: "India",
    code: "IN",
    flag: "🇮🇳",
    regulations: [
      { name: "CPCB Guidelines", description: "Central Pollution Control Board waste management rules", mandatory: true },
      { name: "C&D Waste Rules", description: "Construction and Demolition Waste Management Rules 2016", mandatory: true },
      { name: "State PCB Consent", description: "State Pollution Control Board authorization", mandatory: true },
      { name: "E-Waste Rules", description: "Electronic waste handling requirements", mandatory: true },
      { name: "Hazardous Waste Rules", description: "Hazardous and Other Wastes Management Rules", mandatory: true },
    ],
    taxRates: {
      national: { rate: 500, currency: "INR", label: "Average Tipping Fee", unit: "per tonne" },
      delhi: { rate: 750, currency: "INR", label: "Delhi Region Fee", unit: "per tonne" }
    },
    regions: ["Maharashtra", "Delhi NCR", "Karnataka", "Tamil Nadu", "Gujarat", "West Bengal"],
    emergencyNumber: "1800-180-4962",
    regulatoryBody: "CPCB",
    regulatoryUrl: "https://cpcb.nic.in/"
  },
  SG: {
    name: "Singapore",
    code: "SG",
    flag: "🇸🇬",
    regulations: [
      { name: "NEA Licensing", description: "National Environment Agency waste collector license", mandatory: true },
      { name: "Environmental Protection", description: "Environmental Protection and Management Act", mandatory: true },
      { name: "Hazardous Waste Control", description: "Hazardous Waste Control Act requirements", mandatory: true },
      { name: "Resource Sustainability", description: "Resource Sustainability Act compliance", mandatory: true },
    ],
    taxRates: {
      national: { rate: 77.00, currency: "SGD", label: "Disposal Fee (Incinerable)", unit: "per tonne" },
      landfill: { rate: 90.00, currency: "SGD", label: "Non-Incinerable Waste", unit: "per tonne" }
    },
    regions: ["Central", "East", "West", "North", "North-East"],
    emergencyNumber: "1800-225-5632",
    regulatoryBody: "NEA",
    regulatoryUrl: "https://www.nea.gov.sg/"
  },
  AE: {
    name: "United Arab Emirates",
    code: "AE",
    flag: "🇦🇪",
    regulations: [
      { name: "Federal Environment Law", description: "Federal Law No. 24 of 1999 environmental requirements", mandatory: true },
      { name: "Tadweer Regulations", description: "Abu Dhabi Waste Management Center requirements", mandatory: true },
      { name: "Dubai Municipality", description: "Dubai waste management regulations", mandatory: true },
      { name: "Estidama", description: "Abu Dhabi sustainability requirements", mandatory: true },
    ],
    taxRates: {
      dubai: { rate: 150, currency: "AED", label: "Dubai Disposal Fee", unit: "per tonne" },
      abudhabi: { rate: 120, currency: "AED", label: "Abu Dhabi Fee", unit: "per tonne" }
    },
    regions: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
    emergencyNumber: "800-4357",
    regulatoryBody: "Ministry of Climate Change",
    regulatoryUrl: "https://www.moccae.gov.ae/"
  },
  ZA: {
    name: "South Africa",
    code: "ZA",
    flag: "🇿🇦",
    regulations: [
      { name: "NEMA Compliance", description: "National Environmental Management Act requirements", mandatory: true },
      { name: "NEM:WA", description: "National Environmental Management: Waste Act 2008", mandatory: true },
      { name: "Provincial Licensing", description: "Provincial environmental authorization", mandatory: true },
      { name: "Waste Classification", description: "National Waste Classification and Management Regulations", mandatory: true },
    ],
    taxRates: {
      gauteng: { rate: 350, currency: "ZAR", label: "Gauteng Disposal Fee", unit: "per tonne" },
      westerncape: { rate: 320, currency: "ZAR", label: "Western Cape Fee", unit: "per tonne" }
    },
    regions: ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Free State"],
    emergencyNumber: "0800-200-200",
    regulatoryBody: "DFFE",
    regulatoryUrl: "https://www.dffe.gov.za/"
  },
  CN: {
    name: "China",
    code: "CN",
    flag: "🇨🇳",
    regulations: [
      { name: "Solid Waste Law", description: "Law of PRC on Prevention and Control of Environmental Pollution by Solid Waste", mandatory: true },
      { name: "Construction Waste Regulations", description: "Ministry of Housing urban construction waste management rules", mandatory: true },
      { name: "Environmental Impact Assessment", description: "EIA approval required for waste disposal facilities", mandatory: true },
      { name: "Hazardous Waste Manifest", description: "Five-copy manifest system for hazardous waste transport", mandatory: true },
      { name: "Provincial EPA Permits", description: "Provincial Environmental Protection Bureau licensing", mandatory: true },
    ],
    taxRates: {
      beijing: { rate: 120, currency: "CNY", label: "Beijing Disposal Fee", unit: "per tonne" },
      shanghai: { rate: 100, currency: "CNY", label: "Shanghai Fee", unit: "per tonne" },
      guangdong: { rate: 80, currency: "CNY", label: "Guangdong Fee", unit: "per tonne" }
    },
    regions: ["Beijing", "Shanghai", "Guangdong", "Zhejiang", "Jiangsu", "Sichuan"],
    emergencyNumber: "12369",
    regulatoryBody: "Ministry of Ecology and Environment",
    regulatoryUrl: "https://www.mee.gov.cn/"
  },
  MX: {
    name: "Mexico",
    code: "MX",
    flag: "🇲🇽",
    regulations: [
      { name: "LGPGIR Compliance", description: "General Law for Prevention and Integral Management of Waste", mandatory: true },
      { name: "NOM Standards", description: "Official Mexican Standards for waste classification and handling", mandatory: true },
      { name: "SEMARNAT Authorization", description: "Federal environmental authority permits for waste transport", mandatory: true },
      { name: "Hazardous Waste Manifest", description: "Manifesto de Entrega, Transporte y Recepción", mandatory: true },
      { name: "State Environmental License", description: "State-level environmental impact authorization", mandatory: true },
    ],
    taxRates: {
      federal: { rate: 450, currency: "MXN", label: "Average Disposal Fee", unit: "per tonne" },
      cdmx: { rate: 550, currency: "MXN", label: "Mexico City Fee", unit: "per tonne" },
      jalisco: { rate: 400, currency: "MXN", label: "Jalisco Fee", unit: "per tonne" }
    },
    regions: ["Mexico City", "Jalisco", "Nuevo León", "State of Mexico", "Querétaro", "Guanajuato"],
    emergencyNumber: "800-0025-464",
    regulatoryBody: "SEMARNAT",
    regulatoryUrl: "https://www.gob.mx/semarnat"
  },
  JP: {
    name: "Japan",
    code: "JP",
    flag: "🇯🇵",
    regulations: [
      { name: "Waste Management Law", description: "Waste Disposal and Public Cleansing Law requirements", mandatory: true },
      { name: "Industrial Waste Manifest", description: "7-copy manifest system for industrial waste tracking", mandatory: true },
      { name: "Construction Recycling Law", description: "Mandatory recycling of construction materials", mandatory: true },
      { name: "Prefectural Permits", description: "Governor's permit for waste collection and transport", mandatory: true },
      { name: "PCB Special Measures", description: "Special handling requirements for PCB-containing waste", mandatory: true },
    ],
    taxRates: {
      tokyo: { rate: 8500, currency: "JPY", label: "Tokyo Disposal Fee", unit: "per tonne" },
      osaka: { rate: 7500, currency: "JPY", label: "Osaka Fee", unit: "per tonne" },
      national: { rate: 6000, currency: "JPY", label: "National Average", unit: "per tonne" }
    },
    regions: ["Tokyo", "Osaka", "Kanagawa", "Aichi", "Fukuoka", "Hokkaido"],
    emergencyNumber: "0120-007-111",
    regulatoryBody: "Ministry of the Environment",
    regulatoryUrl: "https://www.env.go.jp/"
  },
  // Southeast Asia - Malaysia
  MY: {
    name: "Malaysia",
    code: "MY",
    flag: "🇲🇾",
    regulations: [
      { name: "Environmental Quality Act", description: "EQA 1974 governs waste management and pollution control", mandatory: true },
      { name: "Scheduled Waste Regulations", description: "Environmental Quality (Scheduled Wastes) Regulations 2005", mandatory: true },
      { name: "DOE Licensing", description: "Department of Environment approval for waste handling", mandatory: true },
      { name: "Construction Industry Development Board", description: "CIDB compliance for construction waste", mandatory: true },
      { name: "Local Authority Permits", description: "Municipal council permits for waste transport", mandatory: true },
    ],
    taxRates: {
      peninsular: { rate: 35, currency: "MYR", label: "Peninsular Disposal Fee", unit: "per tonne" },
      sabah: { rate: 30, currency: "MYR", label: "Sabah/Sarawak Fee", unit: "per tonne" }
    },
    regions: ["Kuala Lumpur", "Selangor", "Johor", "Penang", "Sabah", "Sarawak"],
    emergencyNumber: "1-800-88-2727",
    regulatoryBody: "Department of Environment",
    regulatoryUrl: "https://www.doe.gov.my/"
  },
  // Southeast Asia - Indonesia
  ID: {
    name: "Indonesia",
    code: "ID",
    flag: "🇮🇩",
    regulations: [
      { name: "PP 22/2021 Environmental Protection", description: "Government regulation on environmental protection and management", mandatory: true },
      { name: "B3 Waste Management", description: "Hazardous and toxic waste handling requirements", mandatory: true },
      { name: "AMDAL Requirements", description: "Environmental Impact Assessment for large projects", mandatory: true },
      { name: "Ministry of Environment Permits", description: "KLHK licensing for waste transport and disposal", mandatory: true },
      { name: "Regional Environmental Agency", description: "DLH provincial permits and monitoring", mandatory: true },
    ],
    taxRates: {
      jakarta: { rate: 150000, currency: "IDR", label: "Jakarta Disposal Fee", unit: "per tonne" },
      surabaya: { rate: 120000, currency: "IDR", label: "Surabaya Fee", unit: "per tonne" },
      bali: { rate: 175000, currency: "IDR", label: "Bali Levy", unit: "per tonne" }
    },
    regions: ["Jakarta", "Surabaya", "Bandung", "Bali", "Medan", "Makassar"],
    emergencyNumber: "112",
    regulatoryBody: "Ministry of Environment & Forestry",
    regulatoryUrl: "https://www.menlhk.go.id/"
  },
  // Southeast Asia - Philippines
  PH: {
    name: "Philippines",
    code: "PH",
    flag: "🇵🇭",
    regulations: [
      { name: "RA 9003 Ecological Solid Waste", description: "Republic Act 9003 - Ecological Solid Waste Management Act", mandatory: true },
      { name: "RA 6969 Toxic Substances", description: "Toxic Substances and Hazardous Waste Control Act", mandatory: true },
      { name: "DENR Permits", description: "Department of Environment and Natural Resources licensing", mandatory: true },
      { name: "EMB Registration", description: "Environmental Management Bureau TSD registration", mandatory: true },
      { name: "LGU Franchise", description: "Local Government Unit waste collection franchise", mandatory: true },
    ],
    taxRates: {
      metromanila: { rate: 1500, currency: "PHP", label: "Metro Manila Disposal Fee", unit: "per tonne" },
      provincial: { rate: 1000, currency: "PHP", label: "Provincial Rate", unit: "per tonne" }
    },
    regions: ["Metro Manila", "Cebu", "Davao", "Pampanga", "Laguna", "Cavite"],
    emergencyNumber: "8888",
    regulatoryBody: "DENR-EMB",
    regulatoryUrl: "https://emb.gov.ph/"
  },
  // Southeast Asia - Thailand
  TH: {
    name: "Thailand",
    code: "TH",
    flag: "🇹🇭",
    regulations: [
      { name: "Enhancement and Conservation of Environmental Quality Act", description: "Primary environmental law governing waste management", mandatory: true },
      { name: "Factory Act B.E. 2535", description: "Industrial waste disposal requirements", mandatory: true },
      { name: "DIW Licensing", description: "Department of Industrial Works hazardous waste permits", mandatory: true },
      { name: "PCD Registration", description: "Pollution Control Department transporter registration", mandatory: true },
      { name: "BMA Regulations", description: "Bangkok Metropolitan Administration waste rules", mandatory: true },
    ],
    taxRates: {
      bangkok: { rate: 800, currency: "THB", label: "Bangkok Disposal Fee", unit: "per tonne" },
      eec: { rate: 650, currency: "THB", label: "EEC (Chonburi) Fee", unit: "per tonne" },
      provincial: { rate: 500, currency: "THB", label: "Provincial Average", unit: "per tonne" }
    },
    regions: ["Bangkok", "Chonburi", "Rayong", "Chiang Mai", "Phuket", "Nakhon Ratchasima"],
    emergencyNumber: "1650",
    regulatoryBody: "Pollution Control Department",
    regulatoryUrl: "https://www.pcd.go.th/"
  },
  // Southeast Asia - Vietnam
  VN: {
    name: "Vietnam",
    code: "VN",
    flag: "🇻🇳",
    regulations: [
      { name: "Law on Environmental Protection 2020", description: "Primary environmental legislation including waste management", mandatory: true },
      { name: "Decree 08/2022/ND-CP", description: "Detailed provisions on environmental protection", mandatory: true },
      { name: "MONRE Licensing", description: "Ministry of Natural Resources and Environment permits", mandatory: true },
      { name: "Hazardous Waste Manifest", description: "Tracking documentation for dangerous waste", mandatory: true },
      { name: "Provincial DONRE", description: "Department of Natural Resources provincial oversight", mandatory: true },
    ],
    taxRates: {
      hochiminh: { rate: 350000, currency: "VND", label: "Ho Chi Minh City Fee", unit: "per tonne" },
      hanoi: { rate: 300000, currency: "VND", label: "Hanoi Fee", unit: "per tonne" },
      industrial: { rate: 500000, currency: "VND", label: "Industrial Zone Rate", unit: "per tonne" }
    },
    regions: ["Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Binh Duong", "Dong Nai"],
    emergencyNumber: "113",
    regulatoryBody: "MONRE",
    regulatoryUrl: "https://www.monre.gov.vn/"
  },
  // Saudi Arabia
  SA: {
    name: "Saudi Arabia",
    code: "SA",
    flag: "🇸🇦",
    regulations: [
      { name: "NCEC Environmental Compliance", description: "National Center for Environmental Compliance requirements", mandatory: true },
      { name: "MEWA Waste Regulations", description: "Ministry of Environment, Water and Agriculture waste rules", mandatory: true },
      { name: "Saudi Building Code", description: "Construction and demolition waste requirements", mandatory: true },
      { name: "MODON Industrial Regulations", description: "Saudi Industrial Property Authority waste management", mandatory: true },
      { name: "Municipality Permits", description: "Regional municipality waste transport licenses", mandatory: true },
    ],
    taxRates: {
      riyadh: { rate: 120, currency: "SAR", label: "Riyadh Disposal Fee", unit: "per tonne" },
      jeddah: { rate: 100, currency: "SAR", label: "Jeddah Fee", unit: "per tonne" },
      dammam: { rate: 90, currency: "SAR", label: "Eastern Province Fee", unit: "per tonne" }
    },
    regions: ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "NEOM"],
    emergencyNumber: "911",
    regulatoryBody: "MEWA",
    regulatoryUrl: "https://www.mewa.gov.sa/"
  }
};

export const getComplianceForRegion = (countryCode: string): RegionalCompliance => {
  const upperCode = countryCode?.toUpperCase();
  
  const countryToRegion: Record<string, string> = {
    'GB': 'UK', 'UK': 'UK',
    'US': 'US', 'USA': 'US',
    'AU': 'AU', 'AUS': 'AU',
    'CA': 'CA', 'CAN': 'CA',
    'NZ': 'NZ', 'NZL': 'NZ',
    'DE': 'EU', 'FR': 'EU', 'NL': 'EU', 'BE': 'EU', 'IE': 'EU', 'ES': 'EU', 'IT': 'EU', 'AT': 'EU', 'PT': 'EU',
    'BR': 'BR', 'BRA': 'BR',
    'IN': 'IN', 'IND': 'IN',
    'SG': 'SG', 'SGP': 'SG',
    'AE': 'AE', 'ARE': 'AE',
    'ZA': 'ZA', 'ZAF': 'ZA',
    'CN': 'CN', 'CHN': 'CN',
    'MX': 'MX', 'MEX': 'MX',
    'JP': 'JP', 'JPN': 'JP',
    'MY': 'MY', 'MYS': 'MY',
    'ID': 'ID', 'IDN': 'ID',
    'PH': 'PH', 'PHL': 'PH',
    'TH': 'TH', 'THA': 'TH',
    'VN': 'VN', 'VNM': 'VN',
    'SA': 'SA', 'SAU': 'SA',
  };

  const regionCode = countryToRegion[upperCode] || 'UK';
  return REGIONAL_COMPLIANCE[regionCode] || REGIONAL_COMPLIANCE['UK'];
};

export const getSupportedRegions = () => Object.values(REGIONAL_COMPLIANCE);
