export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3101";

export const FAB_SIZE = 72;
export const PANEL_W = 380;
export const PANEL_H = 520;

export const STATUS_COLORS = {
  online: "#00AA44",
  offline: "#666666",
  processing: "#FF8800",
  listening: "#0066FF",
} as const;
