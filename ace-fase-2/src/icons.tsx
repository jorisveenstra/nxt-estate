import React from "react";

// Eenvoudige lijn-iconen (24x24)
const P: Record<string, React.ReactNode> = {
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  ball: <><circle cx="12" cy="12" r="9" /><path d="M5 5c4 3 4 11 0 14M19 5c-4 3-4 11 0 14" /></>,
  cup: <><path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2" /></>,
  tree: <><circle cx="12" cy="9" r="6" /><path d="M12 15v6M9 21h6" /></>,
  metro: <><path d="M6 3h12a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM4 11h16M8 21l2-3M16 21l-2-3" /><circle cx="8" cy="14.5" r=".6" /><circle cx="16" cy="14.5" r=".6" /></>,
  bike: <><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-8h5l3 8M10 8l3 8M15 8l-1-2h-2" /></>,
  car: <><path d="M3 14l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4h-3v-2H6v2H3z" /><circle cx="7.5" cy="13.5" r=".8" /><circle cx="16.5" cy="13.5" r=".8" /></>,
  leaf: <><path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19l8-8" /></>,
  home: <><path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M14 9l2 2" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  expand: <path d="M4 4h6M4 4v6M4 4l6 6M20 20h-6M20 20v-6M20 20l-6-6" />,
  chat: <path d="M4 5h16v10H9l-5 4z" />,
  heat: <path d="M4 8c2-2 4 2 6 0s4 2 6 0 4 2 4 0M4 14c2-2 4 2 6 0s4 2 6 0 4 2 4 0M4 20c2-2 4 2 6 0s4 2 6 0 4 2 4 0" />,
  building: <path d="M5 21V4h9v17M14 9h5v12M8 8h3M8 12h3M8 16h3" />,
  bag: <><path d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0" /></>,
  box: <path d="M3 8l9-5 9 5v9l-9 5-9-5zM3 8l9 5 9-5M12 13v9" />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
};

export const Icon: React.FC<{ name: string; size?: number; color?: string; stroke?: number }> = ({ name, size = 44, color = "currentColor", stroke = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {P[name] ?? P.check}
  </svg>
);
