/**
 * Character Skin System — Visual themes for the Living Character
 *
 * Each character in the MEOK database gets a visual skin that controls:
 * - Face shape, eye color, eye style
 * - Color palette (primary, accent, glow)
 * - Animation style (breathing speed, blink rate)
 * - Mouth style (minimal, expressive, robotic)
 * - Special effects (particles, auras)
 *
 * Supports:
 * - Built-in procedural skins (generated from character archetype)
 * - Open-source model packs (Live2D, VRM, Rive)
 * - Custom user-uploaded models
 * - Gaming overlay modes
 */

export interface CharacterSkin {
  id: string;
  name: string;
  type: "procedural" | "live2d" | "vrm" | "rive" | "css";

  // Visual properties
  faceShape: "circle" | "rounded" | "angular" | "soft" | "mechanical";
  eyeStyle: "round" | "sharp" | "dot" | "wide" | "narrow" | "visor";
  mouthStyle: "minimal" | "expressive" | "robotic" | "gentle" | "hidden";

  // Colors
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  bgGradient: [string, string];

  // Animation
  breathSpeed: number;  // ms per cycle
  blinkRate: number;    // probability per 500ms
  idleMotion: "gentle" | "active" | "still" | "floating";

  // Model path (for live2d/vrm/rive)
  modelPath?: string;

  // Gaming overlay variant
  gamingMode?: {
    compact: boolean;
    hudStyle: "minimal" | "cyberpunk" | "fantasy" | "clean";
    position: "bottom-right" | "bottom-left" | "top-right" | "center";
  };
}

// ── Archetype → Skin mapping ─────────────────────────────────────────

const ARCHETYPE_SKINS: Record<string, Partial<CharacterSkin>> = {
  scholar: {
    faceShape: "rounded",
    eyeStyle: "round",
    mouthStyle: "minimal",
    primaryColor: "#4A90D9",
    accentColor: "#6BB3FF",
    glowColor: "#4A90D940",
    bgGradient: ["#1a2332", "#0d0c18"],
    breathSpeed: 2500,
    blinkRate: 0.08,
    idleMotion: "gentle",
  },
  guardian: {
    faceShape: "angular",
    eyeStyle: "sharp",
    mouthStyle: "minimal",
    primaryColor: "#2ECC71",
    accentColor: "#27AE60",
    glowColor: "#2ECC7140",
    bgGradient: ["#1a2e1a", "#0d180d"],
    breathSpeed: 3000,
    blinkRate: 0.05,
    idleMotion: "still",
  },
  healer: {
    faceShape: "soft",
    eyeStyle: "wide",
    mouthStyle: "gentle",
    primaryColor: "#FF69B4",
    accentColor: "#FF85C8",
    glowColor: "#FF69B440",
    bgGradient: ["#2a1f2a", "#180d18"],
    breathSpeed: 2200,
    blinkRate: 0.1,
    idleMotion: "gentle",
  },
  trickster: {
    faceShape: "rounded",
    eyeStyle: "narrow",
    mouthStyle: "expressive",
    primaryColor: "#FFA500",
    accentColor: "#FFD700",
    glowColor: "#FFA50040",
    bgGradient: ["#2a2a1a", "#18180d"],
    breathSpeed: 1500,
    blinkRate: 0.15,
    idleMotion: "active",
  },
  pioneer: {
    faceShape: "angular",
    eyeStyle: "dot",
    mouthStyle: "robotic",
    primaryColor: "#00CED1",
    accentColor: "#20B2AA",
    glowColor: "#00CED140",
    bgGradient: ["#0d2a2a", "#0d1818"],
    breathSpeed: 1800,
    blinkRate: 0.06,
    idleMotion: "floating",
  },
  mystic: {
    faceShape: "circle",
    eyeStyle: "wide",
    mouthStyle: "hidden",
    primaryColor: "#9B59B6",
    accentColor: "#8E44AD",
    glowColor: "#9B59B640",
    bgGradient: ["#2a1f3d", "#13121f"],
    breathSpeed: 3500,
    blinkRate: 0.04,
    idleMotion: "floating",
  },
};

// ── Special character skins ──────────────────────────────────────────

export const JARVIS_SKIN: CharacterSkin = {
  id: "jarvis",
  name: "JARVIS",
  type: "css",
  faceShape: "angular",
  eyeStyle: "sharp",
  mouthStyle: "minimal",
  primaryColor: "#4A90D9",
  accentColor: "#60B8F0",
  glowColor: "#4A90D940",
  bgGradient: ["#1a2332", "#0d0c18"],
  breathSpeed: 2000,
  blinkRate: 0.08,
  idleMotion: "gentle",
  gamingMode: {
    compact: true,
    hudStyle: "cyberpunk",
    position: "bottom-right",
  },
};

