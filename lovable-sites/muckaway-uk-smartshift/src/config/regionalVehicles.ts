export interface VehicleType {
  name: string;
  capacity: string;
  description: string;
}

export const REGIONAL_VEHICLES: Record<string, VehicleType[]> = {
  UK: [
    { name: "Grab Lorry", capacity: "8-18 tonnes", description: "Self-loading with hydraulic arm" },
    { name: "Tipper Truck", capacity: "10-20 tonnes", description: "Standard rear-tip hauler" },
    { name: "8-Wheeler", capacity: "16-20 tonnes", description: "Large capacity rigid truck" },
    { name: "Skip Wagon", capacity: "6-12 tonnes", description: "Container transport vehicle" },
    { name: "Muck Wagon", capacity: "14-18 tonnes", description: "Dedicated spoil hauler" },
    { name: "Articulated Tipper", capacity: "25-30 tonnes", description: "High capacity for large sites" },
  ],
  US: [
    { name: "Dump Truck", capacity: "10-25 tons", description: "Standard rear-dump hauler" },
    { name: "End Dump Trailer", capacity: "20-30 tons", description: "Tractor-trailer configuration" },
    { name: "Side Dump Trailer", capacity: "22-35 tons", description: "Side-tipping for narrow access" },
    { name: "Belly Dump", capacity: "18-25 tons", description: "Bottom-discharge trailer" },
    { name: "Roll-Off Truck", capacity: "10-20 tons", description: "Container hauler" },
    { name: "Transfer Dump", capacity: "30-40 tons", description: "Double-trailer high capacity" },
  ],
  AU: [
    { name: "Tipper Truck", capacity: "12-22 tonnes", description: "Standard tipping vehicle" },
    { name: "Side Tipper", capacity: "20-30 tonnes", description: "Side-tipping for access" },
    { name: "Dog Trailer", capacity: "15-20 tonnes", description: "Trailer unit for tipper" },
    { name: "B-Double", capacity: "40-50 tonnes", description: "High capacity combination" },
    { name: "Road Train", capacity: "80-120 tonnes", description: "Multi-trailer for remote areas" },
    { name: "Semi-Tipper", capacity: "25-35 tonnes", description: "Articulated tipping trailer" },
  ],
  CA: [
    { name: "Dump Truck", capacity: "12-25 tonnes", description: "Standard rear-dump vehicle" },
    { name: "Tandem Axle", capacity: "14-18 tonnes", description: "Two-axle dump truck" },
    { name: "Tri-Axle", capacity: "18-24 tonnes", description: "Three-axle for heavy loads" },
    { name: "End Dump Trailer", capacity: "22-30 tonnes", description: "Trailer configuration" },
    { name: "Rock Truck", capacity: "30-40 tonnes", description: "Off-road mining hauler" },
    { name: "Live Bottom", capacity: "20-28 tonnes", description: "Conveyor discharge trailer" },
  ],
  NZ: [
    { name: "Tipper Truck", capacity: "10-20 tonnes", description: "Standard tipping vehicle" },
    { name: "Semi-Trailer", capacity: "25-35 tonnes", description: "Articulated hauler" },
    { name: "Truck and Trailer", capacity: "30-40 tonnes", description: "Rigid with trailer" },
    { name: "Side Tipper", capacity: "18-25 tonnes", description: "Side-discharge vehicle" },
    { name: "Hooklift", capacity: "8-15 tonnes", description: "Container transport" },
  ],
  EU: [
    { name: "Kipplaster", capacity: "12-25 tonnes", description: "Standard tipper (DE)" },
    { name: "Camion Benne", capacity: "15-25 tonnes", description: "Tipping truck (FR)" },
    { name: "Volquete", capacity: "12-22 tonnes", description: "Dump truck (ES)" },
    { name: "Articulated Dumper", capacity: "25-40 tonnes", description: "Off-road hauler" },
    { name: "Walking Floor", capacity: "20-30 tonnes", description: "Conveyor discharge" },
  ],
  BR: [
    { name: "Caminhão Basculante", capacity: "12-25 tonnes", description: "Standard dump truck" },
    { name: "Bi-Trem Basculante", capacity: "40-50 tonnes", description: "Double-trailer tipper" },
    { name: "Carreta Caçamba", capacity: "25-35 tonnes", description: "Semi-trailer tipper" },
    { name: "Truck Fora de Estrada", capacity: "40-100 tonnes", description: "Mining truck" },
  ],
  CN: [
    { name: "自卸车 (Dump Truck)", capacity: "15-30 tonnes", description: "Standard tipper" },
    { name: "矿用卡车 (Mining Truck)", capacity: "50-300 tonnes", description: "Large mining hauler" },
    { name: "半挂自卸 (Semi-Tipper)", capacity: "30-45 tonnes", description: "Articulated tipper" },
  ],
  IN: [
    { name: "Tipper Truck", capacity: "10-25 tonnes", description: "Standard tipping vehicle" },
    { name: "Hyva Tipper", capacity: "16-25 tonnes", description: "Hydraulic tipper" },
    { name: "Trailer Tipper", capacity: "25-40 tonnes", description: "Semi-trailer configuration" },
    { name: "Multi-Axle", capacity: "30-50 tonnes", description: "Heavy-duty hauler" },
  ],
  SG: [
    { name: "Tipper Truck", capacity: "10-20 tonnes", description: "Standard tipping vehicle" },
    { name: "Roll-on/Roll-off", capacity: "15-25 tonnes", description: "Container transport" },
    { name: "Hooklift Truck", capacity: "8-15 tonnes", description: "Interchangeable container system" },
    { name: "Arm Roll Truck", capacity: "12-18 tonnes", description: "Skip loader vehicle" },
    { name: "Rear Loader", capacity: "8-12 tonnes", description: "Compactor truck" },
  ],
  AE: [
    { name: "Tipper Truck", capacity: "15-30 tonnes", description: "Standard tipping vehicle" },
    { name: "Semi-Tipper", capacity: "25-40 tonnes", description: "Articulated hauler" },
    { name: "Dump Truck", capacity: "20-35 tonnes", description: "Rear-dump configuration" },
    { name: "Side Tipper", capacity: "25-35 tonnes", description: "Side-discharge for narrow access" },
    { name: "Off-Road Dumper", capacity: "30-60 tonnes", description: "Construction site hauler" },
    { name: "Skip Lorry", capacity: "10-20 tonnes", description: "Container transport" },
  ],
  ZA: [
    { name: "Tipper Truck", capacity: "10-25 tonnes", description: "Standard tipping vehicle" },
    { name: "Side Tipper", capacity: "20-35 tonnes", description: "Side-discharge hauler" },
    { name: "Interlink", capacity: "30-40 tonnes", description: "Double-trailer combination" },
    { name: "Superlink", capacity: "34-40 tonnes", description: "High-capacity road train" },
    { name: "Skip Truck", capacity: "8-15 tonnes", description: "Container transport" },
    { name: "ADT (Articulated Dump Truck)", capacity: "25-40 tonnes", description: "Off-road mining hauler" },
  ],
  // Southeast Asia - Malaysia
  MY: [
    { name: "Lori Tipper", capacity: "10-20 tonnes", description: "Standard tipping vehicle" },
    { name: "RORO Truck", capacity: "15-25 tonnes", description: "Roll-on/roll-off container" },
    { name: "Arm Roll", capacity: "10-18 tonnes", description: "Hydraulic arm loader" },
    { name: "Compactor Truck", capacity: "8-15 tonnes", description: "Waste compaction vehicle" },
    { name: "Trailer Tipper", capacity: "25-40 tonnes", description: "Semi-trailer configuration" },
  ],
  // Southeast Asia - Indonesia
  ID: [
    { name: "Dump Truck", capacity: "10-25 ton", description: "Standard tipping vehicle" },
    { name: "Truk Arm Roll", capacity: "12-20 ton", description: "Container transport" },
    { name: "Fuso Tipper", capacity: "8-15 ton", description: "Medium-duty tipper" },
    { name: "Tronton Dump", capacity: "20-30 ton", description: "Heavy-duty hauler" },
    { name: "Trailer Tipper", capacity: "30-50 ton", description: "Articulated tipper" },
  ],
  // Southeast Asia - Philippines
  PH: [
    { name: "Dump Truck", capacity: "10-20 tons", description: "Standard tipping vehicle" },
    { name: "Forward Dump", capacity: "8-15 tons", description: "Medium-duty tipper" },
    { name: "Compactor Truck", capacity: "10-18 tons", description: "Waste compaction" },
    { name: "Roll-off Truck", capacity: "15-25 tons", description: "Container hauler" },
    { name: "Trailer Dump", capacity: "25-40 tons", description: "Heavy-duty combination" },
  ],
  // Southeast Asia - Thailand
  TH: [
    { name: "รถดัมพ์ (Dump Truck)", capacity: "10-25 tonnes", description: "Standard tipper" },
    { name: "รถอัดขยะ (Compactor)", capacity: "8-15 tonnes", description: "Waste compactor" },
    { name: "รถ Arm Roll", capacity: "12-20 tonnes", description: "Container transport" },
    { name: "รถพ่วง (Trailer)", capacity: "30-50 tonnes", description: "Articulated hauler" },
    { name: "รถหกล้อ (6-Wheeler)", capacity: "15-22 tonnes", description: "Medium-duty truck" },
  ],
  // Southeast Asia - Vietnam
  VN: [
    { name: "Xe Ben", capacity: "10-25 tấn", description: "Standard dump truck" },
    { name: "Xe Cuốn Ép", capacity: "8-15 tấn", description: "Compactor truck" },
    { name: "Xe Arm Roll", capacity: "12-20 tấn", description: "Container transport" },
    { name: "Xe Đầu Kéo", capacity: "30-50 tấn", description: "Tractor-trailer" },
    { name: "Xe Tải Thùng", capacity: "15-25 tấn", description: "Covered truck" },
  ],
  // Saudi Arabia
  SA: [
    { name: "Tipper Truck", capacity: "15-30 tonnes", description: "Standard tipping vehicle" },
    { name: "Semi-Tipper", capacity: "25-45 tonnes", description: "Articulated hauler" },
    { name: "Roll-off Truck", capacity: "15-25 tonnes", description: "Container transport" },
    { name: "Off-Road Dumper", capacity: "30-70 tonnes", description: "Mining/construction hauler" },
    { name: "Compactor", capacity: "12-20 tonnes", description: "Waste compaction" },
    { name: "قلاب (Tipper)", capacity: "20-35 tonnes", description: "Heavy-duty dump truck" },
  ],
};

