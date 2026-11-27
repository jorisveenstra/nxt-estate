import React from "react";

// Eenvoudige lijn-iconen (24x24), getekend in de lijnstijl van de site
const P: Record<string, React.ReactNode> = {
  lift: (<><rect x="5" y="2.5" width="14" height="19" rx="1.5" /><path d="M9 9.5l3-3 3 3M9 14.5l3 3 3-3" /></>),
  level: (<><path d="M3 18h18M3 12h18" /><path d="M7 12V7h10v5" /></>),
  nogarden: (<><path d="M12 21v-7M12 14c-4 0-6-3-6-6 3 0 6 2 6 6zM12 14c4 0 6-3 6-6-3 0-6 2-6 6z" /><path d="M4 4l16 16" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  bag: (<><path d="M5 8h14l-1 13H6L5 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></>),
  pin: (<><path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>),
  leaf: (<><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15" /><path d="M5 19l8-8" /></>),
  floor: (<><path d="M3 20h18" /><path d="M6 16c1.5-1.5 1.5-3 0-4.5S4.5 8.5 6 7M12 16c1.5-1.5 1.5-3 0-4.5S10.5 8.5 12 7M18 16c1.5-1.5 1.5-3 0-4.5S16.5 8.5 18 7" /></>),
  bolt: (<><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></>),
  house: (<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>),
  euro: (<><path d="M17 6a7 7 0 100 12" /><path d="M4 10h9M4 14h9" /></>),
  people: (<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2c2.8.3 5 2.5 5 5.8" /></>),
  chart: (<><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V9M16 16V6" /></>),
  shield: (<><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>),
  heart: (<><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6-8 11-8 11z" /></>),
  door: (<><path d="M6 21V3h12v18" /><path d="M3 21h18" /><circle cx="14.5" cy="12" r="0.8" /></>),
  monitor: (<><rect x="3" y="3" width="18" height="13" rx="1.5" /><circle cx="12" cy="8.5" r="2.2" /><path d="M8 14c.8-1.6 2.2-2.5 4-2.5s3.2.9 4 2.5M9 21h6M12 16v5" /></>),
  car: (<><path d="M4 16V12l2-5h12l2 5v4H4z" /><path d="M4 12h16" /><circle cx="7.5" cy="16.5" r="1.8" /><circle cx="16.5" cy="16.5" r="1.8" /></>),
  bike: (<><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-8h5l3 8M10 8l2 8M14 5h2" /></>),
  care: (<><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6-8 11-8 11z" /><path d="M12 9v6M9 12h6" /></>),
  chat: (<><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 9h8M8 12h5" /></>),
  water: (<><path d="M2 9c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-.5M2 14c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-.5M2 19c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5-.5" /></>),
  tree: (<><path d="M12 22v-6" /><path d="M12 2l6 9h-3l4 5H5l4-5H6l6-9z" /></>),
  lock: (<><path d="M3 20h18M5 20V9M19 20V9M5 9h14" /><path d="M9 20v-6h6v6" /></>),
  walk: (<><circle cx="13" cy="4" r="2" /><path d="M10 22l2-7-3-3 1-4 4 3 3 1M9 12l-3 3M12 15l3 3v4" /></>),
  cup: (<><path d="M4 9h12v5a5 5 0 01-5 5H9a5 5 0 01-5-5V9z" /><path d="M16 10h2a2.5 2.5 0 010 5h-2.5M8 3v3M12 3v3" /></>),
  boat: (<><path d="M3 16l2 4h14l2-4H3z" /><path d="M12 3v13M12 3l6 10h-6" /></>),
  box: (<><path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" /><path d="M3 7l9 4 9-4M12 11v10" /></>),
  arrowDown: (<><path d="M12 4v15M6 13l6 6 6-6" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="1.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
};

export const Icon: React.FC<{ name: string; size?: number; color?: string; stroke?: number }> = ({
  name,
  size = 44,
  color = "currentColor",
  stroke = 1.8,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {P[name] ?? P.pin}
  </svg>
);