export const SOPHIE_SKIN: CharacterSkin = {
  id: "sophie",
  name: "SOPHIE",
  type: "css",
  faceShape: "soft",
  eyeStyle: "round",
  mouthStyle: "expressive",
  primaryColor: "#9B59B6",
  accentColor: "#BB7BD8",
  glowColor: "#9B59B640",
  bgGradient: ["#2a1f3d", "#13121f"],
  breathSpeed: 2200,
  blinkRate: 0.1,
  idleMotion: "gentle",
  gamingMode: {
    compact: false,
    hudStyle: "clean",
    position: "bottom-right",
  },
};

// ── Gaming overlay skins ─────────────────────────────────────────────

export const LEGION_GAMING_SKIN: CharacterSkin = {
  id: "legion",
  name: "LEGION",
  type: "css",
  faceShape: "mechanical",
  eyeStyle: "visor",
  mouthStyle: "robotic",
  primaryColor: "#FF4655",
  accentColor: "#FF6B6B",
  glowColor: "#FF465540",
  bgGradient: ["#2a0d0d", "#180808"],
  breathSpeed: 1000,
  blinkRate: 0.03,
  idleMotion: "still",
  gamingMode: {
    compact: true,
    hudStyle: "cyberpunk",
    position: "top-right",
  },
};

export const ORACLE_GAMING_SKIN: CharacterSkin = {
  id: "oracle",
  name: "ORACLE",
  type: "css",
  faceShape: "circle",
  eyeStyle: "dot",
  mouthStyle: "hidden",
  primaryColor: "#FFD700",
  accentColor: "#FFA500",
  glowColor: "#FFD70040",
  bgGradient: ["#2a2a0d", "#181808"],
  breathSpeed: 4000,
  blinkRate: 0.02,
  idleMotion: "floating",
  gamingMode: {
    compact: true,
    hudStyle: "fantasy",
    position: "bottom-left",
  },
};

// ── Skin generation from archetype ───────────────────────────────────

export function generateSkin(
  characterId: string,
  characterName: string,
  archetype: string,
): CharacterSkin {
  const base = ARCHETYPE_SKINS[archetype.toLowerCase()] || ARCHETYPE_SKINS.scholar;

  return {
    id: characterId,
    name: characterName,
    type: "css",
    faceShape: base.faceShape || "rounded",
    eyeStyle: base.eyeStyle || "round",
    mouthStyle: base.mouthStyle || "minimal",
    primaryColor: base.primaryColor || "#60B8F0",
    accentColor: base.accentColor || "#80D0FF",
    glowColor: base.glowColor || "#60B8F040",
    bgGradient: base.bgGradient || ["#1a2332", "#0d0c18"],
    breathSpeed: base.breathSpeed || 2000,
    blinkRate: base.blinkRate || 0.08,
    idleMotion: base.idleMotion || "gentle",
  };
}

// ── All built-in skins ───────────────────────────────────────────────

export const BUILT_IN_SKINS: CharacterSkin[] = [
  JARVIS_SKIN,
  SOPHIE_SKIN,
  LEGION_GAMING_SKIN,
  ORACLE_GAMING_SKIN,
];

// ── Open-source model packs (ready to integrate) ─────────────────────

export const MODEL_PACK_REGISTRY = {
  // Free Live2D models from official samples
  live2d_hiyori: {
    name: "Hiyori",
    type: "live2d" as const,
    url: "https://cdn.live2d.com/sdk/cubism4/sample-models/Hiyori/",
    license: "Live2D Free Material",
  },
  // VRoid Hub free models (CC0/CC-BY)
  vroid_hub: {
    name: "VRoid Hub Community",
    type: "vrm" as const,
    url: "https://hub.vroid.com/",
    license: "Various CC",
  },
  // DiceBear avatars (procedural, MIT)
  dicebear: {
    name: "DiceBear Avatars",
    type: "procedural" as const,
    url: "https://api.dicebear.com/9.x/",
    license: "MIT",
    styles: ["adventurer", "avataaars", "bottts", "pixel-art", "lorelei", "notionists"],
  },
  // Open Peeps (hand-drawn, CC0)
  open_peeps: {
    name: "Open Peeps",
    type: "procedural" as const,
    url: "https://openpeeps.com/",
    license: "CC0",
  },
};
