// Regional terminology mappings for global localization
// Maps UK-centric terms to region-specific equivalents

export interface TerminologyMapping {
  muckAway: string;
  grabHire: string;
  skip: string;
  tonnes: string;
  cubicMetres: string;
  postcode: string;
  wasteTransferNote: string;
  landfillTax: string;
  disposalLevy: string;
  lorry: string;
  tipper: string;
  spoil: string;
}

export const REGIONAL_TERMINOLOGY: Record<string, TerminologyMapping> = {
  // UK - Default terminology
  UK: {
    muckAway: 'Muck Away',
    grabHire: 'Grab Hire',
    skip: 'Skip',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'Postcode',
    wasteTransferNote: 'Waste Transfer Note',
    landfillTax: 'Landfill Tax',
    disposalLevy: 'Disposal Levy',
    lorry: 'Lorry',
    tipper: 'Tipper',
    spoil: 'Spoil',
  },
  GB: {
    muckAway: 'Muck Away',
    grabHire: 'Grab Hire',
    skip: 'Skip',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'Postcode',
    wasteTransferNote: 'Waste Transfer Note',
    landfillTax: 'Landfill Tax',
    disposalLevy: 'Disposal Levy',
    lorry: 'Lorry',
    tipper: 'Tipper',
    spoil: 'Spoil',
  },
  // USA - American terminology
  US: {
    muckAway: 'Waste Removal',
    grabHire: 'Dumpster Rental',
    skip: 'Roll-off Container',
    tonnes: 'Tons',
    cubicMetres: 'Cubic Yards',
    postcode: 'Zip Code',
    wasteTransferNote: 'EPA Manifest',
    landfillTax: 'Disposal Fee',
    disposalLevy: 'Tipping Fee',
    lorry: 'Truck',
    tipper: 'Dump Truck',
    spoil: 'Waste Material',
  },
  USA: {
    muckAway: 'Waste Removal',
    grabHire: 'Dumpster Rental',
    skip: 'Roll-off Container',
    tonnes: 'Tons',
    cubicMetres: 'Cubic Yards',
    postcode: 'Zip Code',
    wasteTransferNote: 'EPA Manifest',
    landfillTax: 'Disposal Fee',
    disposalLevy: 'Tipping Fee',
    lorry: 'Truck',
    tipper: 'Dump Truck',
    spoil: 'Waste Material',
  },
  // Germany - German terminology (used with German language)
  DE: {
    muckAway: 'Bauschutt Entsorgen',
    grabHire: 'Container Mieten',
    skip: 'Schuttcontainer',
    tonnes: 'Tonnen',
    cubicMetres: 'Kubikmeter',
    postcode: 'Postleitzahl',
    wasteTransferNote: 'Entsorgungsnachweis',
    landfillTax: 'Deponiesteuer',
    disposalLevy: 'Entsorgungsgebühr',
    lorry: 'LKW',
    tipper: 'Kipper',
    spoil: 'Aushub',
  },
  // Australia - Australian terminology
  AU: {
    muckAway: 'Waste Removal',
    grabHire: 'Skip Bin Hire',
    skip: 'Skip Bin',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'Postcode',
    wasteTransferNote: 'Waste Tracking Certificate',
    landfillTax: 'Landfill Levy',
    disposalLevy: 'Waste Levy',
    lorry: 'Truck',
    tipper: 'Tipper Truck',
    spoil: 'Spoil',
  },
  // Singapore
  SG: {
    muckAway: 'Waste Disposal',
    grabHire: 'Waste Collection',
    skip: 'Industrial Bin',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'Postal Code',
    wasteTransferNote: 'NEA Waste Permit',
    landfillTax: 'Disposal Fee',
    disposalLevy: 'NEA Levy',
    lorry: 'Truck',
    tipper: 'Tipper',
    spoil: 'Construction Waste',
  },
  // Brazil
  BR: {
    muckAway: 'Remoção de Entulho',
    grabHire: 'Aluguel de Caçamba',
    skip: 'Caçamba',
    tonnes: 'Toneladas',
    cubicMetres: 'Metros Cúbicos',
    postcode: 'CEP',
    wasteTransferNote: 'MTR',
    landfillTax: 'Taxa de Descarte',
    disposalLevy: 'Taxa Ambiental',
    lorry: 'Caminhão',
    tipper: 'Basculante',
    spoil: 'Entulho',
  },
  // UAE
  AE: {
    muckAway: 'Waste Removal',
    grabHire: 'Skip Hire',
    skip: 'Skip',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'PO Box',
    wasteTransferNote: 'Municipality Permit',
    landfillTax: 'Municipality Fee',
    disposalLevy: 'Disposal Fee',
    lorry: 'Truck',
    tipper: 'Tipper',
    spoil: 'Construction Waste',
  },
  // South Africa
  ZA: {
    muckAway: 'Rubble Removal',
    grabHire: 'Skip Hire',
    skip: 'Skip',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'Postal Code',
    wasteTransferNote: 'Waste Manifest',
    landfillTax: 'Landfill Levy',
    disposalLevy: 'Disposal Levy',
    lorry: 'Truck',
    tipper: 'Tipper',
    spoil: 'Rubble',
  },
  // India
  IN: {
    muckAway: 'Debris Removal',
    grabHire: 'Waste Collection',
    skip: 'Debris Container',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'PIN Code',
    wasteTransferNote: 'Waste Manifest',
    landfillTax: 'Municipal Tax',
    disposalLevy: 'Disposal Fee',
    lorry: 'Truck',
    tipper: 'Tipper',
    spoil: 'Debris',
  },
  // Canada
  CA: {
    muckAway: 'Waste Removal',
    grabHire: 'Bin Rental',
    skip: 'Roll-off Bin',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'Postal Code',
    wasteTransferNote: 'Waste Manifest',
    landfillTax: 'Tipping Fee',
    disposalLevy: 'Disposal Fee',
    lorry: 'Truck',
    tipper: 'Dump Truck',
    spoil: 'Spoil',
  },
  // France
  FR: {
    muckAway: 'Évacuation de Déblais',
    grabHire: 'Location de Benne',
    skip: 'Benne',
    tonnes: 'Tonnes',
    cubicMetres: 'Mètres Cubes',
    postcode: 'Code Postal',
    wasteTransferNote: 'BSD',
    landfillTax: 'TGAP',
    disposalLevy: 'Taxe Déchets',
    lorry: 'Camion',
    tipper: 'Benne Basculante',
    spoil: 'Déblais',
  },
  // Spain
  ES: {
    muckAway: 'Retirada de Escombros',
    grabHire: 'Alquiler de Contenedor',
    skip: 'Contenedor',
    tonnes: 'Toneladas',
    cubicMetres: 'Metros Cúbicos',
    postcode: 'Código Postal',
    wasteTransferNote: 'Documento de Control',
    landfillTax: 'Canon de Vertido',
    disposalLevy: 'Tasa de Residuos',
    lorry: 'Camión',
    tipper: 'Volquete',
    spoil: 'Escombros',
  },
  // New Zealand
  NZ: {
    muckAway: 'Waste Removal',
    grabHire: 'Skip Bin Hire',
    skip: 'Skip Bin',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'Postcode',
    wasteTransferNote: 'Waste Tracking Form',
    landfillTax: 'Waste Minimisation Levy',
    disposalLevy: 'Disposal Levy',
    lorry: 'Truck',
    tipper: 'Tipper Truck',
    spoil: 'Spoil',
  },
  // Southeast Asia - Malaysia
  MY: {
    muckAway: 'Waste Disposal',
    grabHire: 'Skip Bin Rental',
    skip: 'RORO Bin',
    tonnes: 'Tonnes',
    cubicMetres: 'Cubic Metres',
    postcode: 'Postcode',
    wasteTransferNote: 'DOE Waste Manifest',
    landfillTax: 'Disposal Fee',
    disposalLevy: 'Environmental Levy',
    lorry: 'Lori',
    tipper: 'Tipper Truck',
    spoil: 'Construction Waste',
  },
  // Southeast Asia - Indonesia
  ID: {
    muckAway: 'Pembuangan Limbah',
    grabHire: 'Sewa Kontainer',
    skip: 'Kontainer Limbah',
    tonnes: 'Ton',
    cubicMetres: 'Meter Kubik',
    postcode: 'Kode Pos',
    wasteTransferNote: 'Manifes B3',
    landfillTax: 'Retribusi TPA',
    disposalLevy: 'Biaya Lingkungan',
    lorry: 'Truk',
    tipper: 'Dump Truck',
    spoil: 'Limbah Konstruksi',
  },
  // Southeast Asia - Philippines
  PH: {
    muckAway: 'Waste Hauling',
    grabHire: 'Dumpster Rental',
    skip: 'Roll-off Container',
    tonnes: 'Metric Tons',
    cubicMetres: 'Cubic Meters',
    postcode: 'ZIP Code',
    wasteTransferNote: 'EMB Manifest',
    landfillTax: 'Tipping Fee',
    disposalLevy: 'LGU Levy',
    lorry: 'Truck',
    tipper: 'Dump Truck',
    spoil: 'Debris',
  },
  // Southeast Asia - Thailand
  TH: {
    muckAway: 'การกำจัดขยะ',
    grabHire: 'เช่าถังขยะ',
    skip: 'ถังขยะอุตสาหกรรม',
    tonnes: 'ตัน',
    cubicMetres: 'ลูกบาศก์เมตร',
    postcode: 'รหัสไปรษณีย์',
    wasteTransferNote: 'ใบกำกับการขนส่ง',
    landfillTax: 'ค่าฝังกลบ',
    disposalLevy: 'ค่าธรรมเนียม',
    lorry: 'รถบรรทุก',
    tipper: 'รถดัมพ์',
    spoil: 'เศษก่อสร้าง',
  },
  // Southeast Asia - Vietnam
  VN: {
    muckAway: 'Thu Gom Chất Thải',
    grabHire: 'Thuê Thùng Rác',
    skip: 'Thùng Chứa Công Nghiệp',
    tonnes: 'Tấn',
    cubicMetres: 'Mét Khối',
    postcode: 'Mã Bưu Điện',
    wasteTransferNote: 'Chứng Từ Vận Chuyển',
    landfillTax: 'Phí Chôn Lấp',
    disposalLevy: 'Phí Môi Trường',
    lorry: 'Xe Tải',
    tipper: 'Xe Ben',
    spoil: 'Phế Thải Xây Dựng',
  },
  // Saudi Arabia
  SA: {
    muckAway: 'إزالة النفايات',
    grabHire: 'تأجير الحاويات',
    skip: 'حاوية',
    tonnes: 'طن',
    cubicMetres: 'متر مكعب',
    postcode: 'الرمز البريدي',
    wasteTransferNote: 'إذن النقل',
    landfillTax: 'رسوم التخلص',
    disposalLevy: 'رسوم البلدية',
    lorry: 'شاحنة',
    tipper: 'قلاب',
    spoil: 'مخلفات البناء',
  },
};

// Get terminology for a specific country
export const getRegionalTerminology = (countryCode: string): TerminologyMapping => {
  const upperCode = countryCode?.toUpperCase() || 'UK';
  return REGIONAL_TERMINOLOGY[upperCode] || REGIONAL_TERMINOLOGY['UK'];
};

// Get a specific term for a country
export const getTerm = (countryCode: string, term: keyof TerminologyMapping): string => {
  const terminology = getRegionalTerminology(countryCode);
  return terminology[term];
};
