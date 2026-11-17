import React from "react";

type P = { size?: number; color?: string };
const S: React.FC<P & { children: React.ReactNode }> = ({ size = 44, color = "#fff", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const Icon: React.FC<P & { name: string }> = ({ name, ...p }) => {
  switch (name) {
    case "pin":
      return <S {...p}><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.6" /></S>;
    case "landmark":
      return <S {...p}><path d="M3 21h18M5 21V10M9.5 21V10M14.5 21V10M19 21V10M2 10l10-6 10 6z" /></S>;
    case "x":
      return <S {...p}><path d="M6 6l12 12M18 6L6 18" /></S>;
    case "globe":
      return <S {...p}><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19" /></S>;
    case "vraag":
      return <S {...p}><circle cx="12" cy="12" r="9.5" /><path d="M9.3 9.2a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.2 1-1.2 1.9M12 17h.01" /></S>;
    case "info":
      return <S {...p}><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6M12 7.5h.01" /></S>;
    case "home":
      return <S {...p}><path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5" /></S>;
    case "sleutel":
      return <S {...p}><circle cx="8" cy="15" r="4.5" /><path d="M11.2 11.8L20 3M16.5 6.5l2.5 2.5M14 9l2 2" /></S>;
    case "gesprek":
      return <S {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z" /></S>;
    case "kalender":
      return <S {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></S>;
    case "check":
      return <S {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></S>;
    case "pijl":
      return <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>;
    case "omlaag":
      return <S {...p}><path d="M12 4v16M6 14l6 6 6-6" /></S>;
    default:
      return null;
  }
};
