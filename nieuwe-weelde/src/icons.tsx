import React from "react";

// Eenvoudige lijn-iconen (24x24)
const P: Record<string, React.ReactNode> = {
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  huis: <><path d="M3 11l9-7.5 9 7.5" /><path d="M5.5 10v10h13V10" /><path d="M10 20v-6h4v6" /></>,
  maat: <><path d="M4 4h16v16H4z" /><path d="M4 9h4M4 14h3M9 4v4M14 4v3" /></>,
  bed: <><path d="M3 18V7M3 14h18v4M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5" /><circle cx="7" cy="11" r="1.6" /></>,
  lift: <><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9.5 10l2.5-3 2.5 3M9.5 14l2.5 3 2.5-3" /></>,
  auto: <><path d="M4 15l1.6-5A2 2 0 0 1 7.5 8.5h9a2 2 0 0 1 1.9 1.5L20 15v3h-2v-1.5H6V18H4z" /><circle cx="7.5" cy="13.5" r=".8" /><circle cx="16.5" cy="13.5" r=".8" /></>,
  hart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  sleutel: <><circle cx="8" cy="12" r="3.5" /><path d="M11.5 12H21M18 12v3M15 12v2" /></>,
  koffie: <><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2" /><path d="M8 3v3M12 3v3" /></>,
  blad: <><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z" /><path d="M5 19c3-5 6-8 10-10" /></>,
  zon: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
  vlam: <><path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-10z" /><path d="M4 4l16 16" /></>,
  thermo: <><path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z" /><path d="M12 8v8" /></>,
  klok: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  euro: <><path d="M17 6.5A6 6 0 1 0 17 17.5" /><path d="M5 10.5h8M5 13.5h8" /></>,
  laptop: <><rect x="5" y="5" width="14" height="10" rx="1.2" /><path d="M2.5 19h19" /></>,
  fiets: <><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-8h4l4 8M10 8H8M13 12H8.5" /></>,
};

export const Icon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 56, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {P[name] ?? P.huis}
  </svg>
);
