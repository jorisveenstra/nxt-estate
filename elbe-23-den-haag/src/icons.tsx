import React from "react";

// Eenvoudige lijn-iconen (stroke), in de kleur van de tekst.
const P: Record<string, React.ReactNode> = {
  sleutel: (<><circle cx="8" cy="12" r="4" /><path d="M12 12h9M18 12v3M21 12v2" /></>),
  gebouw: (<><path d="M3 21h18M5 21V5h9v16M14 9h5v12" /><path d="M8 8h3M8 12h3M8 16h3" /></>),
  indeling: (<><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 11h10M13 3v18M13 15h8" /></>),
  auto: (<><path d="M4 16V12l2-5h12l2 5v4z" /><circle cx="7.5" cy="16.5" r="1.8" /><circle cx="16.5" cy="16.5" r="1.8" /><path d="M4 12h16" /></>),
  blok: (<><path d="M3 8l9-5 9 5-9 5z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>),
  kalender: (<><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  euro: (<><path d="M18 6a7 7 0 1 0 0 12" /><path d="M4 10h10M4 14h10" /></>),
  pen: (<><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></>),
  zon: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>),
  ster: (<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />),
  deur: (<><path d="M3 21V8l9-5 9 5v13" /><rect x="6" y="11" width="12" height="10" /><path d="M6 14h12M6 17h12" /></>),
  weg: (<><path d="M8 3L5 21M16 3l3 18" /><path d="M12 4v3M12 10v3M12 16v3" /></>),
  doos: (<><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></>),
  camera: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l2-3h4l2 3" /><circle cx="12" cy="13.5" r="3.5" /></>),
  pijl: (<path d="M12 4v15M6 13l6 6 6-6" />),
};

export const Icoon: React.FC<{ naam: string; size?: number; color?: string; width?: number }> = ({ naam, size = 48, color = "currentColor", width = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    {P[naam] ?? P.ster}
  </svg>
);
