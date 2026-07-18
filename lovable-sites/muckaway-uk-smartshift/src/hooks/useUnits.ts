import { useGlobal } from "@/components/GlobalProvider";

interface UnitSystem {
  weight: string;
  weightPlural: string;
  volume: string;
  volumePlural: string;
  distance: string;
  weightPerUnit: number; // Convert from metric tonnes
  volumePerUnit: number; // Convert from cubic meters
}

const UNIT_SYSTEMS: Record<string, UnitSystem> = {
  metric: {
    weight: "tonne",
    weightPlural: "tonnes",
    volume: "cubic metre",
    volumePlural: "cubic metres",
    distance: "km",
    weightPerUnit: 1,
    volumePerUnit: 1,
  },
  imperial: {
    weight: "ton",
    weightPlural: "tons",
    volume: "cubic yard",
    volumePlural: "cubic yards",
    distance: "miles",
    weightPerUnit: 1.10231, // 1 tonne = 1.10231 US tons
    volumePerUnit: 1.30795, // 1 cubic meter = 1.30795 cubic yards
  },
};

const REGION_UNIT_SYSTEM: Record<string, "metric" | "imperial"> = {
  UK: "metric",
  GB: "metric",
  US: "imperial",
  AU: "metric",
  CA: "metric", // Canada uses metric officially
  NZ: "metric",
  EU: "metric",
  DE: "metric",
  FR: "metric",
  ES: "metric",
  BR: "metric",
  CN: "metric",
  IN: "metric",
  SG: "metric",
  ZA: "metric",
  AE: "metric",
  SA: "metric",
};

export const useUnits = () => {
  const { region } = useGlobal();
  const countryCode = region?.country?.toUpperCase() || "UK";
  const systemType = REGION_UNIT_SYSTEM[countryCode] || "metric";
  const system = UNIT_SYSTEMS[systemType];

  const formatWeight = (tonnes: number, includeUnit = true): string => {
    const converted = tonnes * system.weightPerUnit;
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    if (!includeUnit) return formatted;
    return `${formatted} ${converted === 1 ? system.weight : system.weightPlural}`;
  };

  const formatVolume = (cubicMeters: number, includeUnit = true): string => {
    const converted = cubicMeters * system.volumePerUnit;
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    if (!includeUnit) return formatted;
    return `${formatted} ${converted === 1 ? system.volume : system.volumePlural}`;
  };

  const getWeightUnit = (plural = true): string => {
    return plural ? system.weightPlural : system.weight;
  };

  const getVolumeUnit = (plural = true): string => {
    return plural ? system.volumePlural : system.volume;
  };

  const convertToMetricTonnes = (localWeight: number): number => {
    return localWeight / system.weightPerUnit;
  };

  const convertFromMetricTonnes = (tonnes: number): number => {
    return tonnes * system.weightPerUnit;
  };

  return {
    systemType,
    formatWeight,
    formatVolume,
    getWeightUnit,
    getVolumeUnit,
    convertToMetricTonnes,
    convertFromMetricTonnes,
    isImperial: systemType === "imperial",
    isMetric: systemType === "metric",
  };
};
