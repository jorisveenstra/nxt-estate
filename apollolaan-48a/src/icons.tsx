import React from "react";
import type { IconName } from "./config";

// Eenvoudige lijn-iconen (stroke = currentColor), 48x48 viewBox.
const P: Record<IconName, React.ReactNode> = {
  huis: <path d="M6 22 24 7l18 15M11 18v22h26V18M20 40V28h8v12" />,
  water: <path d="M4 18c5-4 9-4 14 0s9 4 14 0 9-4 12-2M4 28c5-4 9-4 14 0s9 4 14 0 9-4 12-2M4 38c5-4 9-4 14 0s9 4 14 0 9-4 12-2" />,
  boot: <path d="M6 30h36l-6 9H12zM24 30V8l12 18H24M4 43c4-2 8-2 12 0s8 2 12 0 8-2 12 0" />,
  keuken: <path d="M6 24h36v6H6zM10 30v12M38 30v12M16 16c0-4 3-4 3-8M24 16c0-4 3-4 3-8M32 16c0-4 3-4 3-8" />,
  bed: <path d="M5 38V12M5 30h38v8M43 30v-6a5 5 0 0 0-5-5H20v11M10 24a4 4 0 1 0 8 0 4 4 0 1 0-8 0" />,
  parkeren: <path d="M10 6h28v36H10zM19 34V14h7a6 6 0 0 1 0 12h-7" />,
  check: <path d="M24 4a20 20 0 1 0 0.01 0zM14 24l7 7 13-14" />,
  kalender: <path d="M8 10h32v30H8zM8 18h32M16 6v8M32 6v8M15 26h4M22 26h4M29 26h4M15 33h4M22 33h4" />,
  tuin: <path d="M24 42V22M24 22c-8 0-12-6-12-12 8 0 12 6 12 12zM24 28c8 0 12-6 12-12-8 0-12 6-12 12zM6 42h36" />,
  energie: <path d="M27 4 10 27h13l-3 17 18-24H25z" />,
  auto: <path d="M6 32v-8l5-10h26l5 10v8zM6 32v6h6v-6M36 32v6h6v-6M6 24h36M13 28h4M31 28h4" />,
  euro: <path d="M36 12a14 14 0 1 0 0 24M8 21h20M8 28h18" />,
  polder: <path d="M4 30h40M4 38h40M10 30V20l6-4 6 4v10M30 30v-6h8v6M2 14c8-6 16-6 22-2s14 4 22-2" />,
};

export const Icon: React.FC<{ name: IconName; size?: number; color?: string; stroke?: number }> = ({ name, size = 64, color = "#fff", stroke = 3.4 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {P[name]}
  </svg>
);
