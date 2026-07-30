import type { RiskLevel } from "./types";

export const riskLabel: Record<RiskLevel, string> = {
  1: "Level 1 · Low Risk",
  2: "Level 2 · Moderate",
  3: "Level 3 · Urgent",
  Fixed: "Fixed",
};

export const riskDotClass: Record<RiskLevel, string> = {
  1: "bg-blue-500 border-blue-700",
  2: "bg-orange-500 border-orange-700",
  3: "bg-red-500 border-red-700",
  Fixed: "bg-green-500 border-green-700",
};

// Fill colours for the teardrop map-pin markers on the campus map.
export const riskPinColor: Record<RiskLevel, string> = {
  1: "#3b82f6", // blue-500
  2: "#f97316", // orange-500
  3: "#ef4444", // red-500
  Fixed: "#22c55e", // green-500
};

export const riskBadgeClass: Record<RiskLevel, string> = {
  1: "bg-blue-950/60 text-blue-300 border-blue-700/50",
  2: "bg-orange-950/60 text-orange-300 border-orange-700/50",
  3: "bg-red-950/60 text-red-300 border-red-700/50",
  Fixed: "bg-green-950/60 text-green-300 border-green-700/50",
};
