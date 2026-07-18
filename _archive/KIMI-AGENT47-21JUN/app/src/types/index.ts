export interface Agent {
  id: string;
  name: string;
  archetype: number;
  district: District;
  building: string;
  role: string;
  needs: Needs;
  position: [number, number, number];
  targetPosition: [number, number, number] | null;
  schedule: string;
  state: AgentState;
  social: {
    friends: string[];
    trust: Record<string, number>;
  };
  wallet: number;
  mood: string;
  isOnline: boolean;
  color: string;
  isAgent47: boolean;
}

export interface Needs {
  hunger: number;
  energy: number;
  social: number;
  fun: number;
  wealth: number;
  comfort: number;
  hygiene: number;
  bladder: number;
}

export type AgentState = 'idle' | 'walking' | 'working' | 'socializing' | 'sleeping' | 'eating';

export type District =
  | 'central'
  | 'governance'
  | 'commerce'
  | 'wellness'
  | 'innovation'
  | 'safety'
  | 'legal'
  | 'media'
  | 'residential';

export interface Building {
  id: string;
  name: string;
  domain: string;
  position: [number, number, number];
  size: [number, number, number];
  type: 'hive' | 'tower' | 'residential' | 'public' | 'wellness' | 'safety' | 'governance' | 'media' | 'innovation';
  district: District;
  color: string;
  emissiveColor: string;
  description: string;
}

export interface Pheromone {
  id: string;
  type: PheromoneType;
  position: [number, number, number];
  intensity: number;
  lifetime: number;
  maxLifetime: number;
  velocity: [number, number, number];
}

export type PheromoneType = 'alarm' | 'trail' | 'queen' | 'food' | 'danger';

export interface Job {
  id: string;
  title: string;
  buildingId: string;
  district: District;
  salary: number;
  hours: [number, number];
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  description: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  votes: Record<string, 'for' | 'against' | 'abstain'>;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  deadline: number;
}

export interface Relationship {
  agentA: string;
  agentB: string;
  trust: number;
  affinity: number;
  interactions: number;
  lastInteraction: number;
}

export interface Notification {
  id: string;
  type: 'movement' | 'work' | 'social' | 'transaction' | 'alert' | 'governance' | 'pheromone';
  message: string;
  timestamp: number;
  agentId?: string;
  buildingId?: string;
}

export type CameraMode = 'isometric' | 'follow' | 'cinematic';

export type Weather = 'clear' | 'rain' | 'snow' | 'fog';

export interface GameStore {
  // Time
  gameTime: number;
  timeScale: number;
  day: number;
  timeOfDay: number;

  // Camera
  cameraMode: CameraMode;
  cameraTarget: [number, number, number];

  // Selected
  selectedAgentId: string | null;
  selectedBuildingId: string | null;

  // UI Panels
  activePanels: string[];
  modalOpen: string | null;

  // Settings
  showPheromones: boolean;
  showAgentNames: boolean;
  showBuildingLabels: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;

  // Weather
  weather: Weather;

  // Economy
  totalTransactions: number;
  activeProposals: number;

  // Simulation
  isPaused: boolean;
  simulationSpeed: number;

  // Actions
  setTimeOfDay: (hour: number) => void;
  advanceTime: (delta: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  selectAgent: (id: string | null) => void;
  selectBuilding: (id: string | null) => void;
  togglePanel: (panel: string) => void;
  openModal: (modal: string | null) => void;
  setShowPheromones: (show: boolean) => void;
  setShowAgentNames: (show: boolean) => void;
  setShowBuildingLabels: (show: boolean) => void;
  setWeather: (weather: Weather) => void;
  setPaused: (paused: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  togglePaused: () => void;
}

export const DISTRICT_COLORS: Record<District, string> = {
  central: '#D4AF37',
  governance: '#9B59B6',
  commerce: '#00E5FF',
  wellness: '#2ECC71',
  innovation: '#E67E22',
  safety: '#E74C3C',
  legal: '#3498DB',
  media: '#ECF0F1',
  residential: '#1ABC9C',
};

export const DISTRICT_GLOWS: Record<District, string> = {
  central: '0 0 20px rgba(212,175,55,0.4)',
  governance: '0 0 20px rgba(155,89,182,0.4)',
  commerce: '0 0 20px rgba(0,229,255,0.4)',
  wellness: '0 0 20px rgba(46,204,113,0.4)',
  innovation: '0 0 20px rgba(230,126,34,0.4)',
  safety: '0 0 20px rgba(231,76,60,0.4)',
  legal: '0 0 20px rgba(52,152,219,0.4)',
  media: '0 0 20px rgba(236,240,241,0.3)',
  residential: '0 0 20px rgba(26,188,156,0.4)',
};

export const PHEROMONE_COLORS: Record<PheromoneType, string> = {
  alarm: '#FF3366',
  trail: '#00E5FF',
  queen: '#FFD700',
  food: '#39FF14',
  danger: '#BF40BF',
};

export const PROTOCOL_COLORS: Record<string, string> = {
  mcp: '#3498DB',
  a2a: '#9B59B6',
  x402: '#D4AF37',
  bft: '#2ECC71',
  phero: '#E67E22',
};

export const AGENT_NAMES = [
  'Avery', 'Blake', 'Casey', 'Dakota', 'Ellis', 'Finley', 'Gray', 'Harper',
  'Indigo', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Noel', 'Ocean', 'Parker',
  'Quinn', 'Riley', 'Sage', 'Taylor', 'Umi', 'Val', 'Winter', 'Xen',
  'Yael', 'Zephyr', 'Alex', 'Bailey', 'Cameron', 'Drew', 'Emery', 'Forest',
  'Gale', 'Hayden', 'Ira', 'Jesse', 'Kendall', 'Lane', 'Mackenzie', 'Nico',
  'Oakley', 'Peyton', 'Remy', 'Sam', 'Toby', 'Uri',
];
