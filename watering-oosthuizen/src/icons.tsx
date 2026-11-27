import React from "react";

// Eenvoudige lijn-iconen (24x24 viewBox), getekend met currentColor
const PATHS = {
  house: "M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6",
  bed: "M3 18V7M3 13h18v5M21 18v-5a3 3 0 0 0-3-3h-7v3M7 11.5a1.5 1.5 0 1 0 0-.01",
  leaf: "M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l8-8",
  car: "M4 16v-4l2-5h12l2 5v4M4 16h16M4 16v2h3v-2M17 16v2h3v-2M7.5 13h.01M16.5 13h.01",
  door: "M6 21V4h12v17M3 21h18M14.5 12.5h.01",
  energy: "M13 2 5 14h6l-1 8 8-12h-6l1-8z",
  shop: "M4 9h16l-1-4H5L4 9zM5 9v11h14V9M9 20v-6h6v6",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  chat: "M4 5h16v11H9l-5 4V5z",
  pin: "M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M17 11a2.5 2.5 0 1 0 0-5M18 14c2 .6 3 2.8 3 6",
} as const;

export type IconName = keyof typeof PATHS;

export const Icon: React.FC<{ name: IconName; size: number; color: string; stroke?: number }> = ({ name, size, color, stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[name]} />
  </svg>
);
