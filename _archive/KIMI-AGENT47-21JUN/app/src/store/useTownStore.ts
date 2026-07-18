import { create } from 'zustand';
import type { GameStore } from '@/types';

type SetFn = (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void;

export const useTownStore = create<GameStore>((set: SetFn) => ({
  // Time
  gameTime: 8 * 3600, // Start at 8:00 AM
  timeScale: 60,
  day: 1,
  timeOfDay: 8,

  // Camera
  cameraMode: 'isometric',
  cameraTarget: [0, 0, 0],

  // Selected
  selectedAgentId: null,
  selectedBuildingId: null,

  // UI Panels
  activePanels: ['minimap', 'agentList', 'controlBar', 'notifications'],
  modalOpen: null,

  // Settings
  showPheromones: true,
  showAgentNames: true,
  showBuildingLabels: true,
  graphicsQuality: 'medium',
  soundEnabled: false,
  musicVolume: 0.5,
  sfxVolume: 0.5,

  // Weather
  weather: 'clear',

  // Economy
  totalTransactions: 0,
  activeProposals: 0,

  // Simulation
  isPaused: false,
  simulationSpeed: 1,

  // Actions
  setTimeOfDay: (hour: number) => set({ timeOfDay: hour }),
  advanceTime: (delta: number) =>
    set((state: GameStore) => {
      const newGameTime = state.gameTime + delta * state.timeScale * state.simulationSpeed;
      const day = Math.floor(newGameTime / 86400) + 1;
      const timeOfDay = (newGameTime % 86400) / 3600;
      return { gameTime: newGameTime, day, timeOfDay };
    }),
  setCameraMode: (mode: GameStore['cameraMode']) => set({ cameraMode: mode }),
  setCameraTarget: (target: [number, number, number]) => set({ cameraTarget: target }),
  selectAgent: (id: string | null) => set({ selectedAgentId: id }),
  selectBuilding: (id: string | null) => set({ selectedBuildingId: id }),
  togglePanel: (panel: string) =>
    set((state: GameStore) => ({
      activePanels: state.activePanels.includes(panel)
        ? state.activePanels.filter((p: string) => p !== panel)
        : [...state.activePanels, panel],
    })),
  openModal: (modal: string | null) => set({ modalOpen: modal }),
  setShowPheromones: (show: boolean) => set({ showPheromones: show }),
  setShowAgentNames: (show: boolean) => set({ showAgentNames: show }),
  setShowBuildingLabels: (show: boolean) => set({ showBuildingLabels: show }),
  setWeather: (weather: GameStore['weather']) => set({ weather }),
  setPaused: (paused: boolean) => set({ isPaused: paused }),
  setSimulationSpeed: (speed: number) => set({ simulationSpeed: speed }),
  togglePaused: () => set((state: GameStore) => ({ isPaused: !state.isPaused })),
}));