export const getVehiclesForRegion = (countryCode: string): VehicleType[] => {
  const upperCode = countryCode?.toUpperCase();
  
  const countryToRegion: Record<string, string> = {
    'GB': 'UK', 'UK': 'UK',
    'US': 'US', 'USA': 'US',
    'AU': 'AU', 'AUS': 'AU',
    'CA': 'CA', 'CAN': 'CA',
    'NZ': 'NZ', 'NZL': 'NZ',
    'DE': 'EU', 'FR': 'EU', 'NL': 'EU', 'BE': 'EU', 'IE': 'EU', 'ES': 'EU', 'IT': 'EU', 'AT': 'EU', 'PT': 'EU',
    'BR': 'BR', 'BRA': 'BR',
    'CN': 'CN', 'CHN': 'CN',
    'IN': 'IN', 'IND': 'IN',
    'SG': 'SG', 'SGP': 'SG',
    'AE': 'AE', 'ARE': 'AE',
    'ZA': 'ZA', 'ZAF': 'ZA',
    'MY': 'MY', 'MYS': 'MY',
    'ID': 'ID', 'IDN': 'ID',
    'PH': 'PH', 'PHL': 'PH',
    'TH': 'TH', 'THA': 'TH',
    'VN': 'VN', 'VNM': 'VN',
    'SA': 'SA', 'SAU': 'SA',
  };

  const regionCode = countryToRegion[upperCode] || 'UK';
  return REGIONAL_VEHICLES[regionCode] || REGIONAL_VEHICLES['UK'];
};
